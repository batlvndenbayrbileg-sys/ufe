"use client";

/**
 * "Resume where you left off." Remembers the last lesson + task a learner was
 * on (and per-lesson, the task within it) so leaving mid-way and coming back
 * lands them exactly there. Stored in localStorage and mirrored to a cookie so
 * the value survives and could be read on the server later; both are guarded so
 * private mode never breaks the learning loop.
 */

export interface ResumePoint {
  lessonId: string;
  courseSlug: string;
  taskIndex: number;
  at: number;
}

const KEY = "khiye:resume";
const LESSON_KEY = (lessonId: string) => `khiye:resume:lesson:${lessonId}`;
const COOKIE = "khiye_resume";

export function setResumePoint(p: Omit<ResumePoint, "at">): void {
  const value: ResumePoint = { ...p, at: Date.now() };
  try {
    localStorage.setItem(KEY, JSON.stringify(value));
    localStorage.setItem(LESSON_KEY(p.lessonId), String(p.taskIndex));
  } catch {
    /* storage blocked — ignore */
  }
  try {
    // 90-day cookie, same-site; lets a future server component greet the
    // learner with "continue" without a round-trip to localStorage.
    document.cookie = `${COOKIE}=${encodeURIComponent(p.lessonId)}; path=/; max-age=${60 * 60 * 24 * 90}; samesite=lax`;
  } catch {
    /* ignore */
  }
}

export function getResumePoint(): ResumePoint | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ResumePoint) : null;
  } catch {
    return null;
  }
}

/** The task index a learner had reached in a given lesson (0 if none saved). */
export function getLessonResumeIndex(lessonId: string): number {
  try {
    const raw = localStorage.getItem(LESSON_KEY(lessonId));
    const n = raw ? parseInt(raw, 10) : 0;
    return Number.isFinite(n) && n >= 0 ? n : 0;
  } catch {
    return 0;
  }
}
