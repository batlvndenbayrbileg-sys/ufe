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
import { isBlockedLoop } from "./watchdog";
import { HARNESS_JS } from "./harness-bundle";
import {
  isHarnessMessage,
  type ConsoleEntry,
  type FileSet,
  type HarnessCheckResult,
  type HostMessage,
} from "./protocol";

const HEARTBEAT_TIMEOUT_MS = 3000;
/** Long enough to swallow a burst of typing, short enough to feel immediate. */
const RELOAD_DEBOUNCE_MS = 250;
const CHECK_TIMEOUT_MS = 6000;

export interface PreviewHostHandle {
  runChecks(
    checks: Array<{ id: string; type: string; args: Record<string, unknown> }>,
  ): Promise<HarnessCheckResult[]>;
  reload(): void;
}

/**
 * The big runtimes — SQLite (~1.4 MB) and React (~180 KB) — are fetched on
 * demand by the lessons that need them and never enter the app bundle. One
 * in-flight request per URL per document, shared across mounts.
 */
const runtimeCache = new Map<string, Promise<string>>();
function fetchRuntime(url: string): Promise<string> {
  let pending = runtimeCache.get(url);
  if (!pending) {
    pending = fetch(url).then((r) => {
      if (!r.ok) throw new Error(`runtime ${url}: ${r.status}`);
      return r.text();
    });
    runtimeCache.set(url, pending);
  }
  return pending;
}

export interface PreviewHostProps {
  files: FileSet;
  entry?: string;
  /** Same-origin URL of the SQLite runtime; set only for SQL lessons. */
  sqliteUrl?: string;
  /** Same-origin URL of React + ReactDOM, fetched only when the workspace has JSX. */
  reactRuntimeUrl?: string;
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
  { files, entry, sqliteUrl, reactRuntimeUrl, connectSrc, cdnBase, width = "100%", height = "100%", onConsole, onError, onReady, className },
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
  /** Bumped on every srcdoc swap; messages stamped with an older one are dead. */
  const gen = useRef(0);
  const pending = useRef(new Map<string, (r: HarnessCheckResult[]) => void>());
  const scrollPos = useRef({ x: 0, y: 0 });
  // Survives iframe reloads so storage lessons behave like a real browser.
  const storage = useRef<Record<string, string>>({});
  const sqlite = useRef<string | undefined>(undefined);
  const reactRuntime = useRef<string | undefined>(undefined);
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
    gen.current += 1;
    const snapshot = filesRef.current;
    iframe.srcdoc = assembleSrcdoc(snapshot, {
      harnessJs: HARNESS_JS,
      entry,
      connectSrc,
      cdnBase,
      gen: gen.current,
      storage: storage.current,
      sqliteRuntime: sqlite.current,
      reactRuntime: reactRuntime.current,
    });
    prevFiles.current = snapshot;
  }, [entry, connectSrc, cdnBase]);

  // Pull the SQLite runtime in before the first render of a SQL lesson, so the
  // page never flashes a "initSqlJs is not defined" error on its way up.
  useEffect(() => {
    if (!sqliteUrl || sqlite.current) return;
    let alive = true;
    fetchRuntime(sqliteUrl)
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

  // Same for React, but only when the workspace actually contains JSX — which
  // is what keeps 180 KB off every HTML, CSS and SQL lesson.
  const hasJsx = Object.keys(files).some((p) => /\.(jsx|tsx)$/.test(p));
  useEffect(() => {
    if (!reactRuntimeUrl || !hasJsx || reactRuntime.current) return;
    let alive = true;
    fetchRuntime(reactRuntimeUrl)
      .then((src) => {
        if (!alive) return;
        reactRuntime.current = src;
        reload();
      })
      .catch(() => {
        /* the page will surface the missing runtime itself */
      });
    return () => {
      alive = false;
    };
  }, [reactRuntimeUrl, hasJsx, reload]);

  // Initial render (mount only).
  const didMount = useRef(false);
  useEffect(() => {
    if (didMount.current) return;
    didMount.current = true;
    reload();
  }, [reload]);

  // React to file changes: CSS-only → hot-swap; otherwise reload.
  //
  // A reload throws the whole document away, so doing one per keystroke makes
  // the preview flicker through half-typed markup and rebuilds the harness
  // dozens of times a second. Coalesce them into one rebuild once typing
  // pauses. CSS is not debounced: swapping a <style> block is cheap and keeps
  // the "drag a colour and watch it change" feel of the design lessons.
  useEffect(() => {
    if (!readyRef.current) return;
    const { changed, cssOnly } = diffFiles(prevFiles.current, files);
    if (changed.length === 0) return;
    if (cssOnly) {
      const styles: Record<string, string> = {};
      for (const path of changed) styles[path.replace(/^\.?\//, "")] = files[path]?.content ?? "";
      post({ type: "khiye:updateStyles", styles });
      prevFiles.current = files;
      return;
    }
    const id = window.setTimeout(reload, RELOAD_DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [files, post, reload]);

  // Message channel from the iframe.
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.source !== iframeRef.current?.contentWindow) return; // opaque origin → check source
      if (!isHarnessMessage(e.data)) return;
      const msg = e.data;
      // A page we have already replaced may still be flushing messages. Its
      // liveness signals are lies — believing them makes the watchdog fire on
      // a document that is simply gone.
      if (msg.gen !== undefined && msg.gen !== gen.current) return;
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
  //
  // A real loop blocks the STUDENT's iframe but not this parent app — they are
  // separate JS contexts. Throttling is the opposite: a backgrounded or
  // unpainted tab slows BOTH. So the reliable "is this a real loop?" test is
  // whether THIS interval is itself running on schedule. When our own tick
  // arrives late (tab hidden, occluded, the machine asleep, or an embedded
  // pane that reports "visible" while its timers are throttled — the case a
  // visibilityState check misses), the iframe was paused too, not looping:
  // reset the baseline and give it a fresh grace period. Only when our clock is
  // ticking normally yet the heartbeat has stopped is the iframe truly blocked.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") lastHeartbeat.current = Date.now();
    };
    document.addEventListener("visibilitychange", onVisible);
    const TICK_MS = 1000;
    let lastTick = Date.now();
    const id = window.setInterval(() => {
      const now = Date.now();
      const tickDriftMs = now - lastTick - TICK_MS;
      lastTick = now;
      const visible = document.visibilityState === "visible";
      // A suspended/throttled tick means the iframe was paused too — hand the
      // heartbeat a clean slate so it isn't judged on a gap it couldn't fill.
      if (!visible || tickDriftMs > HEARTBEAT_TIMEOUT_MS) {
        lastHeartbeat.current = now;
        return;
      }
      if (
        isBlockedLoop({
          ready: readyRef.current,
          visible,
          tickDriftMs,
          sinceHeartbeatMs: now - lastHeartbeat.current,
          timeoutMs: HEARTBEAT_TIMEOUT_MS,
        })
      ) {
        setLooping(true);
        readyRef.current = false;
      }
    }, TICK_MS);
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
