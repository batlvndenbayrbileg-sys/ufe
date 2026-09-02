"use client";

import { useEffect, useRef, useState } from "react";
import { EditorPane, Console, workspaceStore, useWorkspace, type CodeMirrorHandle } from "@khiye/editor";
import { PreviewFrame, type ConsoleEntry, type FileSet } from "@khiye/preview";

const INITIAL = {
  "index.html": {
    content: `<!doctype html>
<html>
  <head><link rel="stylesheet" href="styles/main.css"></head>
  <body>
    <main>
      <!-- энд бичнэ үү -->
      <h1>Shop.mn</h1>
    </main>
    <script src="js/main.js"></script>
  </body>
</html>`,
  },
  "styles/main.css": { content: "body{font-family:system-ui;padding:24px}\nh1{color:#2563eb}" },
  "js/main.js": { content: "console.log('Сайн уу, Shop.mn!');" },
};

export default function DevEditorPage() {
  const [ready, setReady] = useState(false);
  const [logs, setLogs] = useState<ConsoleEntry[]>([]);
  const editorRef = useRef<CodeMirrorHandle>(null);

  useEffect(() => {
    workspaceStore.getState().init({
      courseId: "demo",
      files: INITIAL,
      visibleFiles: ["index.html", "styles/main.css", "js/main.js"],
      openFiles: ["index.html"],
      activeFile: "index.html",
    });
    setReady(true);
  }, []);

  const files = useWorkspace((s) => s.files) as FileSet;

  if (!ready) return null;

  return (
    <div style={{ height: "100dvh", display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "auto 1fr 160px" }}>
      <div style={{ gridColumn: "1 / -1", display: "flex", gap: 8, alignItems: "center", padding: 8, borderBottom: "1px solid var(--border,#e4e4e7)" }}>
        <strong>Хийе Editor (E4)</strong>
        <button
          onClick={() => editorRef.current?.scrollToMarker("<!-- энд бичнэ үү -->")}
          style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid var(--border,#ddd)", cursor: "pointer", fontSize: 12 }}
        >
          Marker руу очих
        </button>
      </div>

      <div style={{ minHeight: 0, borderRight: "1px solid var(--border,#e4e4e7)" }}>
        <EditorPane ref={editorRef} showTree showKeyStrip />
      </div>

      <div style={{ minHeight: 0 }}>
        <PreviewFrame files={files} entry="index.html" onConsole={(e) => setLogs((l) => [...l.slice(-30), e])} />
      </div>

      <div style={{ gridColumn: "1 / -1", minHeight: 0 }}>
        <Console entries={logs} onClear={() => setLogs([])} />
      </div>
    </div>
  );
}
