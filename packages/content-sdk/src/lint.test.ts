import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { LessonSchema, type Lesson, type ResolvedCourse } from "./schema";
import { lintCourse, lintLesson } from "./lint";

const loadFixture = (): Lesson =>
  LessonSchema.parse(
    JSON.parse(
      readFileSync(fileURLToPath(new URL("../fixtures/ip-101/lessons/m1-l5.json", import.meta.url)), "utf8"),
    ),
  );

const asCourse = (lessons: Lesson[]): ResolvedCourse => ({
  id: "c",
  slug: "c",
  title: { mn: "c" },
  description: { mn: "c" },
  level: "beginner",
  skills: [],
  stages: [
    {
      id: "s",
      order: 1,
      title: { mn: "s" },
      moduleIds: ["m"],
      moduleObjects: [
        { id: "m", stageId: "s", order: 1, title: { mn: "m" }, description: { mn: "m" }, estimatedHours: 0, lessons: lessons.map((l) => l.id), lessonObjects: lessons },
      ],
    },
  ],
});

describe("linter", () => {
  it("passes a clean lesson", () => {
    expect(lintLesson(loadFixture()).filter((d) => d.severity === "error")).toHaveLength(0);
  });

  it("flags a lesson with the wrong number of hints", () => {
    const l = loadFixture();
    l.tasks[0]!.hints = l.tasks[0]!.hints.slice(0, 2);
    const diags = lintLesson(l);
    expect(diags.some((d) => d.code === "hints-not-three")).toBe(true);
  });

  it("warns when why.mn doesn't mention the project", () => {
    const l = loadFixture();
    l.why = { mn: "Ерөнхий тайлбар." };
    expect(lintLesson(l).some((d) => d.code === "why-no-project")).toBe(true);
  });

  it("flags hint 3 that is basically the solution", () => {
    const l = loadFixture();
    l.tasks[0]!.hints[2]!.code = l.tasks[0]!.solution.patch.map((p) => ("content" in p ? p.content : "")).join("\n");
    expect(lintLesson(l).some((d) => d.code === "hint3-is-solution")).toBe(true);
  });

  it("detects an unknown prerequisite", () => {
    const l = loadFixture();
    l.prerequisites = ["does-not-exist"];
    expect(lintCourse(asCourse([l])).some((d) => d.code === "prereq-unknown")).toBe(true);
  });

  it("detects a prerequisite cycle", () => {
    const a = loadFixture();
    a.id = "a"; a.moduleId = "m"; a.prerequisites = ["b"];
    const b = loadFixture();
    b.id = "b"; b.moduleId = "m"; b.prerequisites = ["a"];
    expect(lintCourse(asCourse([a, b])).some((d) => d.code === "prereq-cycle")).toBe(true);
  });
});
