import type { Extension } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";

/** Editor chrome — colours come from the design-system tokens so it follows
 *  the app theme automatically (docs/blueprint/14 §14.2). */
export const khiyeEditorTheme = (dark: boolean): Extension =>
  EditorView.theme(
    {
      "&": {
        color: "var(--code-text, #18181b)",
        backgroundColor: "var(--code-bg, #fafafa)",
        fontSize: "13px",
        height: "100%",
      },
      ".cm-content": {
        fontFamily: "var(--font-mono, ui-monospace, monospace)",
        lineHeight: "1.6",
        caretColor: "var(--accent, #2563eb)",
        padding: "8px 0",
      },
      ".cm-scroller": { fontFamily: "var(--font-mono, ui-monospace, monospace)" },
      "&.cm-focused": { outline: "none" },
      ".cm-gutters": {
        backgroundColor: "var(--code-bg, #fafafa)",
        color: "var(--text-subtle, #a1a1aa)",
        border: "none",
      },
      ".cm-activeLineGutter": { backgroundColor: "transparent", color: "var(--text-muted, #71717a)" },
      ".cm-activeLine": { backgroundColor: "color-mix(in srgb, var(--accent, #2563eb) 6%, transparent)" },
      ".cm-selectionBackground, ::selection": {
        backgroundColor: "var(--accent-subtle, #eff6ff) !important",
      },
      ".cm-cursor": { borderLeftColor: "var(--accent, #2563eb)" },
      ".cm-matchingBracket": {
        backgroundColor: "color-mix(in srgb, var(--accent, #2563eb) 20%, transparent)",
        outline: "1px solid color-mix(in srgb, var(--accent, #2563eb) 50%, transparent)",
      },
      ".cm-readonly-range": {
        backgroundColor: "color-mix(in srgb, var(--text-subtle, #a1a1aa) 12%, transparent)",
      },
      ".cm-marker-pulse": {
        backgroundColor: "color-mix(in srgb, var(--accent, #2563eb) 22%, transparent)",
        transition: "background-color 600ms ease",
      },
    },
    { dark },
  );

const LIGHT = HighlightStyle.define([
  { tag: t.keyword, color: "#7c3aed" },
  { tag: [t.string, t.special(t.string)], color: "#0a7a35" },
  { tag: [t.number, t.bool, t.null], color: "#9a5b00" },
  { tag: t.comment, color: "#71717a", fontStyle: "italic" },
  { tag: [t.function(t.variableName), t.labelName], color: "#1f44c8" },
  { tag: [t.tagName, t.heading], color: "#c81e1e" },
  { tag: [t.attributeName, t.propertyName], color: "#1735a0" },
  { tag: [t.definition(t.variableName), t.variableName], color: "#18181b" },
  { tag: t.operator, color: "#71717a" },
]);

const DARK = HighlightStyle.define([
  { tag: t.keyword, color: "#a78bfa" },
  { tag: [t.string, t.special(t.string)], color: "#5fcb92" },
  { tag: [t.number, t.bool, t.null], color: "#d9a24b" },
  { tag: t.comment, color: "#6e7a8a", fontStyle: "italic" },
  { tag: [t.function(t.variableName), t.labelName], color: "#7a9bff" },
  { tag: [t.tagName, t.heading], color: "#f08a8a" },
  { tag: [t.attributeName, t.propertyName], color: "#93c5fd" },
  { tag: [t.definition(t.variableName), t.variableName], color: "#e4e4e7" },
  { tag: t.operator, color: "#a1a1aa" },
]);

export const khiyeHighlight = (dark: boolean): Extension =>
  syntaxHighlighting(dark ? DARK : LIGHT);
