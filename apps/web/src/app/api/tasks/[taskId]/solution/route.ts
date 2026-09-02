import type { NextRequest } from "next/server";
import { AppError, errors } from "@khiye/shared";
import { getTaskFull } from "@/lib/content";
import { ok, route } from "@/lib/api";

export const runtime = "nodejs";

const MIN_ATTEMPTS = 2;
const MIN_HINTS = 3;
const MIN_MINUTES = 5;

export function POST(req: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
  return route(async () => {
    const { taskId } = await params;
    const found = getTaskFull(taskId);
    if (!found) throw errors.notFound("Task", "Даалгавар олдсонгүй.");

    const { attempts = 0, hintsUsed = 0, minutes = 0 } = (await req.json().catch(() => ({}))) as {
      attempts?: number;
      hintsUsed?: number;
      minutes?: number;
    };

    // Gate: ≥2 failed attempts AND all 3 hints AND ≥5 minutes (docs/blueprint/10 §10.5).
    if (attempts < MIN_ATTEMPTS || hintsUsed < MIN_HINTS || minutes < MIN_MINUTES) {
      throw new AppError("SOLUTION_LOCKED", "solution locked", {
        details: {
          attemptsRequired: MIN_ATTEMPTS,
          attemptsMade: attempts,
          hintsRequired: MIN_HINTS,
          hintsViewed: hintsUsed,
          minMinutes: MIN_MINUTES,
          minutesOnTask: minutes,
        },
      });
    }

    return ok({ patch: found.task.solution.patch, explanation: found.task.solution.explanation });
  });
}
