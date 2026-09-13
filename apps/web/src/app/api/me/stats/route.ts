import type { NextRequest } from "next/server";
import { getUserStats } from "@khiye/db";
import { getSessionUserId } from "@/lib/session";
import { buildResolvedStats } from "@/lib/serverStats";
import { ok, route } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The signed-in learner's own stats, resolved to display shape. Signed-out (or a
 * DB read hiccup) returns `stats: null` so the page falls back to the browser's
 * localStorage progress — the student always sees their numbers either way.
 */
export function GET(_req: NextRequest) {
  return route(async () => {
    const userId = await getSessionUserId();
    if (!userId) return ok({ signedIn: false, stats: null });
    try {
      const db = await getUserStats(userId);
      return ok({ signedIn: true, stats: buildResolvedStats(db) });
    } catch (e) {
      console.error("[me/stats] read failed", e);
      return ok({ signedIn: true, stats: null });
    }
  });
}
