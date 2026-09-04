"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { assembleSrcdoc, diffFiles } from "./assemble";
import { HARNESS_JS } from "./harness-bundle";
import {
  isHarnessMessage,
  type ConsoleEntry,
  type FileSet,
  type HarnessCheckResult,
  type HostMessage,
} from "./protocol";

const HEARTBEAT_TIMEOUT_MS = 3000;
const CHECK_TIMEOUT_MS = 6000;

export interface PreviewHostHandle {
  runChecks(
    checks: Array<{ id: string; type: string; args: Record<string, unknown> }>,
  ): Promise<HarnessCheckResult[]>;
  reload(): void;
}

/**
 * SQLite is ~1.4 MB, so it is fetched on demand by the handful of lessons that
 * need it and never enters the app bundle. One in-flight request per document,
 * shared across mounts.
 */
let sqlitePromise: Promise<string> | null = null;
function fetchSqlite(url: string): Promise<string> {
  sqlitePromise ??= fetch(url).then((r) => {
    if (!r.ok) throw new Error(`sqlite runtime ${r.status}`);
    return r.text();
  });
  return sqlitePromise;
}

export interface PreviewHostProps {
  files: FileSet;
  entry?: string;
  /** Same-origin URL of the SQLite runtime; set only for SQL lessons. */
  sqliteUrl?: string;
  connectSrc?: string;
  cdnBase?: string;
  /** Device viewport; the frame around it is drawn by PreviewFrame. */
  width?: number | string;
  height?: number | string;
  onConsole?: (entry: ConsoleEntry) => void;
  onError?: (err: { message: string; mn?: unknown; source?: unknown }) => void;
  onReady?: () => void;
  className?: string;
}

