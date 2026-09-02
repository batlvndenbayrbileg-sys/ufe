import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { flattenLessons, loadCourse } from "./loader";
import { lintCourse, summarize } from "./lint";
import { bundleCourse } from "./build";

const dir = fileURLToPath(new URL("../fixtures/ip-101", import.meta.url));

describe("loadCourse", () => {
  const course = loadCourse(dir);

  it("resolves the full tree", () => {
    expect(course.id).toBe("ip-101");
    expect(course.stages).toHaveLength(1);
    expect(course.stages[0]!.moduleObjects).toHaveLength(1);
    const lessons = flattenLessons(course);
    expect(lessons.map((l) => l.id)).toEqual(["m1-l1", "m1-l2", "m1-l5"]);
  });

  it("orders lessons by their order field", () => {
    const ids = flattenLessons(course).map((l) => l.id);
    expect(ids).toEqual([...ids].sort((a, b) => Number(a.slice(-1)) - Number(b.slice(-1))));
  });

  it("the fixture course lints clean (no errors, no warnings)", () => {
    const { errors, warnings } = summarize(lintCourse(course));
    expect(errors).toBe(0);
    expect(warnings).toBe(0);
  });

  it("bundles with correct stats", () => {
    const b = bundleCourse(course);
    expect(b.stats).toEqual({ stageCount: 1, moduleCount: 1, lessonCount: 3, taskCount: 3 });
    expect(b.skills.map((s) => s.id)).toEqual(["html", "css"]);
  });
});
