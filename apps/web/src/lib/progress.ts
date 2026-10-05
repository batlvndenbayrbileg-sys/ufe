"use client";

import { computeLevel, isoDateIn, nextStreak } from "@khiye/shared";

/**
 * Client-side progress store (localStorage). Shared by the learning loop and
 * the dashboard so what a student does in /learn shows up on /app immediately.
 * This is the MVP-demo store; once auth + DB land, the server (E2 transaction)
 * becomes the source of truth and this becomes an offline mirror.
 */

export interface PassedTask {
  xp: number;
  skills: string[];
  assisted: boolean;
  at: number;
  /** Time spent before this task first passed (ms). Absent on pre-upgrade entries. */
  durationMs?: number;
  /** Highest hint level reached on this task. */
  hintsUsed?: number;
  /** Failed submissions before the pass (1 = solved first try). */
  attempts?: number;
}

export interface Progress {
  passedTasks: Record<string, PassedTask>;
  xp: number;
  skillXp: Record<string, number>;
  streakDays: number;
  lastActiveDate: string | null;
  badges: string[];
  updatedAt: number;
}

export interface TaskPassMeta {
  durationMs?: number;
  hintsUsed?: number;
  attempts?: number;
  assisted?: boolean;
}

const KEY = "khiye:progress:ip-101";

const EMPTY: Progress = {
  passedTasks: {},
  xp: 0,
  skillXp: {},
  streakDays: 0,
  lastActiveDate: null,
  badges: [],
  updatedAt: 0,
};

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY };
    return { ...EMPTY, ...(JSON.parse(raw) as Progress) };
  } catch {
    return { ...EMPTY };
  }
}

function save(p: Progress): Progress {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* private mode / blocked — keep in memory only */
  }
  return p;
}

export function isTaskPassed(taskId: string): boolean {
  return taskId in loadProgress().passedTasks;
}

/** Record a passing task (idempotent). Updates XP, per-skill XP and the streak.
 *  `meta` carries the effort figures the workspace measured (time, hints,
 *  attempts) so the stats page can show time-per-task even in local mode. */
export function recordTaskPass(
  taskId: string,
  xpAwarded: number,
  skills: string[],
  meta: TaskPassMeta = {},
): Progress {
  const p = loadProgress();
  if (p.passedTasks[taskId]) return p; // XP once

  p.passedTasks[taskId] = {
    xp: xpAwarded,
    skills,
    assisted: meta.assisted ?? false,
    at: Date.now(),
    durationMs: meta.durationMs,
    hintsUsed: meta.hintsUsed,
    attempts: meta.attempts,
  };
  p.xp += xpAwarded;
  for (const s of skills) p.skillXp[s] = (p.skillXp[s] ?? 0) + xpAwarded;

  const today = isoDateIn(new Date());
  const streak = nextStreak(p.lastActiveDate, today, p.streakDays);
  p.streakDays = streak.days;
  p.lastActiveDate = today;
  p.updatedAt = Date.now();
  return save(p);
}

export function awardBadge(badgeId: string): Progress {
  const p = loadProgress();
  if (!p.badges.includes(badgeId)) {
    p.badges.push(badgeId);
    save(p);
  }
  return p;
}

export function level(xp: number): number {
  return computeLevel(xp);
}

/** Completion counts for a lesson given its task ids. */
export function lessonProgress(taskIds: string[], p = loadProgress()): { passed: number; total: number; done: boolean } {
  const passed = taskIds.filter((id) => id in p.passedTasks).length;
  return { passed, total: taskIds.length, done: taskIds.length > 0 && passed === taskIds.length };
}

/**
 * Pull the signed-in learner's progress from the server and merge it into the
 * local blob.
 *
 * localStorage is per-device, so a student signing in on a second device saw an
 * empty course even though every pass was recorded in the DB. Progress must
 * follow the ACCOUNT. We merge rather than replace: the UNION of passed tasks
 * and the higher of each total, so work done on this device (including while
 * signed out) is never thrown away by a sync. Signed-out, or on any network/DB
 * hiccup, the local blob is returned untouched.
 */
export async function syncProgressFromServer(): Promise<Progress> {
  const local = loadProgress();
  try {
    const res = await fetch("/api/me/progress", { cache: "no-store" });
    if (!res.ok) return local;
    const body = (await res.json()) as {
      data?: { signedIn: boolean; progress: Progress | null };
    };
    const server = body.data?.progress;
    if (!body.data?.signedIn || !server) return local;

    const skillXp: Record<string, number> = { ...local.skillXp };
    for (const [id, xp] of Object.entries(server.skillXp ?? {})) {
      skillXp[id] = Math.max(skillXp[id] ?? 0, xp);
    }

    return save({
      passedTasks: { ...local.passedTasks, ...server.passedTasks },
      xp: Math.max(local.xp, server.xp),
      skillXp,
      streakDays: Math.max(local.streakDays, server.streakDays),
      // ISO dates compare lexicographically — the later one wins.
      lastActiveDate:
        [local.lastActiveDate, server.lastActiveDate].filter(Boolean).sort().pop() ?? null,
      badges: [...new Set([...local.badges, ...server.badges])],
      updatedAt: Date.now(),
    });
  } catch {
    return local;
  }
}
