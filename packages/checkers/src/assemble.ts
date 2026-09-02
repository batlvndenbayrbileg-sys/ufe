import type { FileSet } from "./types";

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

  // Inline <script src="..."></script>
  html = html.replace(
    /<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>\s*<\/script>/gi,
    (tag, src: string) => {
      const js = fileByPath(src);
      if (!js) return tag;
      const isModule = /type=["']module["']/i.test(tag);
      return `<script${isModule ? ' type="module"' : ""}>\n${js.content}\n</script>`;
    },
  );

  if (!/<html[\s>]/i.test(html)) {
    html = `<!doctype html><html><head></head><body>\n${html}\n</body></html>`;
  }
  return html;
}
