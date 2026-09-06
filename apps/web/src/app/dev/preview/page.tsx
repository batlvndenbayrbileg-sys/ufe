"use client";

import { useMemo, useRef, useState } from "react";
import {
  PreviewFrame,
  type ConsoleEntry,
  type FileSet,
  type HarnessCheckResult,
  type PreviewHostHandle,
} from "@khiye/preview";
import { Button } from "@khiye/ui";
import dev from "../dev.module.css";

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

  return (
    <div className={dev.shell}>
      <div className={dev.bar}>
        <span className={dev.barTitle}>
          Preview <span className={dev.barTag}>E5</span>
        </span>
        <Button size="sm" onClick={runChecks}>
          ✓ Шалгах
        </Button>
        <Button size="sm" variant="secondary" onClick={() => setJs(js + "\nwhile(true){}")}>
          ∞ давталт нэмэх (watchdog)
        </Button>
        {results ? (
          <span className={dev.results}>
            {results.map((r) => (
              <span key={r.id} className={r.passed ? dev.resultPass : dev.resultFail}>
                {r.passed ? "✓" : "✗"} {r.id}
              </span>
            ))}
          </span>
        ) : null}
      </div>

      <div className={dev.split}>
        <div className={dev.editors}>
          <label className={dev.label}>index.html</label>
          <textarea className={dev.textarea} value={html} onChange={(e) => setHtml(e.target.value)} spellCheck={false} rows={9} />
          <label className={dev.label}>styles/main.css — edit → hot-swap, no reload</label>
          <textarea className={dev.textarea} value={css} onChange={(e) => setCss(e.target.value)} spellCheck={false} rows={5} />
          <label className={dev.label}>js/main.js</label>
          <textarea className={dev.textarea} value={js} onChange={(e) => setJs(e.target.value)} spellCheck={false} rows={5} />
        </div>

        <div className={dev.paneRight}>
          <div className={dev.previewWrap}>
            <PreviewFrame
              ref={previewRef}
              files={files}
              entry="index.html"
              onConsole={(e) => setLogs((l) => [...l.slice(-40), e])}
              onError={(e) => setLogs((l) => [...l.slice(-40), { level: "error", args: [e.message], time: Date.now() }])}
            />
          </div>
        </div>
      </div>

      <div className={dev.console}>
        {logs.length === 0 ? <span className={dev.consoleEmpty}>Console…</span> : null}
        {logs.map((l, i) => (
          <div key={i} className={l.level === "error" ? dev.consoleErr : l.level === "warn" ? dev.consoleWarn : undefined}>
            [{l.level}] {l.args.join(" ")}
          </div>
        ))}
      </div>
    </div>
  );
}
