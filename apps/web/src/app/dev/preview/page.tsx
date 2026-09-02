"use client";

import { useMemo, useRef, useState } from "react";
import {
  PreviewFrame,
  type ConsoleEntry,
  type FileSet,
  type HarnessCheckResult,
  type PreviewHostHandle,
} from "@khiye/preview";

const START_HTML = `<!doctype html>
<html>
  <head><link rel="stylesheet" href="styles/main.css"></head>
  <body>
    <main>
      <h1>Shop.mn</h1>
      <button id="add" data-testid="add">Сагсанд хийх</button>
      <span data-testid="count">0</span>
    </main>
    <script src="js/main.js"></script>
  </body>
</html>`;

const START_CSS = `body{font-family:system-ui;padding:24px}
h1{color:#2563eb}
button{padding:8px 14px;border-radius:6px;border:1px solid #ccc;cursor:pointer}`;

const START_JS = `let n = 0;
document.getElementById('add').addEventListener('click', () => {
  n++;
  document.querySelector('[data-testid=count]').textContent = String(n);
});`;

export default function DevPreviewPage() {
  const [html, setHtml] = useState(START_HTML);
  const [css, setCss] = useState(START_CSS);
  const [js, setJs] = useState(START_JS);
  const [logs, setLogs] = useState<ConsoleEntry[]>([]);
  const [results, setResults] = useState<HarnessCheckResult[] | null>(null);
  const previewRef = useRef<PreviewHostHandle>(null);

  const files: FileSet = useMemo(
    () => ({
      "index.html": { content: html },
      "styles/main.css": { content: css },
      "js/main.js": { content: js },
    }),
    [html, css, js],
  );

  const runChecks = async () => {
    const r = await previewRef.current?.runChecks([
      { id: "c1", type: "dom.exists", args: { selector: "main h1" } },
      { id: "c2", type: "dom.text", args: { selector: "h1", contains: "Shop.mn" } },
      { id: "c3", type: "js.interaction", args: { steps: [
        { click: "[data-testid=add]" },
        { expectText: { selector: "[data-testid=count]", equals: "1" } },
      ] } },
      { id: "c4", type: "css.numeric", args: { selector: "button", prop: "padding-left", min: 8 } },
    ]);
    setResults(r ?? []);
  };

  const cell: React.CSSProperties = { display: "flex", flexDirection: "column", minHeight: 0 };
  const ta: React.CSSProperties = {
    flex: 1,
    fontFamily: "var(--font-mono, monospace)",
    fontSize: 12,
    padding: 8,
    border: "1px solid var(--border,#e4e4e7)",
    borderRadius: 6,
    resize: "none",
    background: "var(--code-bg,#fafafa)",
    color: "var(--code-text,#111)",
  };

  return (
    <main style={{ height: "100dvh", display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "auto 1fr 200px", gap: 8, padding: 12 }}>
      <div style={{ gridColumn: "1 / -1", display: "flex", gap: 8, alignItems: "center" }}>
        <strong>Хийе Preview (E5)</strong>
        <button onClick={runChecks} style={{ padding: "6px 14px", borderRadius: 6, background: "var(--accent,#2563eb)", color: "#fff", border: 0, cursor: "pointer" }}>
          ✓ Шалгах
        </button>
        <button onClick={() => setJs(js + "\nwhile(true){}")} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid var(--border,#ddd)", cursor: "pointer" }}>
          ∞ давталт нэмэх (watchdog тест)
        </button>
        {results ? (
          <span style={{ fontSize: 13 }}>
            {results.map((r) => (
              <span key={r.id} style={{ marginRight: 10, color: r.passed ? "var(--success,#16a34a)" : "var(--danger,#dc2626)" }}>
                {r.passed ? "✓" : "✗"} {r.id}
              </span>
            ))}
          </span>
        ) : null}
      </div>

      <div style={{ ...cell, gap: 6 }}>
        <label style={{ fontSize: 11 }}>index.html</label>
        <textarea value={html} onChange={(e) => setHtml(e.target.value)} style={ta} spellCheck={false} />
        <label style={{ fontSize: 11 }}>styles/main.css (edit → hot-swap, no reload)</label>
        <textarea value={css} onChange={(e) => setCss(e.target.value)} style={{ ...ta, flex: 0.7 }} spellCheck={false} />
        <label style={{ fontSize: 11 }}>js/main.js</label>
        <textarea value={js} onChange={(e) => setJs(e.target.value)} style={{ ...ta, flex: 0.7 }} spellCheck={false} />
      </div>

      <div style={{ ...cell, border: "1px solid var(--border,#e4e4e7)", borderRadius: 8, overflow: "hidden" }}>
        <PreviewFrame
          ref={previewRef}
          files={files}
          entry="index.html"
          onConsole={(e) => setLogs((l) => [...l.slice(-40), e])}
          onError={(e) => setLogs((l) => [...l.slice(-40), { level: "error", args: [e.message], time: Date.now() }])}
        />
      </div>

      <div style={{ gridColumn: "1 / -1", overflow: "auto", background: "var(--code-bg,#0d0d0f)", color: "#ddd", borderRadius: 6, padding: 8, fontFamily: "monospace", fontSize: 12 }}>
        {logs.length === 0 ? <span style={{ opacity: 0.5 }}>Console…</span> : null}
        {logs.map((l, i) => (
          <div key={i} style={{ color: l.level === "error" ? "#ff6b6b" : l.level === "warn" ? "#ffd166" : "#ddd" }}>
            [{l.level}] {l.args.join(" ")}
          </div>
        ))}
      </div>
    </main>
  );
}
