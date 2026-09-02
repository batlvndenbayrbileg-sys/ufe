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

export interface PreviewHostProps {
  files: FileSet;
  entry?: string;
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
  { files, entry, connectSrc, cdnBase, width = "100%", height = "100%", onConsole, onError, onReady, className },
  ref,
) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const prevFiles = useRef<FileSet | null>(null);
  const lastHeartbeat = useRef<number>(Date.now());
  const readyRef = useRef(false);
  const pending = useRef(new Map<string, (r: HarnessCheckResult[]) => void>());
  const scrollPos = useRef({ x: 0, y: 0 });
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
    iframe.srcdoc = assembleSrcdoc(files, { harnessJs: HARNESS_JS, entry, connectSrc, cdnBase });
    prevFiles.current = files;
  }, [files, entry, connectSrc, cdnBase]);

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
        case "khiye:ready":
          readyRef.current = true;
          lastHeartbeat.current = Date.now();
          if (scrollPos.current.y || scrollPos.current.x) {
            post({ type: "khiye:scrollTo", ...scrollPos.current });
          }
          onReady?.();
          break;
        case "khiye:heartbeat":
          lastHeartbeat.current = Date.now();
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
  }, [post, onConsole, onError, onReady]);

  // Infinite-loop watchdog: no heartbeat for 3s while "ready" → recover.
  useEffect(() => {
    const id = window.setInterval(() => {
      if (readyRef.current && Date.now() - lastHeartbeat.current > HEARTBEAT_TIMEOUT_MS) {
        setLooping(true);
        readyRef.current = false;
      }
    }, 1000);
    return () => window.clearInterval(id);
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
