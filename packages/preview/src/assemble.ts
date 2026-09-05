import { transpileJsx } from "@khiye/checkers/transpile";
import type { FileSet } from "./protocol";

const isJsx = (p: string) => /\.(jsx|tsx)$/.test(p);
/** Plain TypeScript: same strip, but it needs no React runtime. */
const isTs = (p: string) => /\.ts$/.test(p);
/** A `<script src>` the platform provides rather than the workspace. */
const isSqliteRuntime = (p: string) => /(^|\/)sqlite\.js$/.test(p);

export interface AssembleOptions {
  /** The pre-bundled harness IIFE, injected first so it runs before student code. */
  harnessJs: string;
  entry?: string;
  /** CDN base for rewriting relative asset paths (images/…). */
  cdnBase?: string;
  /** connect-src for the CSP meta. "'none'" until fetch lessons; then the lesson's allowlist. */
  connectSrc?: string;
  /** SQLite (sql.js, asm build) source, inlined where the page asks for it. */
  sqliteRuntime?: string;
  /**
   * React + ReactDOM, inlined for JSX lessons. Fetched by the host rather than
   * bundled: it is 180 KB that lessons without JSX must not pay for.
   */
  reactRuntime?: string;
  /**
   * Seed for the harness's localStorage shim. Inlined (not postMessaged) because
   * student code reads storage on its very first line, long before any async
   * message could arrive.
   */
  storage?: Record<string, string>;
  /**
   * Identifies this srcdoc. The harness echoes it on every message so the host
   * can tell a live page from one it has already replaced.
   */
  gen?: number;
}

function escAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function pickEntry(files: FileSet, entry?: string): string {
  if (entry && files[entry]) return files[entry].content;
  const key = Object.keys(files).find((k) => k.endsWith(".html"));
  return key ? files[key]!.content : "<!doctype html><html><head></head><body></body></html>";
}

const norm = (p: string) => p.replace(/^\.?\//, "");

/**
 * Assemble a Tier-1 srcdoc: harness first, CSS inlined into hot-swappable
 * `<style data-khiye-css>` blocks, classic scripts inlined (global scope), a
 * strict CSP meta, and a `<base>` so relative asset paths resolve to the CDN.
 * Pure and Unicode-safe (no blob/btoa) → runs identically in Node and browser.
 * (docs/blueprint/07 §7.4, 12 §12.2)
 */
export function assembleSrcdoc(files: FileSet, opts: AssembleOptions): string {
  const fileByPath = (p: string) => files[p] ?? files[norm(p)];
  let html = pickEntry(files, opts.entry);

  // 1. Inline <link rel="stylesheet"> as a hot-swappable managed <style>.
  html = html.replace(/<link\b[^>]*\bhref=["']([^"']+)["'][^>]*>/gi, (tag, href: string) => {
    if (!/stylesheet/i.test(tag)) return tag;
    const css = fileByPath(href);
    return css ? `<style data-khiye-css="${escAttr(norm(href))}">\n${css.content}\n</style>` : tag;
  });

  // 2. Inline <script src> as a classic inline script (global scope for Tier 1),
  //    transpiling JSX/TSX so React lessons preview without a build step.
  let needsReact = false;
  html = html.replace(
    /<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>\s*<\/script>/gi,
    (tag, src: string) => {
      const js = fileByPath(src);
      if (!js) {
        // The SQL lessons reference a runtime the platform supplies, not a file
        // in the workspace — 1.4 MB of SQLite has no business in a lesson patch.
        if (isSqliteRuntime(src) && opts.sqliteRuntime) {
          return `<script>\n${opts.sqliteRuntime}\n</script>`;
        }
        return tag;
      }
      if (isTs(src)) {
        return `<script>
${transpileJsx(js.content, src)}
</script>`;
      }
      if (isJsx(src)) {
        needsReact = true;
        return `<script>\n${transpileJsx(js.content, src)}\n</script>`;
      }
      const isModule = /type=["']module["']/i.test(tag);
      return `<script${isModule ? ' type="module"' : ""}>\n${js.content}\n</script>`;
    },
  );

  // 3. Rewrite relative asset paths to the CDN (optional).
  if (opts.cdnBase) {
    const base = opts.cdnBase.replace(/\/$/, "");
    html = html.replace(/(\bsrc=["'])(?!https?:|data:|\/\/)([^"']+)(["'])/gi, (_m, a, path, b) =>
      /\.(png|jpe?g|webp|gif|svg|avif)$/i.test(path) ? `${a}${base}/${norm(path)}${b}` : `${a}${path}${b}`,
    );
  }

  // Ensure a document shell exists.
  if (!/<html[\s>]/i.test(html)) {
    html = `<!doctype html><html><head></head><body>\n${html}\n</body></html>`;
  }

  const cspMeta =
    `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; ` +
    `img-src ${opts.cdnBase ? escAttr(opts.cdnBase) + " " : ""}data: https:; ` +
    `style-src 'unsafe-inline'; script-src 'unsafe-inline'; font-src data: https:; ` +
    `connect-src ${opts.connectSrc ?? "'none'"};">`;

  // JSON.stringify is safe to inline as long as "</script>" can't close the tag.
  const storageSeed = opts.storage
    ? `<script>window.__khiyeStorage = ${JSON.stringify(opts.storage).replace(/</g, "\\u003c")};</script>\n`
    : "";

  const genSeed = opts.gen === undefined ? "" : `<script>window.__khiyeGen = ${opts.gen};</script>\n`;

  const head =
    `${cspMeta}\n<base href="${escAttr(opts.cdnBase ?? "about:blank")}">\n` +
    genSeed +
    storageSeed +
    `<script>\n${opts.harnessJs}\n</script>` +
    (needsReact && opts.reactRuntime ? `\n<script>\n${opts.reactRuntime}\n</script>` : "");

  // Inject head content right after <head>, or synthesize a <head>.
  if (/<head[\s>]/i.test(html)) {
    html = html.replace(/<head(\s[^>]*)?>/i, (m) => `${m}\n${head}\n`);
  } else {
    html = html.replace(/<html(\s[^>]*)?>/i, (m) => `${m}<head>\n${head}\n</head>`);
  }

  return html;
}

/** Which files changed between two sets, and whether the change is CSS-only. */
export function diffFiles(prev: FileSet | null, next: FileSet): { changed: string[]; cssOnly: boolean } {
  if (!prev) return { changed: Object.keys(next), cssOnly: false };
  const changed: string[] = [];
  const keys = new Set([...Object.keys(prev), ...Object.keys(next)]);
  for (const k of keys) {
    if (prev[k]?.content !== next[k]?.content) changed.push(k);
  }
  const cssOnly = changed.length > 0 && changed.every((k) => k.endsWith(".css"));
  return { changed, cssOnly };
}
