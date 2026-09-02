/**
 * XP, levels and assist weighting (docs/blueprint/08-dashboards.md §8.2).
 * Pure functions shared by the submit transaction (E2) and the dashboard (E8).
 * XP is only ever awarded for verified production of working code.
 */

export const XP = {
  taskTrivial: 5,
  taskNormal: 10,
  taskHard: 20,
  taskCheckpoint: 40,
  lessonBonus: 15,
  moduleBonus: 100,
  stageCheckpoint: 250,
  quizCorrect: 3,
  dailyGoal: 20,
  streakWeek: 50,
} as const;

/** First-attempt, unassisted pass earns a multiplier. */
export const FIRST_TRY_MULTIPLIER = 1.25;
/** Revealing the solution caps the award at this fraction and flags the task. */
export const ASSISTED_FACTOR = 0.4;

export interface TaskAwardInput {
  baseXp: number;
  attemptNo: number;
  hintsUsed: number;
  assisted: boolean;
}

/** XP actually credited for a task pass, after multipliers/penalties. Never negative. */
export function computeTaskXp({ baseXp, attemptNo, hintsUsed, assisted }: TaskAwardInput): number {
  if (assisted) return Math.round(baseXp * ASSISTED_FACTOR);
  let xp = baseXp;
  if (attemptNo === 1 && hintsUsed === 0) xp = Math.round(xp * FIRST_TRY_MULTIPLIER);
  // Hint costs: level 2 = -1, level 3 = -3 (cumulative view: hintsUsed maps to cost)
  const hintCost = hintsUsed >= 3 ? 3 : hintsUsed === 2 ? 1 : 0;
  return Math.max(0, xp - hintCost);
}

/** level = floor(sqrt(xp / 60)) + 1 */
export function computeLevel(totalXp: number): number {
  if (totalXp <= 0) return 1;
  return Math.floor(Math.sqrt(totalXp / 60)) + 1;
}

/** Total XP needed to reach a given level (inverse of computeLevel). */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return (level - 1) * (level - 1) * 60;
}

export type LevelTitleKey =
  | "beginner"
  | "learner"
  | "coder"
  | "frontend"
  | "fullstackIntern"
  | "junior"
  | "builder";

export function levelTitleKey(level: number): LevelTitleKey {
  if (level >= 15) return "builder";
  if (level >= 13) return "junior";
  if (level >= 10) return "fullstackIntern";
  if (level >= 7) return "frontend";
  if (level >= 5) return "coder";
  if (level >= 3) return "learner";
  return "beginner";
}

/** Skill mastery weight for a passed task. */
export function assistWeight(assisted: boolean): number {
  return assisted ? ASSISTED_FACTOR : 1;
}

/** ISO date (YYYY-MM-DD) in the given IANA zone; defaults to Ulaanbaatar. */
export function isoDateIn(date: Date, timeZone = "Asia/Ulaanbaatar"): string {
  // en-CA yields YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(date);
}

/**
 * Streak transition. A day counts only when a task is passed.
 * Same day → unchanged; consecutive day → +1; gap → reset to 1.
 */
export function nextStreak(
  lastDate: string | null,
  today: string,
  current: number,
): { days: number; extendedToday: boolean } {
  if (lastDate === today) return { days: Math.max(current, 1), extendedToday: false };
  const t = new Date(today + "T00:00:00Z");
  const yesterday = new Date(t.getTime() - 86_400_000).toISOString().slice(0, 10);
  if (lastDate === yesterday) return { days: current + 1, extendedToday: true };
  return { days: 1, extendedToday: true };
}
