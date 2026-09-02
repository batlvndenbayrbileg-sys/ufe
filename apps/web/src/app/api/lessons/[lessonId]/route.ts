import type { NextRequest } from "next/server";
import { errors } from "@khiye/shared";
import { getLessonPublic } from "@/lib/content";
import { ok, route } from "@/lib/api";

export const runtime = "nodejs";

export function GET(_req: NextRequest, { params }: { params: Promise<{ lessonId: string }> }) {
  return route(async () => {
    const { lessonId } = await params;
    const lesson = getLessonPublic(lessonId);
    if (!lesson) throw errors.notFound("Lesson", "Хичээл олдсонгүй.");
    return ok(lesson);
  });
}
