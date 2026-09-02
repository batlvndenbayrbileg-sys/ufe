/**
 * Checker contract (docs/blueprint/05-validation-engine.md §5.8).
 * Checkers are ISOMORPHIC: the same function runs in the browser preview
 * iframe (live document) and on the server (happy-dom). They receive a
 * CheckerContext and must never throw — infra failures return
 * errorKind:"infra", which is not counted as a student failure.
 */

export type FileSet = Record<string, { content: string; readonly?: boolean; binary?: boolean }>;

export type ErrorKind = "assertion" | "runtime" | "timeout" | "infra";

export interface CheckResult {
  id: string;
  passed: boolean;
  /** Observed value, shown next to `expected` in the UI (≤ ~200 chars). */
  actual?: string;
  expected?: string;
  errorKind?: ErrorKind;
  /** Raw detail for the tutor/author; never shown directly to students. */
  raw?: string;
  durationMs: number;
}

/** What a checker receives. Fields are optional per tier/runtime. */
export interface CheckerContext {
  /** The rendered document (live iframe doc, or happy-dom on the server). */
  document?: Document;
  window?: (Window & typeof globalThis) | null;
  /** Raw student files — for ast.* and html.valid, which read source. */
  files: FileSet;
  /** getComputedStyle, injected so browser and happy-dom both work. */
  getComputedStyle?: (el: Element, pseudo?: string | null) => CSSStyleDeclaration;
  /** Console errors captured during load + interaction. */
  consoleErrors: string[];
  /** Optional per-check log sink (author debugging). */
  log?: (msg: string) => void;
}

/** The authored check definition (mirrors @khiye/content-sdk Check). */
export interface CheckDef {
  id: string;
  type: string;
  args: Record<string, unknown>;
  onFail?: { mn: string; en?: string };
  weight?: number;
}

export type Checker = (
  args: Record<string, unknown>,
  ctx: CheckerContext,
) => Promise<Omit<CheckResult, "id" | "durationMs">> | Omit<CheckResult, "id" | "durationMs">;

export function pass(extra?: Partial<CheckResult>): Omit<CheckResult, "id" | "durationMs"> {
  return { passed: true, ...extra };
}
export function fail(
  actual?: string,
  expected?: string,
  extra?: Partial<CheckResult>,
): Omit<CheckResult, "id" | "durationMs"> {
  return { passed: false, actual, expected, errorKind: "assertion", ...extra };
}
