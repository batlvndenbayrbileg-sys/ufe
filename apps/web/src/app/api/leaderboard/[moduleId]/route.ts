import type { NextRequest } from "next/server";
import { errors } from "@khiye/shared";
import { moduleLeaderboard } from "@khiye/db";
import { getModuleInfo } from "@/lib/content";
import { ok, route } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Leaderboard for one module: learners ranked by tasks passed in its lessons. */
export function GET(_req: NextRequest, { params }: { params: Promise<{ moduleId: string }> }) {
  return route(async () => {
    const { moduleId } = await params;
    const info = getModuleInfo(moduleId);
    if (!info) throw errors.notFound("Module", "Модуль олдсонгүй.");
    const entries = await moduleLeaderboard(info.lessonIds, 20);
    return ok({ moduleId, title: info.title, taskTotal: info.taskTotal, entries });
  });
}
