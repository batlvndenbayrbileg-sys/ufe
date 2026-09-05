import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { Window as HappyWindow } from "happy-dom";
import { runChecks } from "./registry";
import { assembleHtml } from "./assemble";
import type { CheckDef, CheckerContext, CheckResult, FileSet } from "./types";
import "./index"; // register all families
import "./families/ts"; // Node-only: the real TypeScript compiler

export interface RunOptions {
  entry?: string;
  /** SQLite source for lessons whose runtime is "sqlite" (see loadSqliteRuntime). */
  sqliteRuntime?: string;
  /** Viewport for media-query-dependent checks. */
  viewport?: { width: number; height: number };
}

/**
 * A real (if fictional) page URL, not about:blank: routing lessons set
 * location.hash, which only behaves on a normal document URL.
 */
const PAGE_URL = "https://shop.mn/";

/** Inline scripts still run; external loads are blocked (there is no network). */
const SETTINGS = {
  disableJavaScriptFileLoading: true,
  disableCSSFileLoading: true,
} as const;

/**
 * Authoritative server-side runner for Tier-1 tasks (docs/blueprint/05 §5.3).
 * Renders the workspace in happy-dom, executes inline scripts, captures console
 * errors, and runs the checks. MUST run inside an isolated worker/VM in
 * production — happy-dom is a DOM implementation, not a security boundary
 * (§12.7). Never expose it to untrusted code on the main server process.
 */
export async function runChecksOnFiles(
  files: FileSet,
  defs: CheckDef[],
  options: RunOptions = {},
): Promise<CheckResult[]> {
  const html = assembleHtml(files, options.entry ?? "index.html", {
    sqliteRuntime: options.sqliteRuntime,
  });
  // Extra windows opened by css.responsive; closed with the main one.
  const extraWindows: HappyWindow[] = [];

  const renderAt = async (viewport: { width: number; height: number }): Promise<CheckerContext> => {
    const w = new HappyWindow({
      url: PAGE_URL,
      width: viewport.width,
      height: viewport.height,
      settings: SETTINGS,
    });
    extraWindows.push(w);
    w.document.write(html);
    await w.happyDOM.waitUntilComplete().catch(() => {});
    return {
      document: w.document as unknown as Document,
      window: w as unknown as Window & typeof globalThis,
      files,
      getComputedStyle: (el) => w.getComputedStyle(el as never) as unknown as CSSStyleDeclaration,
      consoleErrors: [],
      renderAt,
    };
  };

  const window = new HappyWindow({
    url: PAGE_URL,
    width: options.viewport?.width ?? 1280,
    height: options.viewport?.height ?? 800,
    settings: SETTINGS,
  });

  const consoleErrors: string[] = [];
  window.console.error = (...a: unknown[]) => consoleErrors.push(a.map(String).join(" "));
  window.addEventListener("error", (e: unknown) => {
    const err = e as { message?: string; error?: { message?: string } };
    consoleErrors.push(err.error?.message ?? err.message ?? "uncaught error");
  });

  try {
    window.document.write(html);
    await window.happyDOM.waitUntilComplete();

    const ctx: CheckerContext = {
      document: window.document as unknown as Document,
      window: window as unknown as Window & typeof globalThis,
      files,
      getComputedStyle: (el) =>
        window.getComputedStyle(el as never) as unknown as CSSStyleDeclaration,
      consoleErrors,
      renderAt,
    };

    return await runChecks(defs, ctx);
  } finally {
    for (const w of extraWindows) {
      await w.happyDOM.abort().catch(() => {});
      w.close();
    }
    await window.happyDOM.abort();
    window.close();
  }
}

export { assembleHtml } from "./assemble";
export type { FileSet, CheckDef, CheckResult, CheckerContext } from "./types";

/**
 * Read the SQLite (sql.js, asm build) source once. Node-only on purpose: it
 * lives here, not in assemble.ts, so the browser bundle never pulls node:fs.
 * The asm build is plain JavaScript, so it runs under the preview CSP (which
 * forbids eval) and inside happy-dom, unchanged.
 */
let sqliteRuntime: string | null = null;
export function loadSqliteRuntime(): string {
  if (sqliteRuntime === null) {
    const require_ = createRequire(import.meta.url);
    sqliteRuntime = readFileSync(require_.resolve("sql.js/dist/sql-asm.js"), "utf8");
  }
  return sqliteRuntime;
}

/**
 * The RunOptions a lesson's execution block calls for. Every caller that grades
 * a lesson — the HTTP submit route, the content pipeline — goes through here,
 * so a runtime can never be wired up in one place and forgotten in the other.
 * (A SQL lesson graded without its runtime fails every check with
 * "body[data-ready] never appeared", which looks like broken content.)
 */
export function runOptionsFor(execution: { entry?: string; runtime?: string }): RunOptions {
  return {
    entry: execution.entry,
    ...(execution.runtime === "sqlite" ? { sqliteRuntime: loadSqliteRuntime() } : {}),
  };
}
