import type { PrismaClient } from "@prisma/client";
import { prisma as defaultPrisma } from "../client";

/**
 * Read-side analytics for the student stats page and the teacher/admin review
 * screens. These are pure aggregate reads over the data the submit transaction
 * already records (TaskAttempt, XpLedger, LessonProgress, SkillMastery) — no
 * dependency on the content tables being seeded, so they work as soon as a
 * student has submitted anything.
 */

/** One task's rolled-up history for a single student. */
export interface TaskStatRow {
  taskId: string;
  attempts: number;
  passed: boolean;
  /** Total time across all attempts on this task. */
  durationMs: number;
  /** Highest hint level reached on this task. */
  hintsUsed: number;
  assisted: boolean;
  /** When the task was first passed (ms epoch), or last attempted if unsolved. */
  at: number | null;
}

export interface UserStats {
  profile: { totalXp: number; level: number; streakDays: number; lastStreakDate: number | null };
  tasksPassed: number;
  attemptsTotal: number;
  totalDurationMs: number;
  hintsTotal: number;
  assistedCount: number;
  lessonsCompleted: number;
  completedLessons: Array<{ lessonId: string; at: number | null }>;
  tasks: TaskStatRow[];
  skills: Array<{ skillId: string; xp: number }>;
  xpRecent: Array<{ amount: number; reason: string; refId: string | null; at: number }>;
}

/**
 * Full stat breakdown for one student. For a single user the attempt volume is
 * small enough to fold in memory, which keeps the per-task rollup exact
 * (distinct-task counts, first-pass timing) without contorted SQL.
 */
