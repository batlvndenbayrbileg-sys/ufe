import type { LanguageName } from "./language";

export interface KeyStripToken {
  label: string;
  insert: string;
  /** Cursor offset from the end of `insert` (e.g. -1 to sit inside a pair). */
  cursorOffset?: number;
}

const COMMON: KeyStripToken[] = [
  { label: "Tab", insert: "  " },
  { label: "{", insert: "{}", cursorOffset: -1 },
  { label: "}", insert: "}" },
  { label: "(", insert: "()", cursorOffset: -1 },
  { label: ")", insert: ")" },
  { label: "[", insert: "[]", cursorOffset: -1 },
  { label: "'", insert: "''", cursorOffset: -1 },
  { label: '"', insert: '""', cursorOffset: -1 },
  { label: ";", insert: ";" },
  { label: "=", insert: "=" },
  { label: "_", insert: "_" },
];

const HTML: KeyStripToken[] = [
  { label: "<", insert: "<" },
  { label: ">", insert: ">" },
  { label: "</>", insert: "</>", cursorOffset: -2 },
  { label: "/", insert: "/" },
];

const JS: KeyStripToken[] = [
  { label: "=>", insert: "=> " },
  { label: "$", insert: "$" },
  { label: "`", insert: "``", cursorOffset: -1 },
];

/** Context-aware mobile key strip (docs/blueprint/07 §7.6). */
export function keyStripFor(language: LanguageName): KeyStripToken[] {
  if (language === "html") return [...HTML, ...COMMON];
  if (language === "css") return [{ label: ":", insert: ": " }, { label: "-", insert: "-" }, ...COMMON];
  if (language === "json") return COMMON;
  return [...JS, ...COMMON]; // js/ts/jsx/tsx/text
}
