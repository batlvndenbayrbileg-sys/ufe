"use client";

import { computeLevel, isoDateIn, nextStreak } from "@khiye/shared";

/**
 * Client-side progress store (localStorage). Shared by the learning loop and
 * the dashboard so what a student does in /learn shows up on /app immediately.
 * This is the MVP-demo store; once auth + DB land, the server (E2 transaction)
 * becomes the source of truth and this becomes an offline mirror.
 */

export interface Progress {
  passedTasks: Record<string, { xp: number; skills: string[]; assisted: boolean; at: number }>;
  xp: number;
  skillXp: Record<string, number>;
  streakDays: number;
  lastActiveDate: string | null;
  badges: string[];
  updatedAt: number;
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

/** Record a passing task (idempotent). Updates XP, per-skill XP and the streak. */
export function recordTaskPass(
  taskId: string,
  xpAwarded: number,
  skills: string[],
  assisted = false,
): Progress {
  const p = loadProgress();
  if (p.passedTasks[taskId]) return p; // XP once

  p.passedTasks[taskId] = { xp: xpAwarded, skills, assisted, at: Date.now() };
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
