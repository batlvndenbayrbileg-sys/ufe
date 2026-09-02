import type { Lesson, ResolvedCourse, Task } from "./schema";

/**
 * Content linter (docs/blueprint/04-content-schema.md §4.5). Structural rules
 * that don't need a runtime. Rules that require executing checkers (reference
 * solution passes, bad fixtures fail distinctly) live in `khiye content test`
 * once the checker runtime (E6) is available.
 */

export type Severity = "error" | "warning";

export interface Diagnostic {
  severity: Severity;
  code: string;
  message: string;
  lessonId: string;
  taskId?: string;
}

const STATEMENT_MAX = 400;

// ── helpers ──────────────────────────────────────────────────────────────────

/** Strip backticked code/terms, then estimate how "English" a Mongolian string reads. */
function englishRatio(mn: string): number {
  const stripped = mn.replace(/`[^`]*`/g, " ").replace(/[^\p{L}\s]/gu, " ");
  const words = stripped.split(/\s+/).filter(Boolean);
  if (words.length === 0) return 0;
  const latinWords = words.filter((w) => /^[a-zA-Z]+$/.test(w) && w.length > 2);
  return latinWords.length / words.length;
}

function tokenize(code: string): Set<string> {
  return new Set(
    code
      .replace(/[^\p{L}\p{N}]+/gu, " ")
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length > 1),
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  return inter / (a.size + b.size - inter);
}

function solutionText(task: Task): string {
  return task.solution.patch
    .map((p) => ("content" in p ? p.content : ""))
    .join("\n");
}

// ── rules ────────────────────────────────────────────────────────────────────

function lintTask(task: Task, push: (d: Omit<Diagnostic, "lessonId" | "taskId">) => void): void {
  // R1: ≥ 1 check
  if (task.checks.length === 0) {
    push({ severity: "error", code: "task-no-checks", message: "task has no checks" });
  }

  // R2: every check has a hand-written onFail.mn
  for (const check of task.checks) {
    if (!check.onFail.mn.trim()) {
      push({ severity: "error", code: "check-no-onfail", message: `check "${check.id}" has an empty onFail.mn` });
    }
  }

  // R3: exactly 3 hints, escalating 1→2→3
  const levels = task.hints.map((h) => h.level);
  if (task.hints.length !== 3 || levels.join(",") !== "1,2,3") {
    push({
      severity: "error",
      code: "hints-not-three",
      message: `expected exactly 3 escalating hints (1,2,3), got [${levels.join(",")}]`,
    });
  }

  // R3b: hint level 3 code must not be (nearly) the full solution
  const hint3 = task.hints.find((h) => h.level === 3);
  if (hint3?.code) {
    const sim = jaccard(tokenize(hint3.code), tokenize(solutionText(task)));
    if (sim >= 0.9) {
      push({
        severity: "error",
        code: "hint3-is-solution",
        message: `hint 3 code is ~${Math.round(sim * 100)}% of the solution — it must guide, not give the answer`,
      });
    }
  }

  // R9: statement length
  if (task.statement.mn.length > STATEMENT_MAX) {
    push({
      severity: "warning",
      code: "statement-too-long",
      message: `statement is ${task.statement.mn.length} chars (> ${STATEMENT_MAX})`,
    });
  }

  // R5: mn fields shouldn't read as English
  if (englishRatio(task.statement.mn) > 0.5) {
    push({ severity: "warning", code: "statement-english", message: "statement.mn looks like English" });
  }

  // R7 (structural part): reference solution must have a patch
  if (task.solution.patch.length === 0) {
    push({ severity: "error", code: "solution-empty", message: "reference solution has no patch" });
  }
}

export function lintLesson(lesson: Lesson): Diagnostic[] {
  const out: Diagnostic[] = [];
  const at = (taskId?: string) => (d: Omit<Diagnostic, "lessonId" | "taskId">) =>
    out.push({ ...d, lessonId: lesson.id, taskId });

  // R4: why.mn present and connected to the project
  if (!lesson.why.mn.trim()) {
    at()({ severity: "error", code: "why-missing", message: "lesson.why.mn is empty" });
  } else if (!/shop/i.test(lesson.why.mn)) {
    at()({ severity: "warning", code: "why-no-project", message: "why.mn should connect to Shop.mn" });
  }

  // R12: Tier-3 server runtimes should declare services
  if (
    lesson.execution.tier === 3 &&
    (lesson.execution.runtime === "node" || lesson.execution.runtime === "postgres") &&
    (!lesson.execution.services || lesson.execution.services.length === 0)
  ) {
    at()({ severity: "warning", code: "tier3-no-services", message: "Tier-3 lesson should declare execution.services" });
  }

  for (const task of lesson.tasks) lintTask(task, at(task.id));
  return out;
}

/** Lint a whole course, including cross-lesson prerequisite DAG validation. */
export function lintCourse(course: ResolvedCourse): Diagnostic[] {
  const out: Diagnostic[] = [];
  const lessons = course.stages.flatMap((s) => s.moduleObjects.flatMap((m) => m.lessonObjects));
  const ids = new Set(lessons.map((l) => l.id));

  for (const lesson of lessons) {
    out.push(...lintLesson(lesson));
    for (const pre of lesson.prerequisites) {
      if (!ids.has(pre)) {
        out.push({
          severity: "error",
          code: "prereq-unknown",
          message: `prerequisite "${pre}" is not a known lesson`,
          lessonId: lesson.id,
        });
      }
    }
  }

  // R11: prerequisites form a DAG (no cycles)
  const cycle = findPrereqCycle(lessons);
  if (cycle) {
    out.push({
      severity: "error",
      code: "prereq-cycle",
      message: `prerequisite cycle: ${cycle.join(" → ")}`,
      lessonId: cycle[0]!,
    });
  }

  return out;
}

function findPrereqCycle(lessons: Lesson[]): string[] | null {
  const graph = new Map(lessons.map((l) => [l.id, l.prerequisites]));
  const state = new Map<string, 0 | 1 | 2>(); // 0=unseen 1=inStack 2=done
  const stack: string[] = [];

  const visit = (id: string): string[] | null => {
    const s = state.get(id) ?? 0;
    if (s === 1) return [...stack.slice(stack.indexOf(id)), id];
    if (s === 2) return null;
    state.set(id, 1);
    stack.push(id);
    for (const next of graph.get(id) ?? []) {
      if (!graph.has(next)) continue;
      const c = visit(next);
      if (c) return c;
    }
    stack.pop();
    state.set(id, 2);
    return null;
  };

  for (const l of lessons) {
    const c = visit(l.id);
    if (c) return c;
  }
  return null;
}

export function summarize(diagnostics: Diagnostic[]): { errors: number; warnings: number } {
  return {
    errors: diagnostics.filter((d) => d.severity === "error").length,
    warnings: diagnostics.filter((d) => d.severity === "warning").length,
  };
}
