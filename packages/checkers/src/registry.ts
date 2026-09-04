import type { CheckDef, Checker, CheckerContext, CheckResult } from "./types";

const REGISTRY = new Map<string, Checker>();

export function registerChecker(type: string, checker: Checker): void {
  REGISTRY.set(type, checker);
}

export function getChecker(type: string): Checker | undefined {
  return REGISTRY.get(type);
}

export function registeredTypes(): string[] {
  return [...REGISTRY.keys()].sort();
}

// Data-driven lessons render, fetch and settle inside a single check; 3s left
// no headroom over waitFor's own cap. Still well under the preview host's 6s.
const PER_CHECK_TIMEOUT_MS = 5000;

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
  ]);
}

/** Run one check, timing it and converting throws/timeouts to safe results. */
export async function runCheck(def: CheckDef, ctx: CheckerContext): Promise<CheckResult> {
  const start = Date.now();
  const checker = getChecker(def.type);
  if (!checker) {
    return {
      id: def.id,
      passed: false,
      errorKind: "infra",
      raw: `unknown checker type: ${def.type}`,
      durationMs: Date.now() - start,
    };
  }
  try {
    const result = await withTimeout(Promise.resolve(checker(def.args, ctx)), PER_CHECK_TIMEOUT_MS);
    return { id: def.id, durationMs: Date.now() - start, ...result };
  } catch (e) {
    const timedOut = e instanceof Error && e.message === "timeout";
    return {
      id: def.id,
      passed: false,
      // A checker that throws is NOT the student's fault (§5.8).
      errorKind: timedOut ? "timeout" : "infra",
      raw: e instanceof Error ? e.message : String(e),
      durationMs: Date.now() - start,
    };
  }
}

/** Run all checks. Returns results in the same order as the input. */
export async function runChecks(defs: CheckDef[], ctx: CheckerContext): Promise<CheckResult[]> {
  const out: CheckResult[] = [];
  for (const def of defs) out.push(await runCheck(def, ctx));
  return out;
}

/** Aggregate a verdict from results per the task's check mode. */
export function verdict(
  results: CheckResult[],
  mode: "all" | "weighted" = "all",
  threshold = 1,
  weights: Record<string, number> = {},
): { passed: boolean; score: number; infra: boolean } {
  const infra = results.some((r) => r.errorKind === "infra");
  if (mode === "all") {
    // Infra failures don't count against the student; require the rest to pass.
    const relevant = results.filter((r) => r.errorKind !== "infra");
    const passed = relevant.length > 0 && relevant.every((r) => r.passed);
    return { passed, score: passed ? 1 : 0, infra };
  }
  let total = 0;
  let got = 0;
  for (const r of results) {
    if (r.errorKind === "infra") continue;
    const w = weights[r.id] ?? 1;
    total += w;
    if (r.passed) got += w;
  }
  const score = total === 0 ? 0 : got / total;
  return { passed: score >= threshold, score, infra };
}
