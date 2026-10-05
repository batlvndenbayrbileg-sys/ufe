import type { NextRequest } from "next/server";
import { requireStaff } from "@/lib/session";
import { buildRoster } from "@/lib/roster";
import { ok, route } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The teacher's roster: every learner with the stages they've finished AND the
 * lesson they are sitting on right now, so "where is each student and what are
 * they doing" is answerable at a glance instead of by opening them one by one.
 * Staff only — this is the one place emails are included.
 */
export function GET(_req: NextRequest) {
  return route(async () => {
    await requireStaff();
    try {
      const students = await buildRoster({ limit: 500 });
      return ok({ students });
    } catch (e) {
      console.error("[admin/roster] read failed", e);
      return ok({ students: [], unavailable: true });
    }
  });
}
