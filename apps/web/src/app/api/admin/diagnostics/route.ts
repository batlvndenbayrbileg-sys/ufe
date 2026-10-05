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
 * It answers the two questions you can't answer from outside the DB:
 *  1. Is the course content actually in the DB? `awardTaskCompletion` opens with
 *     `task.findUniqueOrThrow`, so if `tasks` is 0 every submission throws and
 *     the submit route swallows it — progress silently never persists.
 *  2. Is anything being written? attempt/submission counts and the latest
 *     attempt time say whether writes land, and when they stopped.
 *
 * Counts only — no names, no answers, nothing sensitive. Queries run one at a
 * time and each is caught on its own: a diagnostic that 500s tells you nothing,
 * so a failing probe reports its error and the rest still come back.
 */
async function probe(run: () => Promise<number>) {
  try {
    return { value: await run(), error: null as string | null };
  } catch (e) {
    return { value: null as number | null, error: e instanceof Error ? `${e.name}: ${e.message}` : String(e) };
  }
}

export function GET(_req: NextRequest) {
  return route(async () => {
    await requireStaff();

    const users = await probe(() => prisma.user.count());
    const profiles = await probe(() => prisma.studentProfile.count());
    const courses = await probe(() => prisma.course.count());
    const lessons = await probe(() => prisma.lesson.count());
    const tasks = await probe(() => prisma.task.count());
    const attempts = await probe(() => prisma.taskAttempt.count());
    const passedAttempts = await probe(() =>
      prisma.taskAttempt.count({ where: { passed: true } }),
    );
    const submissions = await probe(() => prisma.submission.count());
    const lessonProgress = await probe(() => prisma.lessonProgress.count());

    let latestAttemptAt: string | null = null;
    let latestError: string | null = null;
    try {
      const row = await prisma.taskAttempt.findFirst({
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      });
      latestAttemptAt = row?.createdAt?.toISOString() ?? null;
    } catch (e) {
      latestError = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
    }

    const verdict =
      tasks.value === 0
        ? "CONTENT NOT SYNCED — every submission throws, progress is never saved."
        : attempts.value === 0
          ? "Content synced but NO attempts recorded — writes are not landing (or nobody submitted while signed in)."
          : tasks.value === null || attempts.value === null
            ? "Some probes failed — see the error fields."
            : "Content synced and attempts exist — progress IS in the DB.";

    return ok({
      content: { courses, lessons, tasks },
      people: { users, studentProfiles: profiles },
      work: { attempts, passedAttempts, submissions, lessonProgress, latestAttemptAt, latestError },
      verdict,
    });
  });
}
