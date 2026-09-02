import type { Prisma, PrismaClient } from "@prisma/client";
import {
  assistWeight,
  computeLevel,
  computeTaskXp,
  isoDateIn,
  nextStreak,
} from "@khiye/shared";
import { prisma as defaultPrisma } from "../client";

export interface CheckResultInput {
  checkKey: string;
  passed: boolean;
  actual?: string;
  expected?: string;
  errorKind?: string;
  durationMs: number;
}

export interface SubmitInput {
  userId: string;
  taskId: string;
  /** Authoritative server verdict. */
  passed: boolean;
  assisted?: boolean;
  hintsUsed?: number;
  durationMs?: number;
  verifiedBy?: string;
  clientAgreed?: boolean;
  suspicious?: boolean;
  snapshotId?: string;
  checkResults?: CheckResultInput[];
}

export interface AwardResult {
  attemptNo: number;
  passed: boolean;
  /** True when the task was already passed before this submission (no XP re-award). */
  alreadyPassed: boolean;
  assisted: boolean;
  xpAwarded: number;
  newTotalXp: number;
  newLevel: number;
  levelUp: boolean;
  streakDays: number;
  streakExtended: boolean;
  lessonProgress: { tasksPassed: number; tasksTotal: number; completed: boolean };
  unlockedNextTaskId: string | null;
  unlockedNextLessonId: string | null;
  submissionId: string;
}

const isUniqueViolation = (e: unknown): boolean =>
  typeof e === "object" && e !== null && (e as { code?: string }).code === "P2002";

/**
 * Record a submission and, on the first passing submission for a task, award
 * XP / advance progress / update streak & mastery — all in ONE transaction
 * (docs/blueprint/11 §11.4 step 8). Idempotent: XP is credited at most once
 * per task, guaranteed by the (userId, taskId, attemptNo) unique constraint
 * (concurrent double-submits collide and are retried as "already passed").
 */
export async function awardTaskCompletion(
  input: SubmitInput,
  client: PrismaClient = defaultPrisma,
): Promise<AwardResult> {
  const maxRetries = 5;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await runAward(input, client);
    } catch (e) {
      if (isUniqueViolation(e) && i < maxRetries - 1) continue; // attemptNo race → retry
      throw e;
    }
  }
  throw new Error("awardTaskCompletion: exceeded retries");
}