export const PreviewHost = forwardRef<PreviewHostHandle, PreviewHostProps>(function PreviewHost(
  { files, entry, sqliteUrl, connectSrc, cdnBase, width = "100%", height = "100%", onConsole, onError, onReady, className },
  ref,
) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const prevFiles = useRef<FileSet | null>(null);
  // Always-current files, so the message handler and reload() never close over
  // a stale set (files often arrive after the first render).
  const filesRef = useRef<FileSet>(files);
  filesRef.current = files;
  const lastHeartbeat = useRef<number>(Date.now());
  const readyRef = useRef(false);
  const pending = useRef(new Map<string, (r: HarnessCheckResult[]) => void>());
  const scrollPos = useRef({ x: 0, y: 0 });
  // Survives iframe reloads so storage lessons behave like a real browser.
  const storage = useRef<Record<string, string>>({});
  const sqlite = useRef<string | undefined>(undefined);
  const [looping, setLooping] = useState(false);

  const post = useCallback((msg: HostMessage) => {
    iframeRef.current?.contentWindow?.postMessage(msg, "*");
  }, []);

  const reload = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    readyRef.current = false;
    setLooping(false);
    lastHeartbeat.current = Date.now();
    const snapshot = filesRef.current;
    iframe.srcdoc = assembleSrcdoc(snapshot, {
      harnessJs: HARNESS_JS,
      entry,
      connectSrc,
      cdnBase,
      storage: storage.current,
      sqliteRuntime: sqlite.current,
    });
    prevFiles.current = snapshot;
  }, [entry, connectSrc, cdnBase]);

  // Pull the SQLite runtime in before the first render of a SQL lesson, so the
  // page never flashes a "initSqlJs is not defined" error on its way up.
  useEffect(() => {
    if (!sqliteUrl || sqlite.current) return;
    let alive = true;
    fetchSqlite(sqliteUrl)
      .then((src) => {
        if (!alive) return;
        sqlite.current = src;
        reload();
      })
      .catch(() => {
        /* the page will surface the missing runtime itself */
      });
    return () => {
      alive = false;
    };
  }, [sqliteUrl, reload]);

  // Initial render (mount only).
  const didMount = useRef(false);
  useEffect(() => {
    if (didMount.current) return;
    didMount.current = true;
    reload();
  }, [reload]);

  // React to file changes: CSS-only → hot-swap; otherwise reload.
  useEffect(() => {
    if (!readyRef.current) return;
    const { changed, cssOnly } = diffFiles(prevFiles.current, files);
    if (changed.length === 0) return;
    if (cssOnly) {
      const styles: Record<string, string> = {};
      for (const path of changed) styles[path.replace(/^\.?\//, "")] = files[path]?.content ?? "";
      post({ type: "khiye:updateStyles", styles });
      prevFiles.current = files;
    } else {
      reload();
    }
  }, [files, post, reload]);

  // Message channel from the iframe.
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.source !== iframeRef.current?.contentWindow) return; // opaque origin → check source
      if (!isHarnessMessage(e.data)) return;
      const msg = e.data;
      switch (msg.type) {
        case "khiye:ready": {
          readyRef.current = true;
          lastHeartbeat.current = Date.now();
          // Files that arrived while the harness was still booting were dropped
          // by the change effect (it bails when not ready) — apply them now.
          const { changed } = diffFiles(prevFiles.current, filesRef.current);
          if (changed.length > 0) {
            reload();
            break;
          }
          if (scrollPos.current.y || scrollPos.current.x) {
            post({ type: "khiye:scrollTo", ...scrollPos.current });
          }
          onReady?.();
          break;
        }
        case "khiye:heartbeat":
          lastHeartbeat.current = Date.now();
          break;
        case "khiye:storage":
          storage.current = msg.data;
          break;
        case "khiye:scroll":
          scrollPos.current = { x: msg.x, y: msg.y };
          break;
        case "khiye:console":
          onConsole?.(msg.entry);
          break;
        case "khiye:error":
          onError?.({ message: msg.message, mn: msg.mn, source: msg.source });
          break;
        case "khiye:checksResult": {
          const resolve = pending.current.get(msg.nonce);
          if (resolve) {
            pending.current.delete(msg.nonce);
            resolve(msg.results);
          }
          break;
        }
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [post, onConsole, onError, onReady, reload]);

  // Infinite-loop watchdog: no heartbeat for 3s while "ready" → recover.
  // Only while the tab is visible: browsers throttle background timers to about
  // once a minute, so a hidden tab would otherwise "detect" a loop that isn't
  // there and greet the student with a scary banner on their way back.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") lastHeartbeat.current = Date.now();
    };
    document.addEventListener("visibilitychange", onVisible);
    const id = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      if (readyRef.current && Date.now() - lastHeartbeat.current > HEARTBEAT_TIMEOUT_MS) {
        setLooping(true);
        readyRef.current = false;
      }
    }, 1000);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.clearInterval(id);
    };
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      reload,
      runChecks(checks) {
        return new Promise<HarnessCheckResult[]>((resolve) => {
          if (!readyRef.current) return resolve([]);
          const nonce = Math.random().toString(36).slice(2);
          pending.current.set(nonce, resolve);
          post({ type: "khiye:runChecks", nonce, files, checks });
          setTimeout(() => {
            if (pending.current.has(nonce)) {
              pending.current.delete(nonce);
              resolve(checks.map((c) => ({ id: c.id, passed: false, errorKind: "timeout", durationMs: CHECK_TIMEOUT_MS })));
            }
          }, CHECK_TIMEOUT_MS);
        });
      },
    }),
    [post, files, reload],
  );

  return (
    <div className={className} style={{ position: "relative", width, height, background: "#fff" }}>
      <iframe
        ref={iframeRef}
        title="Preview"
        sandbox="allow-scripts allow-modals allow-popups allow-forms"
        referrerPolicy="no-referrer"
        style={{ width: "100%", height: "100%", border: 0, display: "block" }}
      />
      {looping ? (
        <div
          role="alert"
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            padding: 24,
            textAlign: "center",
            background: "var(--danger-subtle, #fef2f2)",
            color: "var(--text, #18181b)",
            font: "14px/1.5 system-ui, sans-serif",
          }}
        >
          <strong>Таны код хязгааргүй давталтад орсон байна.</strong>
          <span>`for` эсвэл `while` давталтын зогсох нөхцөлөө шалгаад дахин ажиллуулаарай.</span>
          <button
            type="button"
            onClick={reload}
            style={{ padding: "8px 16px", borderRadius: 6, border: "1px solid var(--border,#e4e4e7)", cursor: "pointer" }}
          >
            Дахин ажиллуулах
          </button>
        </div>
      ) : null}
    </div>
  );
});
