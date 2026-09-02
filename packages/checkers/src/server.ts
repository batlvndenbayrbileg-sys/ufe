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
  const window = new HappyWindow({
    width: options.viewport?.width ?? 1280,
    height: options.viewport?.height ?? 800,
    settings: {
      disableJavaScriptFileLoading: true,
      disableCSSFileLoading: true,
      // Inline scripts still run; external loads are blocked (no network).
    },
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
    };

    return await runChecks(defs, ctx);
  } finally {
    await window.happyDOM.abort();
    window.close();
  }
}

export { assembleHtml } from "./assemble";
export type { FileSet, CheckDef, CheckResult, CheckerContext } from "./types";
