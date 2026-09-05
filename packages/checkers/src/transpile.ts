import { transform } from "sucrase";

/**
 * JSX/TS → JS. Deliberately free of any import of the React runtime: the
 * browser preview needs this function on every lesson, and would otherwise
 * pull 180 KB of React into the bundle for lessons that have no JSX at all.
 */

/**
 * Rewrite `import ... from "react" | "react-dom/client"` onto the inlined
 * globals, so students write IDIOMATIC React (`import { useState } from "react"`)
 * even though Tier 1 has no bundler.
 */
function shimReactImports(code: string): string {
  const rewrite = (clause: string, globalName: string): string => {
    const out: string[] = [];
    const ns = clause.match(/\*\s+as\s+(\w+)/);
    // Never alias a name onto itself (`const React = React` is a TDZ error) —
    // the global is already in scope.
    if (ns) return ns[1] === globalName ? "" : `const ${ns[1]} = ${globalName};`;
    const named = clause.match(/\{([^}]*)\}/);
    const def = clause.replace(/\{[^}]*\}/, "").replace(/,/g, "").trim();
    if (def && def !== globalName) out.push(`const ${def} = ${globalName};`);
    if (named && named[1]!.trim()) out.push(`const {${named[1]}} = ${globalName};`);
    return out.join("\n");
  };
  return code
    .replace(/import\s+([^;"']+?)\s+from\s+["']react["']\s*;?/g, (_m, c: string) => rewrite(c, "React"))
    .replace(/import\s+([^;"']+?)\s+from\s+["']react-dom(?:\/client)?["']\s*;?/g, (_m, c: string) =>
      rewrite(c, "ReactDOM"),
    )
    .replace(/^\s*import\s+["']react["']\s*;?$/gm, "");
}

/** Transpile JSX/TSX to plain JS using the classic runtime (window.React). */
export function transpileJsx(code: string, path: string): string {
  code = shimReactImports(code);
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
