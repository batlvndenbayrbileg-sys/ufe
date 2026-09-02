import type { Extension } from "@codemirror/state";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { javascript } from "@codemirror/lang-javascript";
import { json } from "@codemirror/lang-json";

export type LanguageName = "html" | "css" | "javascript" | "typescript" | "jsx" | "tsx" | "json" | "text";

const EXT_MAP: Record<string, LanguageName> = {
  html: "html",
  htm: "html",
  css: "css",
  js: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  jsx: "jsx",
  ts: "typescript",
  tsx: "tsx",
  json: "json",
};

/** Language name for a file path (pure — used by the UI and tested in Node). */
export function languageForPath(path: string): LanguageName {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  return EXT_MAP[ext] ?? "text";
}

/** The matching CodeMirror language extension (browser). */
export function languageExtension(name: LanguageName): Extension {
  switch (name) {
    case "html":
      return html();
    case "css":
      return css();
    case "javascript":
      return javascript();
    case "jsx":
      return javascript({ jsx: true });
    case "typescript":
      return javascript({ typescript: true });
    case "tsx":
      return javascript({ jsx: true, typescript: true });
    case "json":
      return json();
    case "text":
      return [];
  }
}
