import type { NextRequest } from "next/server";
import { buildRoster } from "@/lib/roster";
import { ok, route } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Stage leaderboard: who has finished which stage.
 *
 * The per-module board answers "who passed the most tasks in this module",
 * which never showed the thing a class actually cares about — how far down the
 * road each learner is. Entries carry a flag per stage so the UI can draw the
 * whole track, not just a number. Names only, as the module board already does;
 * emails never leave the staff endpoint.
 */
export function GET(_req: NextRequest) {
  return route(async () => {
    const roster = await buildRoster({ limit: 500 });

    const entries = roster
      .filter((r) => r.role === "STUDENT")
      .map((r) => ({
        userId: r.id,
        name: r.name,
        username: r.username,
        totalXp: r.totalXp,
        level: r.level,
        streakDays: r.streakDays,
        stagesDone: r.courses.reduce((n, c) => n + c.stagesDone, 0),
        lessonsCompleted: r.lessonsCompleted,
        courses: r.courses,
      }))
      .sort(
        (a, b) =>
          b.stagesDone - a.stagesDone ||
          b.lessonsCompleted - a.lessonsCompleted ||
          b.totalXp - a.totalXp ||
          a.name.localeCompare(b.name),
      )
      .map((e, i) => ({ rank: i + 1, ...e }));

    return ok({ entries });
  });
}
