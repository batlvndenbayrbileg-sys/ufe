"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { Compartment, EditorState, StateEffect, StateField } from "@codemirror/state";
import {
  Decoration,
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLine,
  highlightActiveLineGutter,
  drawSelection,
  type DecorationSet,
} from "@codemirror/view";
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
  redo,
  undo,
} from "@codemirror/commands";
import {
  bracketMatching,
  foldGutter,
  foldKeymap,
  indentOnInput,
} from "@codemirror/language";
import { closeBrackets, closeBracketsKeymap, autocompletion, completionKeymap } from "@codemirror/autocomplete";
import { searchKeymap, highlightSelectionMatches } from "@codemirror/search";
import { languageExtension, type LanguageName } from "./lib/language";
import { findMarker, intersectsRange, type Range } from "./lib/marker";
import { khiyeEditorTheme, khiyeHighlight } from "./theme";

export interface CodeMirrorHandle {
  focus(): void;
  scrollToMarker(marker: string): boolean;
  getValue(): string;
  insertAtCursor(text: string, cursorOffset?: number): void;
  undo(): void;
  redo(): void;
}

export interface CodeMirrorProps {
  value: string;
  language: LanguageName;
  dark?: boolean;
  readOnly?: boolean;
  /** Character ranges the student may not edit (docs/blueprint/07 §7.2). */
  readOnlyRanges?: Range[];
  onChange?: (value: string) => void;
  onCursor?: (pos: number) => void;
  ariaLabel?: string;
  /** Anti-cheat: block paste/drop so students type the code themselves. */
  blockPaste?: boolean;
  /** Fired when a paste/drop is blocked (for a UI hint). */
  onPasteBlocked?: () => void;
}

// A one-shot pulse decoration for marker anchoring.
const addPulse = StateEffect.define<Range>();
const clearPulse = StateEffect.define<null>();
const pulseField = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(deco, tr) {
    deco = deco.map(tr.changes);
    for (const e of tr.effects) {
      if (e.is(addPulse)) {
        deco = Decoration.set([Decoration.mark({ class: "cm-marker-pulse" }).range(e.value.from, e.value.to)]);
      } else if (e.is(clearPulse)) {
        deco = Decoration.none;
      }
    }
    return deco;
  },
  provide: (f) => EditorView.decorations.from(f),
});

export const CodeMirror = forwardRef<CodeMirrorHandle, CodeMirrorProps>(function CodeMirror(
  { value, language, dark = false, readOnly = false, readOnlyRanges = [], onChange, onCursor, ariaLabel, blockPaste = false, onPasteBlocked },
  ref,
) {
  const hostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const langComp = useRef(new Compartment());
  const themeComp = useRef(new Compartment());
  const roComp = useRef(new Compartment());
  const onChangeRef = useRef(onChange);
  const onCursorRef = useRef(onCursor);
  const rangesRef = useRef<Range[]>(readOnlyRanges);
  const blockPasteRef = useRef(blockPaste);
  const onPasteBlockedRef = useRef(onPasteBlocked);
  onChangeRef.current = onChange;
  onCursorRef.current = onCursor;
  rangesRef.current = readOnlyRanges;
  blockPasteRef.current = blockPaste;
  onPasteBlockedRef.current = onPasteBlocked;

  // Mount once.
  useEffect(() => {
    if (!hostRef.current) return;
    const readOnlyGuard = EditorState.transactionFilter.of((tr) => {
      if (!tr.docChanged) return tr;
      // Anti-cheat: reject paste/drop-originated edits outright, whatever the
      // DOM-event ordering — students must type the code themselves.
      if (blockPasteRef.current && (tr.isUserEvent("input.paste") || tr.isUserEvent("input.drop"))) {
        onPasteBlockedRef.current?.();
        return [];
      }
      let blocked = false;
      tr.changes.iterChangedRanges((fromA, toA) => {
        if (intersectsRange(fromA, toA, rangesRef.current)) blocked = true;
      });
      return blocked ? [] : tr;
    });

    const state = EditorState.create({
      doc: value,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightActiveLine(),
        drawSelection(),
        history(),
        foldGutter(),
        indentOnInput(),
        bracketMatching(),
        closeBrackets(),
        autocompletion(),
        highlightSelectionMatches(),
        pulseField,
        keymap.of([
          ...closeBracketsKeymap,
          ...defaultKeymap,
          ...searchKeymap,
          ...historyKeymap,
          ...foldKeymap,
          ...completionKeymap,
          indentWithTab,
        ]),
        langComp.current.of(languageExtension(language)),
        themeComp.current.of([khiyeEditorTheme(dark), khiyeHighlight(dark)]),
        roComp.current.of(readOnly ? EditorState.readOnly.of(true) : []),
        readOnlyGuard,
        // Anti-cheat: swallow paste & drop so answers are typed by hand.
        EditorView.domEventHandlers({
          paste(event) {
            if (!blockPasteRef.current) return false;
            event.preventDefault();
            onPasteBlockedRef.current?.();
            return true;
          },
          drop(event) {
            if (!blockPasteRef.current) return false;
            event.preventDefault();
            onPasteBlockedRef.current?.();
            return true;
          },
        }),
        EditorView.lineWrapping,
        EditorView.updateListener.of((u) => {
          if (u.docChanged) onChangeRef.current?.(u.state.doc.toString());
          if (u.selectionSet) onCursorRef.current?.(u.state.selection.main.head);
        }),
        EditorView.contentAttributes.of({
          "aria-label": ariaLabel ?? "Код засварлагч",
          autocorrect: "off",
          autocapitalize: "off",
          spellcheck: "false",
        }),
      ],
    });
    const view = new EditorView({ state, parent: hostRef.current });
    viewRef.current = view;
    return () => view.destroy();
  }, []);

  // Sync external value (only when it diverges — avoids clobbering typing).
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    if (value !== view.state.doc.toString()) {
      view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value } });
    }
  }, [value]);

  useEffect(() => {
    viewRef.current?.dispatch({ effects: langComp.current.reconfigure(languageExtension(language)) });
  }, [language]);

  useEffect(() => {
    viewRef.current?.dispatch({
      effects: themeComp.current.reconfigure([khiyeEditorTheme(dark), khiyeHighlight(dark)]),
    });
  }, [dark]);

  useEffect(() => {
    viewRef.current?.dispatch({
      effects: roComp.current.reconfigure(readOnly ? EditorState.readOnly.of(true) : []),
    });
  }, [readOnly]);

  useImperativeHandle(ref, () => ({
    focus: () => viewRef.current?.focus(),
    getValue: () => viewRef.current?.state.doc.toString() ?? "",
    scrollToMarker: (marker) => {
      const view = viewRef.current;
      if (!view) return false;
      const found = findMarker(view.state.doc.toString(), marker);
      if (!found) return false;
      view.dispatch({
        selection: { anchor: found.to },
        effects: [EditorView.scrollIntoView(found.from, { y: "center" }), addPulse.of(found)],
      });
      view.focus();
      setTimeout(() => view.dispatch({ effects: clearPulse.of(null) }), 700);
      return true;
    },
    insertAtCursor: (text, cursorOffset = 0) => {
      const view = viewRef.current;
      if (!view) return;
      const pos = view.state.selection.main.head;
      view.dispatch({
        changes: { from: pos, insert: text },
        selection: { anchor: pos + text.length + cursorOffset },
      });
      view.focus();
    },
    undo: () => { if (viewRef.current) undo(viewRef.current); },
    redo: () => { if (viewRef.current) redo(viewRef.current); },
  }));

  return <div ref={hostRef} style={{ height: "100%", overflow: "hidden" }} />;
});
