import { Window as HappyWindow } from "happy-dom";
import { runChecks } from "./registry";
import { assembleHtml } from "./assemble";
import type { CheckDef, CheckerContext, CheckResult, FileSet } from "./types";
import "./index"; // register all families

export interface RunOptions {
  entry?: string;
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
  const html = assembleHtml(files, options.entry ?? "index.html");
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
