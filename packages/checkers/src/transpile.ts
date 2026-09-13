import { transform } from "sucrase";

/**
 * JSX/TS → JS. Deliberately free of any import of the React runtime: the
 * browser preview needs this function on every lesson, and would otherwise
 * pull 180 KB of React into the bundle for lessons that have no JSX at all.
 */

/**
 * Rewrite `import ... from "react" | "react-dom/client"` — and the React Native
 * family (`react-native`, `expo`, `expo-status-bar`, AsyncStorage) — onto the
 * inlined globals, so students write IDIOMATIC code (`import { useState } from
 * "react"`, `import { View } from "react-native"`) even though Tier 1 has no
 * bundler. The RN specifiers map onto window.ReactNative etc. from the shim
 * (packages/checkers/scripts/rn-runtime.src.js).
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
  // module specifier → the global the shim exposes. Order matters only in that
  // each regex pins the specifier with quotes, so "react" never eats
  // "react-native"/"react-dom".
  const modules: Array<[RegExp, string]> = [
    [/import\s+([^;"']+?)\s+from\s+["']react["']\s*;?/g, "React"],
    [/import\s+([^;"']+?)\s+from\s+["']react-dom(?:\/client)?["']\s*;?/g, "ReactDOM"],
    [/import\s+([^;"']+?)\s+from\s+["']react-native["']\s*;?/g, "ReactNative"],
    [/import\s+([^;"']+?)\s+from\s+["']expo-status-bar["']\s*;?/g, "ExpoStatusBar"],
    [/import\s+([^;"']+?)\s+from\s+["']expo["']\s*;?/g, "Expo"],
    [/import\s+([^;"']+?)\s+from\s+["']@react-native-async-storage\/async-storage["']\s*;?/g, "RNAsyncStorage"],
  ];
  let out = code;
  for (const [re, global] of modules) out = out.replace(re, (_m, c: string) => rewrite(c, global));
  // Bare side-effect imports we can simply drop.
  return out.replace(/^\s*import\s+["'](?:react|react-native|expo|expo-status-bar)["']\s*;?$/gm, "");
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
