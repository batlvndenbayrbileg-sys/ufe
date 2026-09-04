import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { loadCourse } from "./loader";
import { testCourse } from "./test-runner";

const dir = fileURLToPath(new URL("../fixtures/ip-101", import.meta.url));

describe("content test-runner (E3 × E6)", () => {
  it("every reference solution in the fixture course passes its own checks", async () => {
    const report = await testCourse(loadCourse(dir));
    if (!report.ok) {
      // Surface which task/check failed for a readable assertion message.
      const detail = report.results
        .filter((r) => !r.passed)
        .map((r) => `${r.taskId}: ${r.failures.map((f) => f.checkId).join(",")}`)
        .join(" | ");
      throw new Error(`reference solutions failed: ${detail}`);
    }
    expect(report.ok).toBe(true);
    expect(report.passedTasks).toBe(report.totalTasks);
    expect(report.totalTasks).toBe(3);
  });

  it("every starter fails at least one check (no busywork tasks)", async () => {
    const report = await testCourse(loadCourse(dir));
    expect(report.noOpTasks).toEqual([]);
  });

  it("a task whose starter already passes is caught", async () => {
    const course = loadCourse(dir);
    const lesson = course.stages[0]!.moduleObjects[0]!.lessonObjects.find((l) => l.id === "m1-l1")!;
    // Ship the answer in the starter: nothing is left for the student to do.
    lesson.workspace.patch = [...lesson.workspace.patch, ...lesson.tasks[0]!.solution.patch];
    const report = await testCourse(course);
    expect(report.ok).toBe(false);
    expect(report.noOpTasks).toContain("m1-l1-t1");
  });

  it("a check that throws is reported, not silently skipped", async () => {
    const course = loadCourse(dir);
    const lesson = course.stages[0]!.moduleObjects[0]!.lessonObjects.find((l) => l.id === "m1-l1")!;
    // An unknown type is an infra error: never the student's fault at grading
    // time, but at authoring time it means the check does not judge anything.
    lesson.tasks[0]!.checks.push({
      id: "broken",
      type: "does.not.exist",
      args: {},
      onFail: { mn: "…" },
      weight: 1,
      hidden: false,
    });
    const report = await testCourse(course);
    expect(report.ok).toBe(false);
    expect(report.brokenChecks).toContain("m1-l1-t1/broken");
  });

  it("a broken reference solution is caught", async () => {
    const course = loadCourse(dir);
    // Sabotage m1-l1's solution so its dom.text check for "Shop.mn" fails.
    const lesson = course.stages[0]!.moduleObjects[0]!.lessonObjects.find((l) => l.id === "m1-l1")!;
    lesson.tasks[0]!.solution.patch = [
      { op: "insertAfter", path: "index.html", anchor: "<!-- энд бичнэ үү -->", content: "<h1>Wrong</h1>" },
    ];
    const report = await testCourse(course);
    expect(report.ok).toBe(false);
    expect(report.results.find((r) => r.taskId === "m1-l1-t1")!.passed).toBe(false);
  });
});
