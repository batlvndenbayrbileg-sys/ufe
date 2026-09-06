import { describe, expect, it } from "vitest";
import { cohortSummary, sortStudents, demoCohort, type CohortStudent } from "./cohort";

const s = (name: string, lessonsDone: number, xp: number, lastActiveDays: number): CohortStudent => ({
  id: name,
  name,
  lessonsDone,
  xp,
  level: 1,
  streakDays: 0,
  lastActiveDays,
});

describe("cohortSummary", () => {
  it("averages completion and counts weekly-active students", () => {
    const c = {
      name: "c",
      joinCode: "X",
      totalLessons: 10,
      students: [s("A", 10, 300, 0), s("B", 0, 0, 30), s("C", 5, 100, 3)],
    };
    const sum = cohortSummary(c);
    expect(sum.students).toBe(3);
    expect(sum.avgCompletion).toBe(50); // (100 + 0 + 50) / 3
    expect(sum.activeThisWeek).toBe(2); // A and C
    expect(sum.totalXp).toBe(400);
  });

  it("is zero for an empty cohort", () => {
    expect(cohortSummary({ name: "c", joinCode: "X", totalLessons: 10, students: [] })).toEqual({
      students: 0,
      avgCompletion: 0,
      activeThisWeek: 0,
      totalXp: 0,
    });
  });
});

describe("sortStudents", () => {
  const students = [s("Болд", 3, 50, 5), s("Ариун", 9, 200, 1), s("Цэцэг", 1, 20, 12)];
  it("sorts by progress, xp and recency, most-first", () => {
    expect(sortStudents(students, "progress").map((x) => x.name)).toEqual(["Ариун", "Болд", "Цэцэг"]);
    expect(sortStudents(students, "xp").map((x) => x.name)).toEqual(["Ариун", "Болд", "Цэцэг"]);
    expect(sortStudents(students, "active").map((x) => x.name)).toEqual(["Ариун", "Болд", "Цэцэг"]);
  });
  it("does not mutate the input", () => {
    const copy = [...students];
    sortStudents(students, "xp");
    expect(students).toEqual(copy);
  });
});

describe("demoCohort", () => {
  it("scales lesson counts to the course size and never exceeds it", () => {
    const c = demoCohort(84);
    expect(c.students.length).toBeGreaterThan(0);
    expect(c.students.every((st) => st.lessonsDone <= 84)).toBe(true);
  });
});
