import type { NextRequest } from "next/server";
import { AppError, errors } from "@khiye/shared";
import { runChecksOnFiles, runOptionsFor, type FileSet } from "@khiye/checkers/server";
import { awardTaskCompletion } from "@khiye/db";
import { getNextLessonId, getTaskFull } from "@/lib/content";
import { getSessionUserId } from "@/lib/session";
import { ok, route } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 512 * 1024;
const MAX_FILES = 200;

function guardFiles(files: unknown): FileSet {
  if (!files || typeof files !== "object") {
    throw errors.validation({ files: "required" }, "Файл илгээгээгүй байна.");
  }
  const set = files as FileSet;
  const keys = Object.keys(set);
  if (keys.length > MAX_FILES) throw new AppError("PAYLOAD_TOO_LARGE", "too many files", { mn: "Файл хэт олон байна." });
  let bytes = 0;
  for (const k of keys) bytes += Buffer.byteLength(set[k]?.content ?? "", "utf8");
  if (bytes > MAX_BYTES) throw new AppError("PAYLOAD_TOO_LARGE", "workspace too large", { mn: "Ажлын талбар хэт том байна." });
  return set;
}

export function POST(req: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
  return route(async () => {
    const { taskId } = await params;
    const found = getTaskFull(taskId);
    if (!found) throw errors.notFound("Task", "Даалгавар олдсонгүй.");
    const { task, lesson } = found;

    const body = (await req.json().catch(() => ({}))) as {
      files?: unknown;
      hintsUsed?: number;
      durationMs?: number;
      attemptNo?: number;
      assisted?: boolean;
    };
    const files = guardFiles(body.files);

    // Authoritative server-side check run (docs/blueprint/05 §5.3, 5.6 D4).
    const results = await runChecksOnFiles(
      files,
      task.checks.map((c) => ({ id: c.id, type: c.type, args: c.args })),
      runOptionsFor(lesson.execution),
    );

    const relevant = results.filter((r) => r.errorKind !== "infra");
    const infra = results.some((r) => r.errorKind === "infra");
    const passed = relevant.length > 0 && relevant.every((r) => r.passed);

    const checks = results.map((r) => {
      const def = task.checks.find((c) => c.id === r.id);
      return {
        key: r.id,
        passed: r.passed,
        actual: r.actual,
        expected: r.expected,
        onFail: !r.passed && r.errorKind !== "infra" ? def?.onFail.mn : undefined,
        errorKind: r.errorKind,
      };
    });

    // Unlock: next task in this lesson, else the next lesson.
    const nextTask = [...lesson.tasks].sort((a, b) => a.order - b.order).find((t) => t.order > task.order);
    const unlocked = passed
      ? { nextTaskId: nextTask?.id ?? null, nextLessonId: nextTask ? null : getNextLessonId(lesson.id) }
      : { nextTaskId: null, nextLessonId: null };

    // The verdict is authoritative (server-run checks) either way. A signed-in
    // student's result is persisted through the E2 transaction — XP, streak,
    // mastery and unlocks in one atomic write; a signed-out visitor keeps their
    // progress in the browser (demo mode) and the values come from the task.
    let xpAwarded = passed ? task.xp : 0;
    let attemptNo = body.attemptNo ?? 1;

    const userId = await getSessionUserId();
    if (userId) {
      try {
        const award = await awardTaskCompletion({
          userId,
          taskId: task.id,
          passed,
          hintsUsed: body.hintsUsed ?? 0,
          durationMs: body.durationMs ?? 0,
          assisted: body.assisted ?? false,
          verifiedBy: "server",
        });
        xpAwarded = award.xpAwarded;
        attemptNo = award.attemptNo;
      } catch (e) {
        // Never let a persistence hiccup swallow an authoritative verdict.
        console.error("[submit] awardTaskCompletion failed", e);
      }
    }

    // The verdict speaks for the task only. Finishing the lesson is the
    // completion card's news to break — saying it twice on the same screen
    // makes the second one worth nothing.
    const feedback = passed
      ? { headline: "🎉 Маш сайн!", body: undefined as string | undefined }
      : infra
        ? { headline: "Систем дээр алдаа гарлаа. Таны буруу биш — дахин оролдоно уу." }
        : { headline: "Одоохондоо болоогүй байна." };

    return ok({ passed, attemptNo, checks, feedback, xpAwarded, unlocked });
  });
}