export async function getUserStats(
  userId: string,
  client: PrismaClient = defaultPrisma,
): Promise<UserStats> {
  const [profile, attempts, completed, skills, xpRecent] = await Promise.all([
    client.studentProfile.findUnique({ where: { userId } }),
    client.taskAttempt.findMany({
      where: { userId },
      select: {
        taskId: true,
        passed: true,
        assisted: true,
        hintsUsed: true,
        durationMs: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    client.lessonProgress.findMany({
      where: { userId, status: "COMPLETED" },
      select: { lessonId: true, completedAt: true },
    }),
    client.skillMastery.findMany({ where: { userId }, select: { skillId: true, xp: true } }),
    client.xpLedger.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 25,
      select: { amount: true, reason: true, refId: true, createdAt: true },
    }),
  ]);

  const byTask = new Map<string, TaskStatRow>();
  let attemptsTotal = 0;
  let totalDurationMs = 0;
  for (const a of attempts) {
    attemptsTotal += 1;
    totalDurationMs += a.durationMs;
    const row = byTask.get(a.taskId) ?? {
      taskId: a.taskId,
      attempts: 0,
      passed: false,
      durationMs: 0,
      hintsUsed: 0,
      assisted: false,
      at: null,
    };
    row.attempts += 1;
    row.durationMs += a.durationMs;
    row.hintsUsed = Math.max(row.hintsUsed, a.hintsUsed);
    if (a.assisted) row.assisted = true;
    if (a.passed && !row.passed) {
      row.passed = true;
      row.at = a.createdAt.getTime(); // first passing attempt
    } else if (row.at === null) {
      row.at = a.createdAt.getTime(); // most recent attempt so far (unsolved)
    }
    byTask.set(a.taskId, row);
  }

  const tasks = [...byTask.values()];
  const tasksPassed = tasks.filter((t) => t.passed).length;
  const hintsTotal = tasks.reduce((n, t) => n + t.hintsUsed, 0);
  const assistedCount = tasks.filter((t) => t.assisted && t.passed).length;

  return {
    profile: {
      totalXp: profile?.totalXp ?? 0,
      level: profile?.level ?? 1,
      streakDays: profile?.streakDays ?? 0,
      lastStreakDate: profile?.lastStreakDate?.getTime() ?? null,
    },
    tasksPassed,
    attemptsTotal,
    totalDurationMs,
    hintsTotal,
    assistedCount,
    lessonsCompleted: completed.length,
    completedLessons: completed.map((c) => ({
      lessonId: c.lessonId,
      at: c.completedAt?.getTime() ?? null,
    })),
    tasks,
    skills,
    xpRecent: xpRecent.map((x) => ({
      amount: x.amount,
      reason: x.reason,
      refId: x.refId,
      at: x.createdAt.getTime(),
    })),
  };
}

/** One row of the teacher/admin roster. */
export interface StudentRow {
  id: string;
  name: string;
  username: string;
  email: string;
  role: string;
  totalXp: number;
  level: number;
  streakDays: number;
  tasksPassed: number;
  lessonsCompleted: number;
  totalDurationMs: number;
  lastActiveAt: number | null;
}

/**
 * Roster of learners with their headline numbers, for the teacher/admin table.
 * Aggregates come from grouped reads so the whole table is a handful of queries
 * regardless of class size.
 */
export async function listStudents(
  opts: { limit?: number } = {},
  client: PrismaClient = defaultPrisma,
): Promise<StudentRow[]> {
  const limit = Math.min(Math.max(opts.limit ?? 200, 1), 1000);

  const users = await client.user.findMany({
    where: { status: "ACTIVE" },
    take: limit,
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      role: true,
      lastActiveAt: true,
      profile: { select: { totalXp: true, level: true, streakDays: true } },
    },
  });
  if (users.length === 0) return [];
  const ids = users.map((u) => u.id);

  const [passedAgg, doneAgg, timeAgg] = await Promise.all([
    // Distinct passed tasks per user = lessonProgress.tasksPassed summed.
    client.lessonProgress.groupBy({
      by: ["userId"],
      where: { userId: { in: ids } },
      _sum: { tasksPassed: true },
    }),
    client.lessonProgress.groupBy({
      by: ["userId"],
      where: { userId: { in: ids }, status: "COMPLETED" },
      _count: { _all: true },
    }),
    client.taskAttempt.groupBy({
      by: ["userId"],
      where: { userId: { in: ids } },
      _sum: { durationMs: true },
      _max: { createdAt: true },
    }),
  ]);

  const passedBy = new Map(passedAgg.map((r) => [r.userId, r._sum.tasksPassed ?? 0]));
  const doneBy = new Map(doneAgg.map((r) => [r.userId, r._count._all]));
  const timeBy = new Map(timeAgg.map((r) => [r.userId, r]));

  return users
    .map((u) => {
      const t = timeBy.get(u.id);
      const lastAttempt = t?._max.createdAt?.getTime() ?? null;
      return {
        id: u.id,
        name: u.name,
        username: u.username,
        email: u.email,
        role: u.role,
        totalXp: u.profile?.totalXp ?? 0,
        level: u.profile?.level ?? 1,
        streakDays: u.profile?.streakDays ?? 0,
        tasksPassed: passedBy.get(u.id) ?? 0,
        lessonsCompleted: doneBy.get(u.id) ?? 0,
        totalDurationMs: t?._sum.durationMs ?? 0,
        lastActiveAt: u.lastActiveAt?.getTime() ?? lastAttempt,
      };
    })
    .sort((a, b) => b.totalXp - a.totalXp);
}

/** One ranked learner on a module leaderboard. */
export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  username: string;
  tasksPassed: number;
}

/**
 * Rank learners by how many tasks they have passed across a module's lessons.
 * Pass the module's lesson ids (resolved from content). Ties keep DB order;
 * only learners with at least one passed task appear.
 */
