import type { NextRequest } from "next/server";
import { getCourseMap } from "@/lib/content";
import { ok, route } from "@/lib/api";

export const runtime = "nodejs";

export function GET(_req: NextRequest, ctx: { params: Promise<{ courseId: string }> }) {
  return route(async () => {
    const { courseId } = await ctx.params;
    return ok(getCourseMap(courseId));
  });
}
