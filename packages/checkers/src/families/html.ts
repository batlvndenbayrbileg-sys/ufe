import { registerChecker } from "../registry";
import { fail, pass, type CheckerContext } from "../types";

const VOID_ELEMENTS = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input",
  "link", "meta", "param", "source", "track", "wbr",
]);

function findHtml(ctx: CheckerContext, file?: string): string | null {
  if (file && ctx.files[file]) return ctx.files[file].content;
  const htmlKey = Object.keys(ctx.files).find((k) => k.endsWith(".html"));
  return htmlKey ? ctx.files[htmlKey]!.content : null;
}

/** Lightweight tag-balance validator — catches unclosed/mismatched tags. */
export function validateHtml(source: string): { ok: boolean; error?: string } {
  const stripped = source.replace(/<!--[\s\S]*?-->/g, "").replace(/<!doctype[^>]*>/gi, "");
  const tagRe = /<(\/?)([a-zA-Z][\w-]*)((?:"[^"]*"|'[^']*'|[^'">])*)>/g;
  const stack: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = tagRe.exec(stripped))) {
    const closing = m[1] === "/";
    const tag = m[2]!.toLowerCase();
    const attrs = m[3] ?? "";
    if (VOID_ELEMENTS.has(tag)) continue;
    if (attrs.trimEnd().endsWith("/")) continue; // self-closing
    if (closing) {
      if (stack.length === 0) return { ok: false, error: `unexpected </${tag}>` };
      const open = stack.pop();
      if (open !== tag) return { ok: false, error: `expected </${open}> but found </${tag}>` };
    } else {
      stack.push(tag);
    }
  }
  if (stack.length > 0) return { ok: false, error: `unclosed <${stack[stack.length - 1]}>` };
  return { ok: true };
}

registerChecker("html.valid", (args, ctx) => {
  const source = findHtml(ctx, args.file as string | undefined);
  if (source === null) return fail("no HTML file", "an .html file to validate");
  const result = validateHtml(source);
  return result.ok ? pass() : fail(result.error, "well-formed HTML (all tags closed)");
});
