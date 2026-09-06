"use client";

import { useEffect, useRef, useState } from "react";
import { EditorPane, Console, workspaceStore, useWorkspace, type CodeMirrorHandle } from "@khiye/editor";
import { PreviewFrame, type ConsoleEntry, type FileSet } from "@khiye/preview";
import { Button } from "@khiye/ui";
import dev from "../dev.module.css";

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
    <div className={dev.shell}>
      <div className={dev.bar}>
        <span className={dev.barTitle}>
          Editor <span className={dev.barTag}>E4</span>
        </span>
        <Button size="sm" variant="secondary" onClick={() => editorRef.current?.scrollToMarker("<!-- энд бичнэ үү -->")}>
          Marker руу очих
        </Button>
      </div>

      <div className={dev.split}>
        <div className={dev.paneLeft}>
          <EditorPane ref={editorRef} showTree showKeyStrip />
        </div>
        <div className={dev.paneRight}>
          <PreviewFrame files={files} entry="index.html" onConsole={(e) => setLogs((l) => [...l.slice(-30), e])} />
        </div>
      </div>

      <div style={{ minHeight: 0, height: 160 }}>
        <Console entries={logs} onClear={() => setLogs([])} />
      </div>
    </div>
  );
}
