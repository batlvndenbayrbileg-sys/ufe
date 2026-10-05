import type { NextRequest } from "next/server";
import { getUserStats } from "@khiye/db";
import { isoDateIn } from "@khiye/shared";
import { getSessionUserId } from "@/lib/session";
import { getBadgeStages, getTaskFull } from "@/lib/content";
import { ok, route } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The signed-in learner's progress, rebuilt from the DB in the SHAPE the client
 * store uses (lib/progress.ts).
 *
 * The browser store is localStorage, which is per-device: signing in on a second
 * device showed an empty course even though every pass was safely recorded in
 * the DB. The client merges this on load so progress follows the ACCOUNT, not
 * the browser. Signed-out returns `progress: null` and the client keeps its own
 * local blob.
 */
export function GET(_req: NextRequest) {
  return route(async () => {
    const userId = await getSessionUserId();
    if (!userId) return ok({ signedIn: false, progress: null });

    try {
      const stats = await getUserStats(userId);

      // Per-task xp/skills aren't in the attempt rows — resolve them from content.
      const passedTasks: Record<
        string,
        {
          xp: number;
          skills: string[];
          assisted: boolean;
          at: number;
          durationMs?: number;
          hintsUsed?: number;
          attempts?: number;
        }
      > = {};
      for (const t of stats.tasks) {
        if (!t.passed) continue;
        const full = getTaskFull(t.taskId);
        passedTasks[t.taskId] = {
          xp: full?.task.xp ?? 0,
          skills: full?.task.skills ?? [],
          assisted: t.assisted,
          at: t.at ?? Date.now(),
          durationMs: t.durationMs,
          hintsUsed: t.hintsUsed,
          attempts: t.attempts,
        };
      }

      const skillXp: Record<string, number> = {};
      for (const s of stats.skills) skillXp[s.skillId] = s.xp;

      // A stage's badge is earned once every lesson in that stage is complete.
      const doneLessons = new Set(stats.completedLessons.map((l) => l.lessonId));
      const badges = getBadgeStages()
        .filter((b) => b.lessonIds.length > 0 && b.lessonIds.every((id) => doneLessons.has(id)))
        .map((b) => b.badgeId);

      return ok({
        signedIn: true,
        progress: {
          passedTasks,
          xp: stats.profile.totalXp,
          skillXp,
          streakDays: stats.profile.streakDays,
          lastActiveDate: stats.profile.lastStreakDate
            ? isoDateIn(new Date(stats.profile.lastStreakDate))
            : null,
          badges,
          updatedAt: Date.now(),
        },
      });
    } catch (e) {
      console.error("[me/progress] read failed", e);
      return ok({ signedIn: true, progress: null });
    }
  });
}
