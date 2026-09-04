/**
 * Preview harness — runs INSIDE the sandboxed, opaque-origin iframe. Injected
 * first (before student code) by the assembler. Talks to the host only via
 * postMessage. Bundled with @khiye/checkers/browser + @khiye/shared into a
 * single IIFE (see scripts/build-harness.mjs). Never trusts the parent origin.
 * docs/blueprint/07 §7.5, 05 §5.3.
 */
import { runChecks, type CheckerContext } from "@khiye/checkers/browser";
import { translateRuntimeError } from "@khiye/shared";
import {
  PREVIEW_PROTOCOL_VERSION,
  type FileSet,
  type HarnessMessage,
  type HostMessage,
} from "../protocol";

const send = (msg: HarnessMessage) => {
  try {
    window.parent.postMessage(msg, "*");
  } catch {
    /* parent gone */
  }
};

const consoleErrors: string[] = [];
let currentFiles: FileSet = {};

// ── console bridge ───────────────────────────────────────────────────────────
function stringifyArg(a: unknown): string {
  if (typeof a === "string") return a;
  try {
    return JSON.stringify(a, replacer, 0) ?? String(a);
  } catch {
    return String(a);
  }
}
function replacer(_k: string, v: unknown) {
  if (typeof v === "function") return `[Function ${(v as { name?: string }).name || "anonymous"}]`;
  if (v instanceof Error) return `${v.name}: ${v.message}`;
  return v;
}

const LEVELS = ["log", "info", "warn", "error", "debug"] as const;
for (const level of LEVELS) {
  const original = window.console[level]?.bind(window.console);
  window.console[level] = (...args: unknown[]) => {
    original?.(...args);
    if (level === "error") consoleErrors.push(args.map(String).join(" "));
    send({ type: "khiye:console", entry: { level, args: args.map(stringifyArg), time: Date.now() } });
  };
}

// ── error capture (+ Mongolian translation) ──────────────────────────────────
window.addEventListener("error", (e: ErrorEvent) => {
  const message = e.message || String(e.error ?? "error");
  consoleErrors.push(message);
  send({
    type: "khiye:error",
    message,
    stack: e.error?.stack,
    source: { file: e.filename, line: e.lineno, col: e.colno },
    mn: translateRuntimeError(message),
  });
});
window.addEventListener("unhandledrejection", (e: PromiseRejectionEvent) => {
  const message = `Uncaught (in promise) ${String(e.reason?.message ?? e.reason)}`;
  consoleErrors.push(message);
  send({ type: "khiye:error", message, mn: translateRuntimeError(message) });
});

// ── alert/confirm/prompt throttle (students need alert once; spam is blocked) ─
let alertCount = 0;
const origAlert = window.alert?.bind(window);
window.alert = (msg?: unknown) => {
  if (alertCount < 3) {
    alertCount++;
    origAlert?.(String(msg));
  } else if (alertCount === 3) {
    alertCount++;
    window.console.warn("alert() дуудлага хэтэрсэн тул түр зогсоолоо.");
  }
};
window.confirm = () => true;
window.prompt = () => null;

// ── localStorage shim ────────────────────────────────────────────────────────
// The preview runs at an OPAQUE origin (sandbox without allow-same-origin, on
// purpose — student code must never reach the platform's own storage). Touching
// window.localStorage there throws SecurityError, which would kill a storage
// lesson on its first line. So we hand the page a real-enough Storage backed by
// a plain object, seeded from the host and echoed back on every write, which is
// what makes "reload and your cart is still there" true in the preview too.
function installStorageShim(): void {
  try {
    const real = window.localStorage;
    real.getItem("__khiye_probe__"); // throws at an opaque origin
    return; // a usable localStorage already exists (tests, same-origin hosts)
  } catch {
    /* fall through and shim it */
  }

  const makeStorage = (seed: Record<string, string>, onChange?: (d: Record<string, string>) => void): Storage => {
    const data: Record<string, string> = { ...seed };
    const changed = () => onChange?.({ ...data });
    return {
      get length() {
        return Object.keys(data).length;
      },
      key: (i: number) => Object.keys(data)[i] ?? null,
      getItem: (k: string) =>
        Object.prototype.hasOwnProperty.call(data, String(k)) ? data[String(k)]! : null,
      setItem: (k: string, v: string) => {
        data[String(k)] = String(v);
        changed();
      },
      removeItem: (k: string) => {
        delete data[String(k)];
        changed();
      },
      clear: () => {
        for (const k of Object.keys(data)) delete data[k];
        changed();
      },
    };
  };

  const seed = (window as { __khiyeStorage?: Record<string, string> }).__khiyeStorage ?? {};
  const stores: Array<[name: "localStorage" | "sessionStorage", value: Storage]> = [
    // Only localStorage survives a reload — sessionStorage is per-page by spec.
    ["localStorage", makeStorage(seed, (data) => send({ type: "khiye:storage", data }))],
    ["sessionStorage", makeStorage({})],
  ];

  for (const [name, value] of stores) {
    try {
      Object.defineProperty(window, name, { value, configurable: true });
    } catch {
      /* locked down; the lesson will surface the real error */
    }
  }
}
installStorageShim();

// ── heartbeat (host uses gaps to detect an infinite loop) ─────────────────────
window.setInterval(() => send({ type: "khiye:heartbeat", t: Date.now() }), 500);

// ── scroll reporting for state preservation ──────────────────────────────────
let scrollRaf = 0;
window.addEventListener(
  "scroll",
  () => {
    if (scrollRaf) return;
    scrollRaf = window.requestAnimationFrame(() => {
      scrollRaf = 0;
      send({ type: "khiye:scroll", x: window.scrollX, y: window.scrollY });
    });
  },
  { passive: true },
);

// ── checker runtime host ──────────────────────────────────────────────────────
type CheckList = Array<{ id: string; type: string; args: Record<string, unknown> }>;

async function handleRunChecks(nonce: string, files: FileSet, checks: CheckList) {
  currentFiles = files;
  const ctx: CheckerContext = {
    document: window.document,
    window,
    files: currentFiles,
    getComputedStyle: (el) => window.getComputedStyle(el),
    consoleErrors,
  };
  const results = await runChecks(
    checks.map((c) => ({ id: c.id, type: c.type, args: c.args })),
    ctx,
  );
  send({ type: "khiye:checksResult", nonce, results });
}

function hotSwapStyles(styles: Record<string, string>) {
  for (const [path, css] of Object.entries(styles)) {
    const el = window.document.querySelector(`style[data-khiye-css="${path}"]`);
    if (el) el.textContent = css;
  }
}

window.addEventListener("message", (e: MessageEvent) => {
  const data = e.data as HostMessage;
  if (!data || typeof data.type !== "string") return;
  switch (data.type) {
    case "khiye:runChecks":
      void handleRunChecks(data.nonce, data.files, data.checks);
      break;
    case "khiye:updateStyles":
      hotSwapStyles(data.styles);
      break;
    case "khiye:scrollTo":
      window.scrollTo(data.x, data.y);
      break;
    case "khiye:reset-console":
      consoleErrors.length = 0;
      break;
  }
});

send({ type: "khiye:ready", version: PREVIEW_PROTOCOL_VERSION });
