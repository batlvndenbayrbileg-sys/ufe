import type { NextRequest } from "next/server";
import { errors } from "@khiye/shared";
import { gradeQuiz } from "@/lib/content";
import { ok, route } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Grade a quiz submission. The answer key lives only on the server (it is
 * stripped from the public lesson), so the client sends chosen indices and gets
 * back which were right, the correct index, and each explanation.
 */
export function POST(req: NextRequest, { params }: { params: Promise<{ lessonId: string }> }) {
  return route(async () => {
    const { lessonId } = await params;
    const body = (await req.json().catch(() => ({}))) as { answers?: unknown };
    const answers = Array.isArray(body.answers) ? body.answers.map((n) => Number(n)) : [];
    const graded = gradeQuiz(lessonId, answers);
    if (!graded) throw errors.notFound("Lesson", "Хичээл олдсонгүй.");
    return ok(graded);
  });
}
