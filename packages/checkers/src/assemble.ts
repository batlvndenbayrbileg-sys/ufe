import { transform } from "sucrase";
import { REACT_RUNTIME_JS } from "./react-runtime.generated";
import type { FileSet } from "./types";

/** Transpile JSX/TSX to plain JS using the classic runtime (window.React). */
export function transpileJsx(code: string, path: string): string {
  const transforms: Array<"jsx" | "typescript"> = ["jsx"];
  if (path.endsWith(".tsx") || path.endsWith(".ts")) transforms.push("typescript");
  try {
    return transform(code, { transforms, jsxRuntime: "classic", production: true }).code;
  } catch (e) {
    // Surface syntax errors inside the page so the student sees a real message.
    const msg = e instanceof Error ? e.message : String(e);
    return `console.error(${JSON.stringify("JSX алдаа: " + msg)});`;
  }
}

const isJsx = (p: string) => /\.(jsx|tsx)$/.test(p);

/**
 * Assemble a single HTML string from a Tier-1 workspace, inlining referenced
 * CSS (<link>) and JS (<script src>) from the FileSet so a DOM with no file
 * loading (happy-dom on the server, srcdoc in the browser) renders correctly.
 * Mirrors the browser preview assembler (E5).
 */
export function assembleHtml(files: FileSet, entry = "index.html"): string {
  let html = files[entry]?.content;
  if (html === undefined) {
    const key = Object.keys(files).find((k) => k.endsWith(".html"));
    html = key ? files[key]!.content : "<!doctype html><html><head></head><body></body></html>";
  }

  const norm = (p: string) => p.replace(/^\.?\//, "");
  const fileByPath = (p: string) => files[p] ?? files[norm(p)];

  // Inline <link rel="stylesheet" href="...">
  html = html.replace(
    /<link\b[^>]*\bhref=["']([^"']+)["'][^>]*>/gi,
    (tag, href: string) => {
      if (!/stylesheet/i.test(tag)) return tag;
      const css = fileByPath(href);
      return css ? `<style>\n${css.content}\n</style>` : tag;
    },
  );

  // Inline <script src="..."></script>, transpiling JSX/TSX on the way.
  let needsReact = false;
  html = html.replace(
    /<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>\s*<\/script>/gi,
    (tag, src: string) => {
      const js = fileByPath(src);
      if (!js) return tag;
      const isModule = /type=["']module["']/i.test(tag);
      if (isJsx(src)) {
        needsReact = true;
        return `<script>\n${transpileJsx(js.content, src)}\n</script>`;
      }
      return `<script${isModule ? ' type="module"' : ""}>\n${js.content}\n</script>`;
    },
  );

  // React lessons run entirely offline: the runtime is inlined, no CDN needed.
  if (needsReact) {
    html = html.replace(/<script>/i, `<script>\n${REACT_RUNTIME_JS}\n</script>\n<script>`);
  }

  if (!/<html[\s>]/i.test(html)) {
    html = `<!doctype html><html><head></head><body>\n${html}\n</body></html>`;
  }
  return html;
}

export { REACT_RUNTIME_JS, REACT_RUNTIME_BYTES } from "./react-runtime.generated";
