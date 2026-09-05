import { loadSqliteRuntime, runChecksOnFiles } from "@khiye/checkers/server";
import { applyPatch, type FileSet } from "./patch";
import { flattenLessons } from "./loader";
import type { Lesson, ResolvedCourse } from "./schema";

/**
 * Run every task's authored checks against its REFERENCE solution and assert
 * they all pass (docs/blueprint/04 §4.6, the T3.3 deferral now that E6 exists).
 * Each lesson is reset from its own workspace patch, then its tasks accumulate.
 * This is what makes "khiye content test" fail CI when a reference is broken.
 */

export interface TaskTestResult {
  lessonId: string;
  taskId: string;
  passed: boolean;
  failures: Array<{ checkId: string; onFail?: string; actual?: string; expected?: string }>;
  /** False when the starter already satisfies every check — the task is a no-op. */
  starterFails: boolean;
  /** Checks that threw. Never blamed on a student at grading time, but at
   *  authoring time they mean the check itself is broken. */
  broken: Array<{ checkId: string; raw?: string }>;
  /** An uncaught error in the STARTER: the student's first sight of the lesson
   *  is a blank preview and a red box. Failing checks are fine; crashing is not. */
  starterError?: string;
}

export interface TestReport {
  ok: boolean;
  results: TaskTestResult[];
  passedTasks: number;
  totalTasks: number;
  /** Tasks whose starter already passed everything (authoring bug). */
  noOpTasks: string[];
  /** "taskId/checkId" for every check that threw instead of judging. */
  brokenChecks: string[];
  /** Tasks whose starter crashes on load. */
  crashingStarters: string[];
}

async function testLesson(lesson: Lesson): Promise<TaskTestResult[]> {
  const out: TaskTestResult[] = [];
  let files: FileSet = applyPatch({}, lesson.workspace.patch);

  // SQL lessons ask the platform for SQLite; every other runtime needs nothing.
  const runOptions = {
    entry: lesson.execution.entry,
    ...(lesson.execution.runtime === "sqlite" ? { sqliteRuntime: loadSqliteRuntime() } : {}),
  };

  for (const task of [...lesson.tasks].sort((a, b) => a.order - b.order)) {
    if (task.starter) files = applyPatch(files, task.starter);
    const solved = applyPatch(files, task.solution.patch);
    const checks = task.checks.map((c) => ({ id: c.id, type: c.type, args: c.args, onFail: c.onFail }));

    const results = await runChecksOnFiles(solved as FileSet, checks, runOptions);

    // A task the student cannot fail teaches nothing: the starter must break at
    // least one check. This catches a marker left in the wrong file, a check
    // that only asserts scaffolding, or a solution accidentally shipped as the
    // starter.
    const onStarter = await runChecksOnFiles(
      files as FileSet,
      [...checks, { id: "__starterConsole", type: "js.consoleClean", args: {}, onFail: { mn: "" } }],
      runOptions,
    );
    const consoleResult = onStarter.find((r) => r.id === "__starterConsole");
    const starterFails = onStarter.some(
      (r) => r.id !== "__starterConsole" && !r.passed && r.errorKind !== "infra",
    );
    const starterError = consoleResult && !consoleResult.passed ? consoleResult.actual : undefined;

    const broken = results
      .filter((r) => r.errorKind === "infra")
      .map((r) => ({ checkId: r.id, raw: r.raw }));

    const failures = results
      .filter((r) => !r.passed && r.errorKind !== "infra")
      .map((r) => {
        const check = task.checks.find((c) => c.id === r.id);
        return { checkId: r.id, onFail: check?.onFail.mn, actual: r.actual, expected: r.expected };
      });

    out.push({
      lessonId: lesson.id,
      taskId: task.id,
      passed: failures.length === 0,
      failures,
      starterFails,
      broken,
      ...(starterError ? { starterError } : {}),
    });
    files = solved; // accumulate within the lesson
  }
  return out;
}

export async function testLessons(lessons: Lesson[]): Promise<TestReport> {
  const results: TaskTestResult[] = [];
  for (const lesson of lessons) results.push(...(await testLesson(lesson)));
  const passedTasks = results.filter((r) => r.passed).length;
  const noOpTasks = results.filter((r) => !r.starterFails).map((r) => r.taskId);
  const brokenChecks = results.flatMap((r) => r.broken.map((b) => `${r.taskId}/${b.checkId}`));
  const crashingStarters = results.filter((r) => r.starterError).map((r) => r.taskId);
  return {
    ok:
      results.every((r) => r.passed) &&
      noOpTasks.length === 0 &&
      brokenChecks.length === 0 &&
      crashingStarters.length === 0,
    results,
    passedTasks,
    totalTasks: results.length,
    noOpTasks,
    brokenChecks,
    crashingStarters,
  };
}

export function testCourse(course: ResolvedCourse): Promise<TestReport> {
  return testLessons(flattenLessons(course));
}
