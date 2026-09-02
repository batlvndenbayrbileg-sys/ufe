import type { NextRequest } from "next/server";
import { errors } from "@khiye/shared";
import { getTaskFull } from "@/lib/content";
import { ok, route } from "@/lib/api";

export const runtime = "nodejs";

export function POST(req: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
  return route(async () => {
    const { taskId } = await params;
    const found = getTaskFull(taskId);
    if (!found) throw errors.notFound("Task", "Даалгавар олдсонгүй.");

    const { level } = (await req.json().catch(() => ({}))) as { level?: number };
    const hint = found.task.hints.find((h) => h.level === level);
    if (!hint) throw errors.notFound("Hint", "Заавар олдсонгүй.");

    return ok({ level: hint.level, text: hint.text, code: hint.code, xpCost: hint.xpCost });
  });
}
