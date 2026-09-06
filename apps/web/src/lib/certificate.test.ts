import { describe, expect, it } from "vitest";
import { certificateSerial, courseCompletion } from "./certificate";
import type { Progress } from "./progress";

const lesson = (id: string, taskIds: string[]): { id: string; order: number; title: { mn: string }; slug: string; estimatedMinutes: number; skills: string[]; taskIds: string[] } => ({
  id,
  order: 1,
  title: { mn: id },
  slug: id,
  estimatedMinutes: 5,
  skills: [],
  taskIds,
});

const progressWith = (passed: string[]): Progress => ({
  passedTasks: Object.fromEntries(passed.map((t) => [t, { xp: 10, skills: [], assisted: false, at: 0 }])),
  xp: 0,
  skillXp: {},
  streakDays: 0,
  lastActiveDate: null,
  badges: [],
  updatedAt: 0,
});

describe("certificateSerial", () => {
  it("is stable for the same inputs and formatted KH-TAG-CODE", () => {
    const a = certificateSerial("ip-101", "Ануужин");
    expect(a).toBe(certificateSerial("ip-101", "Ануужин"));
    expect(a).toMatch(/^KH-[A-Z0-9]{1,5}-[A-Z0-9]{6}$/);
  });

  it("differs by course and seed", () => {
    expect(certificateSerial("ip-101", "A")).not.toBe(certificateSerial("ip-101", "B"));
    expect(certificateSerial("ip-101", "A")).not.toBe(certificateSerial("other", "A"));
  });
});

describe("courseCompletion", () => {
  const lessons = [lesson("l1", ["t1"]), lesson("l2", ["t2", "t3"])];

  it("is complete only when every lesson's tasks pass", () => {
    expect(courseCompletion(lessons, progressWith([])).complete).toBe(false);
    expect(courseCompletion(lessons, progressWith(["t1"])).complete).toBe(false);
    expect(courseCompletion(lessons, progressWith(["t1", "t2"])).complete).toBe(false);
    const all = courseCompletion(lessons, progressWith(["t1", "t2", "t3"]));
    expect(all.complete).toBe(true);
    expect(all.done).toBe(2);
    expect(all.total).toBe(2);
  });
});
