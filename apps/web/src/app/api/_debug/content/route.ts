import type { NextRequest } from "next/server";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { getCourseMap } from "@/lib/content";

export const runtime = "nodejs";

// TEMPORARY diagnostic: is the 500 from content files missing in the Vercel
// serverless trace? Reports cwd, which content paths exist, and the real error.
// Remove after diagnosis.
export function GET(_req: NextRequest) {
  const cwd = process.cwd();
  const probes = [
    "content/courses/mobile-programming/course.json",
    "content/courses/mobile-programming/modules/rn24-sql.json",
    "content/courses/mobile-programming/lessons/rn24-l1.json",
    "content/courses/mobile-programming/lessons/rn27-l1.json",
    "content/courses/internet-programming/course.json",
    "../../content/courses/mobile-programming/course.json",
  ];
  const files = probes.map((p) => ({ p, exists: existsSync(join(cwd, p)) }));

  let load: { ok: boolean; error?: string; stack?: string; stages?: number } = { ok: false };
  try {
    const map = getCourseMap("mobile-programming") as { stages?: unknown[] };
    load = { ok: true, stages: map.stages?.length };
  } catch (e) {
    load = {
      ok: false,
      error: e instanceof Error ? `${e.name}: ${e.message}` : String(e),
      stack: e instanceof Error ? e.stack?.split("\n").slice(0, 6).join(" | ") : undefined,
    };
  }
  return NextResponse.json({ cwd, files, load });
}
