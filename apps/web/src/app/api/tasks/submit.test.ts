import { describe, expect, it } from "vitest";
import { applyPatch, type FileSet } from "@khiye/content-sdk/patch";
import { getLessonFull } from "@/lib/content";
import { POST } from "./[taskId]/submit/route";

/**
 * Grading through the real HTTP handler, not the content pipeline.
 *
 * The pipeline runs every reference solution on every commit, but it builds its
 * own RunOptions. When the route built a different set the two silently drifted
 * apart: SQL lessons graded green in CI and failed every check in the running
 * app, with an error ("body[data-ready] never appeared") that pointed at the
 * content rather than at the caller. These cases walk the same path a student's
 * "Шалгах" click takes, for one lesson of each runtime that needs setup.
 */
async function grade(lessonId: string, taskIndex: number, use: "solution" | "starter") {
  const lesson = getLessonFull(lessonId)!;
  const tasks = [...lesson.tasks].sort((a, b) => a.order - b.order);
  const target = tasks[taskIndex]!;

  // Rebuild the workspace exactly as the student would have it on arrival:
  // the lesson patch, then every earlier task's starter and solution.
  let files = applyPatch({}, lesson.workspace.patch) as FileSet;
  for (const task of tasks) {
    if (task.starter) files = applyPatch(files, task.starter) as FileSet;
    if (task === target) break;
    files = applyPatch(files, task.solution.patch) as FileSet;
  }
  if (use === "solution") files = applyPatch(files, target.solution.patch) as FileSet;

  const req = new Request(`http://localhost/api/tasks/${target.id}/submit`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ files, attemptNo: 1 }),
  });
  const res = await POST(req as never, { params: Promise.resolve({ taskId: target.id }) });
  const json = (await res.json()) as { data?: { passed: boolean; checks: Array<{ passed: boolean }> } };
  return json.data!;
}

describe("POST /api/tasks/:id/submit", () => {
  it("passes the reference solution of a DOM lesson", async () => {
    const out = await grade("m1-l1", 0, "solution");
    expect(out.passed).toBe(true);
  });

  it("passes the reference solution of a SQL lesson (SQLite must be wired up)", async () => {
    const out = await grade("m10-l3", 0, "solution");
    expect(out.passed).toBe(true);
  }, 30_000);

  it("fails the starter it was given", async () => {
    const out = await grade("m10-l3", 0, "starter");
    expect(out.passed).toBe(false);
  }, 30_000);
});
