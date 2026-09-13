import type { NextRequest } from "next/server";
import { listStudents } from "@khiye/db";
import { requireStaff } from "@/lib/session";
import { ok, route } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Roster of learners with headline numbers. Staff (ADMIN/TEACHER) only. */
export function GET(_req: NextRequest) {
  return route(async () => {
    await requireStaff();
    const students = await listStudents({ limit: 500 });
    return ok({ students });
  });
}