async function runAward(input: SubmitInput, client: PrismaClient): Promise<AwardResult> {
  const {
    userId,
    taskId,
    passed,
    assisted = false,
    hintsUsed = 0,
    durationMs = 0,
    verifiedBy = "server",
    clientAgreed = true,
    suspicious = false,
    snapshotId,
    checkResults = [],
  } = input;

  return client.$transaction(async (tx) => {
    const task = await tx.task.findUniqueOrThrow({
      where: { id: taskId },
      include: { lesson: { select: { id: true, moduleId: true, order: true } } },
    });

    const tasksTotal = await tx.task.count({ where: { lessonId: task.lessonId } });

    const priorPassed = await tx.taskAttempt.findFirst({
      where: { userId, taskId, passed: true },
      select: { id: true },
    });
    const alreadyPassed = priorPassed !== null;

    const lastAttempt = await tx.taskAttempt.findFirst({
      where: { userId, taskId },
      orderBy: { attemptNo: "desc" },
      select: { attemptNo: true },
    });
    const attemptNo = (lastAttempt?.attemptNo ?? 0) + 1;

    const submission = await tx.submission.create({
      data: {
        userId,
        taskId,
        passed,
        verifiedBy,
        clientAgreed,
        suspicious,
        durationMs,
        snapshotId,
        results: checkResults.length
          ? { create: checkResults.map((r) => ({ ...r })) }
          : undefined,
      },
      select: { id: true },
    });

    await tx.taskAttempt.create({
      data: {
        userId,
        taskId,
        attemptNo, // unique(userId,taskId,attemptNo) — the concurrency guard
        passed,
        assisted,
        hintsUsed,
        durationMs,
        submissionId: submission.id,
      },
    });

    const award = passed && !alreadyPassed;
    let xpAwarded = 0;
    let newTotalXp = 0;
    let newLevel = 1;
    let levelUp = false;
    let streakDays = 0;
    let streakExtended = false;
    let tasksPassed = 0;
    let lessonCompleted = false;
    let unlockedNextTaskId: string | null = null;
    let unlockedNextLessonId: string | null = null;

    // Lesson progress reflects passed-task count regardless of XP idempotency.
    const lp = await tx.lessonProgress.upsert({
      where: { userId_lessonId: { userId, lessonId: task.lessonId } },
      create: {
        userId,
        lessonId: task.lessonId,
        status: "IN_PROGRESS",
        tasksTotal,
        tasksPassed: 0,
        startedAt: new Date(),
      },
      update: { tasksTotal },
      select: { tasksPassed: true },
    });
    tasksPassed = lp.tasksPassed;

    if (award) {
      xpAwarded = computeTaskXp({ baseXp: task.xp, attemptNo, hintsUsed, assisted });

      // XP ledger + denormalised total + level (in the same transaction).
      const profile = await tx.studentProfile.findUnique({ where: { userId } });
      const prevXp = profile?.totalXp ?? 0;
      newTotalXp = prevXp + xpAwarded;
      const prevLevel = profile?.level ?? computeLevel(prevXp);
      newLevel = computeLevel(newTotalXp);
      levelUp = newLevel > prevLevel;

      const today = isoDateIn(new Date());
      const streak = nextStreak(
        profile?.lastStreakDate ? isoDateIn(profile.lastStreakDate) : null,
        today,
        profile?.streakDays ?? 0,
      );
      streakDays = streak.days;
      streakExtended = streak.extendedToday;

      if (xpAwarded > 0) {
        await tx.xpLedger.create({
          data: { userId, amount: xpAwarded, reason: "task_passed", refType: "task", refId: taskId },
        });
      }

      await tx.studentProfile.upsert({
        where: { userId },
        create: {
          userId,
          totalXp: newTotalXp,
          level: newLevel,
          streakDays,
          lastStreakDate: new Date(),
        },
        update: {
          totalXp: { increment: xpAwarded },
          level: newLevel,
          streakDays,
          lastStreakDate: new Date(),
        },
      });

      // Passed-task count + lesson completion.
      const updatedLp = await tx.lessonProgress.update({
        where: { userId_lessonId: { userId, lessonId: task.lessonId } },
        data: { tasksPassed: { increment: 1 } },
        select: { tasksPassed: true },
      });
      tasksPassed = updatedLp.tasksPassed;
      lessonCompleted = tasksPassed >= tasksTotal;
      if (lessonCompleted) {
        await tx.lessonProgress.update({
          where: { userId_lessonId: { userId, lessonId: task.lessonId } },
          data: { status: "COMPLETED", completedAt: new Date() },
        });
      }

      // Skill mastery XP (percent recomputed in E8).
      const w = assistWeight(assisted);
      for (const skillId of task.skills) {
        await tx.skillMastery.upsert({
          where: { userId_skillId: { userId, skillId } },
          create: { userId, skillId, xp: Math.round(task.xp * w) },
          update: { xp: { increment: Math.round(task.xp * w) } },
        });
      }

      // Unlock next task within the lesson, else the next lesson.
      const nextTask = await tx.task.findFirst({
        where: { lessonId: task.lessonId, order: { gt: task.order } },
        orderBy: { order: "asc" },
        select: { id: true },
      });
      unlockedNextTaskId = nextTask?.id ?? null;
      if (!nextTask && lessonCompleted) {
        unlockedNextLessonId = await findNextLessonId(tx, task.lesson.moduleId, task.lesson.order);
      }
    } else {
      const profile = await tx.studentProfile.findUnique({ where: { userId } });
      newTotalXp = profile?.totalXp ?? 0;
      newLevel = profile?.level ?? 1;
      streakDays = profile?.streakDays ?? 0;
    }

    return {
      attemptNo,
      passed,
      alreadyPassed,
      assisted,
      xpAwarded,
      newTotalXp,
      newLevel,
      levelUp,
      streakDays,
      streakExtended,
      lessonProgress: { tasksPassed, tasksTotal, completed: lessonCompleted },
      unlockedNextTaskId,
      unlockedNextLessonId,
      submissionId: submission.id,
    };
  });
}

async function findNextLessonId(
  tx: Prisma.TransactionClient,
  moduleId: string,
  order: number,
): Promise<string | null> {
  const inModule = await tx.lesson.findFirst({
    where: { moduleId, order: { gt: order } },
    orderBy: { order: "asc" },
    select: { id: true },
  });
  if (inModule) return inModule.id;
  // Fall through to the first lesson of the next module in the same stage.
  const mod = await tx.module.findUnique({
    where: { id: moduleId },
    select: { stageId: true, order: true },
  });
  if (!mod) return null;
  const nextModule = await tx.module.findFirst({
    where: { stageId: mod.stageId, order: { gt: mod.order } },
    orderBy: { order: "asc" },
    select: { id: true },
  });
  if (!nextModule) return null;
  const firstLesson = await tx.lesson.findFirst({
    where: { moduleId: nextModule.id },
    orderBy: { order: "asc" },
    select: { id: true },
  });
  return firstLesson?.id ?? null;
}

/** Whether a task has ever been passed by a user (server-verified). */
export async function hasPassedTask(
  userId: string,
  taskId: string,
  client: PrismaClient = defaultPrisma,
): Promise<boolean> {
  const row = await client.taskAttempt.findFirst({
    where: { userId, taskId, passed: true },
    select: { id: true },
  });
  return row !== null;
}
