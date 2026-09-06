import { level } from "@/lib/progress";

/** One student's standing in a cohort. */
export interface CohortStudent {
  id: string;
  name: string;
  lessonsDone: number;
  xp: number;
  level: number;
  streakDays: number;
  /** Days since last active (0 = today). */
  lastActiveDays: number;
}

export interface CohortOverview {
  name: string;
  joinCode: string;
  totalLessons: number;
  students: CohortStudent[];
}

export interface CohortSummary {
  students: number;
  avgCompletion: number; // 0–100
  activeThisWeek: number;
  totalXp: number;
}

/** Cohort-level roll-up used by the summary cards. */
export function cohortSummary(c: CohortOverview): CohortSummary {
  const n = c.students.length;
  const avgCompletion =
    n === 0 || c.totalLessons === 0
      ? 0
      : Math.round((c.students.reduce((s, st) => s + st.lessonsDone / c.totalLessons, 0) / n) * 100);
  return {
    students: n,
    avgCompletion,
    activeThisWeek: c.students.filter((s) => s.lastActiveDays <= 7).length,
    totalXp: c.students.reduce((s, st) => s + st.xp, 0),
  };
}

export type SortKey = "name" | "progress" | "xp" | "active";

/** Sort students for the roster table. Progress/xp/active are most-first. */
export function sortStudents(students: CohortStudent[], key: SortKey): CohortStudent[] {
  const by = [...students];
  switch (key) {
    case "name":
      return by.sort((a, b) => a.name.localeCompare(b.name, "mn"));
    case "progress":
      return by.sort((a, b) => b.lessonsDone - a.lessonsDone);
    case "xp":
      return by.sort((a, b) => b.xp - a.xp);
    case "active":
      return by.sort((a, b) => a.lastActiveDays - b.lastActiveDays);
  }
}

/**
 * A realistic demo cohort for demo mode (no database to read). A real
 * deployment fetches the teacher's actual cohort; the shapes match so the same
 * table renders either way.
 */
export function demoCohort(totalLessons: number): CohortOverview {
  const raw: Array<[string, number, number, number]> = [
    // name, lessonsDone, streakDays, lastActiveDays
    ["Ануужин Б.", Math.round(totalLessons * 0.98), 21, 0],
    ["Тэмүүлэн Г.", Math.round(totalLessons * 0.82), 12, 0],
    ["Сараа Д.", Math.round(totalLessons * 0.74), 8, 1],
    ["Батсайхан Э.", Math.round(totalLessons * 0.6), 5, 2],
    ["Номин-Эрдэнэ О.", Math.round(totalLessons * 0.45), 0, 9],
    ["Хулан Ц.", Math.round(totalLessons * 0.31), 3, 1],
    ["Билгүүн М.", Math.round(totalLessons * 0.18), 2, 4],
    ["Энхжин Т.", Math.round(totalLessons * 0.06), 0, 15],
  ];
  const students: CohortStudent[] = raw.map(([name, lessonsDone, streakDays, lastActiveDays], i) => {
    const xp = lessonsDone * 15 + streakDays * 20;
    return {
      id: `demo-${i + 1}`,
      name,
      lessonsDone,
      xp,
      level: level(xp),
      streakDays,
      lastActiveDays,
    };
  });
  return { name: "2026 намар — Интернэт программчлал", joinCode: "DEMO2026", totalLessons, students };
}
