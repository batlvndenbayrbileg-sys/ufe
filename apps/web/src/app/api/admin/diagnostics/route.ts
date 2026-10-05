import type { NextRequest } from "next/server";
import { prisma } from "@khiye/db";
import { requireStaff } from "@/lib/session";
import { ok, route } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Staff-only health check for the PERSISTENCE path, added after students
 * reported losing progress.
 *
 * It answers the two questions you can't answer from the outside:
 *  1. Is the course content actually in the DB? `awardTaskCompletion` starts
 *     with `task.findUniqueOrThrow`, so if `tasks` is 0 every submission throws
 *     and the submit route swallows it — progress silently never persists.
 *  2. Is anything being written? attempts/submissions/lessonProgress counts and
 *     the most recent attempt time say whether writes land and when they stopped.
 *
 * Counts only — no names, no answers, nothing sensitive.
 */
export function GET(_req: NextRequest) {
  return route(async () => {
    await requireStaff();

    const [
      users,
      profiles,
      courses,
      lessons,
      tasks,
      attempts,
      passedAttempts,
      submissions,
      lessonProgress,
      xpRows,
      latestAttempt,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.studentProfile.count(),
      prisma.course.count(),
      prisma.lesson.count(),
      prisma.task.count(),
      prisma.taskAttempt.count(),
      prisma.taskAttempt.count({ where: { passed: true } }),
      prisma.submission.count(),
      prisma.lessonProgress.count(),
      prisma.xpLedger.count(),
      prisma.taskAttempt.findFirst({
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
    ]);

    return ok({
      content: { courses, lessons, tasks, contentSynced: tasks > 0 },
      people: { users, studentProfiles: profiles },
      work: {
        attempts,
        passedAttempts,
        submissions,
        lessonProgress,
        xpLedgerRows: xpRows,
        latestAttemptAt: latestAttempt?.createdAt?.toISOString() ?? null,
      },
      verdict:
        tasks === 0
          ? "CONTENT NOT SYNCED — every submission throws and progress is never saved."
          : attempts === 0
            ? "Content is synced but NO attempts recorded — writes are not landing (or nobody submitted while signed in)."
            : "Content synced and attempts exist — progress is in the DB.",
    });
  });
}
