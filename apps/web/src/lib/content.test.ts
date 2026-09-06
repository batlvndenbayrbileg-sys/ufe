import { describe, expect, it } from "vitest";
import { getLessonPublic, getNextLesson, getNextLessonId, gradeQuiz } from "./content";

/**
 * Finishing a lesson hands the student the next one. Across 84 lessons the
 * interesting cases are the seams: the walk has to continue past the end of a
 * module and past the end of a stage, and stop at the very end.
 */
describe("getNextLesson", () => {
  it("walks to the next lesson in the same module", () => {
    expect(getNextLesson("m1-l1")?.id).toBe("m1-l2");
  });

  it("crosses a module boundary", () => {
    expect(getNextLesson("m1-l6")?.id).toBe("m2-l1");
  });

  it("crosses a stage boundary", () => {
    expect(getNextLesson("m3-l4")?.id).toBe("m4-l1");
  });

  it("returns null at the end of the course", () => {
    expect(getNextLessonId("m17-l3")).toBeNull();
    expect(getNextLesson("m17-l3")).toBeNull();
  });

  it("carries a title to label the link with", () => {
    const next = getNextLesson("m1-l1");
    expect(next?.title.mn.length).toBeGreaterThan(0);
  });

  it("is null for a lesson that does not exist", () => {
    expect(getNextLesson("nope")).toBeNull();
  });
});

describe("getLessonPublic", () => {
  it("never leaks the solution, the hint text or the check arguments", () => {
    const lesson = getLessonPublic("m1-l1")!;

    for (const task of lesson.tasks) {
      // Hints and the solution are listed so the ladder can show what is
      // available and at what cost — the content behind them is not sent.
      for (const hint of task.hints) {
        expect(hint).not.toHaveProperty("text");
        expect(hint).not.toHaveProperty("code");
      }
      expect(task.solution).toEqual({ unlocked: false });

      // Checks are counted, not described: their args are the answer key.
      expect(task).not.toHaveProperty("checks");
      expect(typeof task.checkCount).toBe("number");
    }

    const serialised = JSON.stringify(lesson);
    expect(serialised).not.toContain("xpPenalty");
    expect(serialised).not.toContain("explanation");
  });
});

describe("gradeQuiz", () => {
  it("scores a checkpoint quiz and returns the key and explanations", () => {
    const graded = gradeQuiz("m1-l6", [1, 1]);
    expect(graded).not.toBeNull();
    expect(graded!.total).toBe(2);
    expect(graded!.score).toBe(2);
    expect(graded!.results.every((r) => r.correct)).toBe(true);
    expect(graded!.results[0]!.explanation.mn.length).toBeGreaterThan(0);
  });

  it("marks wrong answers and still names the correct index", () => {
    const graded = gradeQuiz("m1-l6", [0, 1])!;
    expect(graded.score).toBe(1);
    expect(graded.results[0]!.correct).toBe(false);
    expect(graded.results[0]!.correctIndex).toBe(1);
  });

  it("is null for an unknown lesson", () => {
    expect(gradeQuiz("nope", [])).toBeNull();
  });

  it("treats a lesson without a quiz as an empty quiz", () => {
    const graded = gradeQuiz("m1-l1", [])!;
    expect(graded.total).toBe(0);
    expect(graded.score).toBe(0);
  });
});
