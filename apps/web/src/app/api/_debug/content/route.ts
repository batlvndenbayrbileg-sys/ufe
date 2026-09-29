import type { NextRequest } from "next/server";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { getCourseMap } from "@/lib/content";

export const runtime = "nodejs";

// TEMPORARY diagnostic for the prod content 500. Reports cwd, which content
// paths exist in the serverless bundle, a dir listing, and the real error.
export function GET(_req: NextRequest) {
  const cwd = process.cwd();
  const base = join(cwd, "content/courses/mobile-programming");
  const probes = [
    "content/courses/mobile-programming/course.json",
    "content/courses/mobile-programming/modules/rn24-sql.json",
    "content/courses/mobile-programming/lessons/rn27-l1.json",
    "content/courses/internet-programming/course.json",
  ];
  const files = probes.map((p) => ({ p, exists: existsSync(join(cwd, p)) }));
  let modulesDir: string[] | string;
  let lessonsCount: number | string;
  try {
    modulesDir = readdirSync(join(base, "modules")).slice(0, 40);
  } catch (e) {
    modulesDir = `ERR ${e instanceof Error ? e.message : String(e)}`;
  }
  try {
    lessonsCount = readdirSync(join(base, "lessons")).length;
  } catch (e) {
    lessonsCount = `ERR ${e instanceof Error ? e.message : String(e)}`;
  }

  let load: Record<string, unknown> = { ok: false };
  try {
    const map = getCourseMap("mobile-programming") as { stages?: unknown[] };
    load = { ok: true, stages: map.stages?.length };
  } catch (e) {
    load = {
      ok: false,
      error: e instanceof Error ? `${e.name}: ${e.message}` : String(e),
      stack: e instanceof Error ? e.stack?.split("\n").slice(0, 8).join(" | ") : undefined,
    };
  }
  return NextResponse.json({ cwd, files, modulesDir, lessonsCount, load });
}
