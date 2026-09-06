import { describe, expect, it } from "vitest";
import { isLessonAccessible } from "./course-types";

describe("isLessonAccessible", () => {
  it("lets a student open finished and current lessons, not locked ones", () => {
    expect(isLessonAccessible("done", false)).toBe(true);
    expect(isLessonAccessible("current", false)).toBe(true);
    expect(isLessonAccessible("locked", false)).toBe(false);
  });

  it("lets an admin open every lesson, including locked ones", () => {
    expect(isLessonAccessible("done", true)).toBe(true);
    expect(isLessonAccessible("current", true)).toBe(true);
    expect(isLessonAccessible("locked", true)).toBe(true);
  });
});
