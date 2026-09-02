import { runChecksOnFiles } from "@khiye/checkers/server";
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
}

export interface TestReport {
  ok: boolean;
  results: TaskTestResult[];
  passedTasks: number;
  totalTasks: number;
}

async function testLesson(lesson: Lesson): Promise<TaskTestResult[]> {
  const out: TaskTestResult[] = [];
  let files: FileSet = applyPatch({}, lesson.workspace.patch);

  for (const task of [...lesson.tasks].sort((a, b) => a.order - b.order)) {
    if (task.starter) files = applyPatch(files, task.starter);
    const solved = applyPatch(files, task.solution.patch);

    const results = await runChecksOnFiles(
      solved as FileSet,
      task.checks.map((c) => ({ id: c.id, type: c.type, args: c.args, onFail: c.onFail })),
      { entry: lesson.execution.entry },
    );

    const failures = results
      .filter((r) => !r.passed && r.errorKind !== "infra")
      .map((r) => {
        const check = task.checks.find((c) => c.id === r.id);
        return { checkId: r.id, onFail: check?.onFail.mn, actual: r.actual, expected: r.expected };
      });

    out.push({ lessonId: lesson.id, taskId: task.id, passed: failures.length === 0, failures });
    files = solved; // accumulate within the lesson
  }
  return out;
}

export async function testLessons(lessons: Lesson[]): Promise<TestReport> {
  const results: TaskTestResult[] = [];
  for (const lesson of lessons) results.push(...(await testLesson(lesson)));
  const passedTasks = results.filter((r) => r.passed).length;
  return { ok: results.every((r) => r.passed), results, passedTasks, totalTasks: results.length };
}

export function testCourse(course: ResolvedCourse): Promise<TestReport> {
  return testLessons(flattenLessons(course));
}
