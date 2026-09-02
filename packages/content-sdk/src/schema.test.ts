import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { LessonSchema } from "./schema";

const fixture = (name: string) =>
  JSON.parse(
    readFileSync(fileURLToPath(new URL(`../fixtures/ip-101/lessons/${name}`, import.meta.url)), "utf8"),
  );

describe("LessonSchema", () => {
  it("accepts a well-formed lesson", () => {
    const r = LessonSchema.safeParse(fixture("m1-l5.json"));
    expect(r.success).toBe(true);
  });

  // 10 malformed inputs, each expected to fail at a precise path.
  const base = () => fixture("m1-l5.json");
  const cases: Array<[string, (l: Record<string, unknown>) => void, string]> = [
    ["missing why.mn", (l) => { (l.why as Record<string, unknown>).mn = ""; }, "why.mn"],
    ["no tasks", (l) => { l.tasks = []; }, "tasks"],
    ["task with no checks", (l) => { (l.tasks as { checks: unknown[] }[])[0]!.checks = []; }, "checks"],
    ["bad execution tier", (l) => { (l.execution as Record<string, unknown>).tier = 4; }, "execution.tier"],
    ["bad runtime", (l) => { (l.execution as Record<string, unknown>).runtime = "cobol"; }, "execution.runtime"],
    ["skill not kebab", (l) => { l.skills = ["HTML"]; }, "skills.0"],
    ["hint level 5", (l) => { (l.tasks as { hints: { level: number }[] }[])[0]!.hints[0]!.level = 5; }, "hints.0.level"],
    ["negative xp", (l) => { (l.tasks as { xp: number }[])[0]!.xp = -5; }, "xp"],
    ["bad file patch op", (l) => {
      (l.tasks as { solution: { patch: unknown[] } }[])[0]!.solution.patch = [{ op: "nuke", path: "x" }];
    }, "solution.patch"],
    ["passThreshold > 1", (l) => { (l.tasks as { passThreshold: number }[])[0]!.passThreshold = 2; }, "passThreshold"],
  ];

  it.each(cases)("rejects: %s", (_name, mutate, expectedPath) => {
    const lesson = base();
    mutate(lesson);
    const r = LessonSchema.safeParse(lesson);
    expect(r.success).toBe(false);
    if (!r.success) {
      const paths = r.error.issues.map((i) => i.path.join("."));
      expect(paths.some((p) => p.includes(expectedPath))).toBe(true);
    }
  });
});
