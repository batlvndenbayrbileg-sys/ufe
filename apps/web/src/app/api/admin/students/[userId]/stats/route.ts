import type { NextRequest } from "next/server";
import { getUserStats } from "@khiye/db";
import { requireStaff } from "@/lib/session";
import { buildResolvedStats } from "@/lib/serverStats";
import { ok, route } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** One learner's full stat breakdown for the admin drill-down. Staff only. */
export function GET(_req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  return route(async () => {
    await requireStaff();
    const { userId } = await params;
    const db = await getUserStats(userId);
    return ok({ stats: buildResolvedStats(db) });
  });
}
