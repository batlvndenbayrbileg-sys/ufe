"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import { CodeMirror, type CodeMirrorHandle } from "./CodeMirror";
import { EditorTabs } from "./EditorTabs";
import { FileTree } from "./FileTree";
import { MobileKeyStrip } from "./MobileKeyStrip";
import { languageForPath } from "./lib/language";
import { useWorkspace, workspaceStore } from "./store";

export interface EditorPaneProps {
  dark?: boolean;
  showTree?: boolean;
  showKeyStrip?: boolean;
  className?: string;
  /** Anti-cheat: block paste/drop so students type the code themselves. */
  blockPaste?: boolean;
  /** Fired when a paste/drop is blocked (for a UI hint). */
  onPasteBlocked?: () => void;
}

/** Store-connected editor: tabs + (optional) tree + CodeMirror + key strip.
 *  Forwards the active CodeMirror handle (scrollToMarker, etc.) for E7. */
export const EditorPane = forwardRef<CodeMirrorHandle, EditorPaneProps>(function EditorPane(
  { dark = false, showTree = false, showKeyStrip = false, className, blockPaste = false, onPasteBlocked },
  ref,
) {
  const cmRef = useRef<CodeMirrorHandle>(null);
  useImperativeHandle(ref, () => ({
    focus: () => cmRef.current?.focus(),
    scrollToMarker: (m) => cmRef.current?.scrollToMarker(m) ?? false,
    getValue: () => cmRef.current?.getValue() ?? "",
    insertAtCursor: (t, o) => cmRef.current?.insertAtCursor(t, o),
    undo: () => cmRef.current?.undo(),
    redo: () => cmRef.current?.redo(),
  }));

  const files = useWorkspace((s) => s.files);
  const activeFile = useWorkspace((s) => s.activeFile);
  const openTabs = useWorkspace((s) => s.openTabs);
  const visibleFiles = useWorkspace((s) => s.visibleFiles);
  const readOnlyFiles = useWorkspace((s) => s.readOnlyFiles);
  const dirty = useWorkspace((s) => s.dirty);

  const active = activeFile && files[activeFile] ? activeFile : null;
  const language = active ? languageForPath(active) : "text";
  const readOnly = active ? workspaceStore.getState().isReadOnly(active) : false;

  return (
    <div className={className} style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      <EditorTabs
        openTabs={openTabs}
        activeFile={active}
        dirtyPaths={dirty && active ? [active] : []}
        readOnlyPaths={readOnlyFiles}
        onSelect={(p) => workspaceStore.getState().setActive(p)}
        onClose={(p) => workspaceStore.getState().closeFile(p)}
      />
      <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
        {showTree ? (
          <div style={{ width: 180, borderRight: "1px solid var(--border,#e4e4e7)", flexShrink: 0 }}>
            <FileTree
              visibleFiles={visibleFiles}
              activeFile={active}
              readOnlyPaths={readOnlyFiles}
              onOpen={(p) => workspaceStore.getState().setActive(p)}
            />
          </div>
        ) : null}
        <div style={{ flex: 1, minWidth: 0, minHeight: 0 }}>
          {active ? (
            <CodeMirror
              key={active} // remount per file → per-file undo history
              ref={cmRef}
              value={files[active]!.content}
              language={language}
              dark={dark}
              readOnly={readOnly}
              ariaLabel={`${active} код засварлагч`}
              blockPaste={blockPaste}
              onPasteBlocked={onPasteBlocked}
              onChange={(v) => workspaceStore.getState().setFileContent(active, v)}
              onCursor={(pos) => workspaceStore.getState().setCursor(active, pos)}
            />
          ) : (
            <div style={{ padding: 24, color: "var(--text-muted,#71717a)" }}>Файл сонгоно уу.</div>
          )}
        </div>
      </div>
      {showKeyStrip && active ? (
        <MobileKeyStrip
          language={language}
          onInsert={(tok) => cmRef.current?.insertAtCursor(tok.insert, tok.cursorOffset)}
          onUndo={() => cmRef.current?.undo()}
          onRedo={() => cmRef.current?.redo()}
        />
      ) : null}
    </div>
  );
});