export async function moduleLeaderboard(
  lessonIds: string[],
  limit = 20,
  client: PrismaClient = defaultPrisma,
): Promise<LeaderboardEntry[]> {
  if (lessonIds.length === 0) return [];
  const rows = await client.lessonProgress.groupBy({
    by: ["userId"],
    where: { lessonId: { in: lessonIds } },
    _sum: { tasksPassed: true },
  });
  const ranked = rows
    .map((r) => ({ userId: r.userId, tasksPassed: r._sum.tasksPassed ?? 0 }))
    .filter((r) => r.tasksPassed > 0)
    .sort((a, b) => b.tasksPassed - a.tasksPassed)
    .slice(0, Math.min(Math.max(limit, 1), 100));
  if (ranked.length === 0) return [];

  const users = await client.user.findMany({
    where: { id: { in: ranked.map((r) => r.userId) } },
    select: { id: true, name: true, username: true },
  });
  const byId = new Map(users.map((u) => [u.id, u]));

  return ranked.map((r, i) => ({
    rank: i + 1,
    userId: r.userId,
    name: byId.get(r.userId)?.name ?? "—",
    username: byId.get(r.userId)?.username ?? "",
    tasksPassed: r.tasksPassed,
  }));
}

/** Where one student stands: what they've finished and what they're on now. */
export interface StudentProgressDetail {
  userId: string;
  /** Lessons finished, for mapping onto stages in the content layer. */
  completedLessonIds: string[];
  /** The lesson they are in the middle of (most recently started, unfinished). */
  currentLessonId: string | null;
  currentTasksPassed: number;
  currentTasksTotal: number;
  /** Most recent activity on any lesson (ms epoch). */
  lastProgressAt: number | null;
}

/**
 * Per-student lesson progress for the roster and the stage leaderboard.
 *
 * `listStudents` only carries headline totals, which can't answer "who finished
 * which stage" or "what is this student working on right now" — both need the
 * actual lesson ids, mapped onto stages by the content layer (the DB doesn't
 * know the course shape).
 */
export async function listStudentProgressDetail(
  userIds: string[],
  client: PrismaClient = defaultPrisma,
): Promise<Map<string, StudentProgressDetail>> {
  const out = new Map<string, StudentProgressDetail>();
  if (userIds.length === 0) return out;

  const rows = await client.lessonProgress.findMany({
    where: { userId: { in: userIds } },
    select: {
      userId: true,
      lessonId: true,
      status: true,
      tasksPassed: true,
      tasksTotal: true,
      startedAt: true,
      completedAt: true,
    },
  });

  // Track the best candidate for "current" separately: an unfinished lesson
  // beats a finished one, and among those the most recently started wins.
  const bestOpen = new Map<string, { at: number; row: (typeof rows)[number] }>();
  const bestDone = new Map<string, { at: number; row: (typeof rows)[number] }>();

  for (const r of rows) {
    const entry =
      out.get(r.userId) ??
      ({
        userId: r.userId,
        completedLessonIds: [],
        currentLessonId: null,
        currentTasksPassed: 0,
        currentTasksTotal: 0,
        lastProgressAt: null,
      } satisfies StudentProgressDetail);

    const touched = Math.max(r.completedAt?.getTime() ?? 0, r.startedAt?.getTime() ?? 0);
    if (touched > 0) entry.lastProgressAt = Math.max(entry.lastProgressAt ?? 0, touched);

    if (r.status === "COMPLETED") {
      entry.completedLessonIds.push(r.lessonId);
      const prev = bestDone.get(r.userId);
      if (!prev || touched > prev.at) bestDone.set(r.userId, { at: touched, row: r });
    } else {
      const prev = bestOpen.get(r.userId);
      if (!prev || touched > prev.at) bestOpen.set(r.userId, { at: touched, row: r });
    }

    out.set(r.userId, entry);
  }

  for (const [userId, entry] of out) {
    const pick = bestOpen.get(userId) ?? bestDone.get(userId);
    if (pick) {
      entry.currentLessonId = pick.row.lessonId;
      entry.currentTasksPassed = pick.row.tasksPassed;
      entry.currentTasksTotal = pick.row.tasksTotal;
    }
  }

  return out;
}
