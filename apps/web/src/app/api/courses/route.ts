import type { NextRequest } from "next/server";
import { getCourseList } from "@/lib/content";
import { ok, route } from "@/lib/api";

export const runtime = "nodejs";

/** Catalogue of published courses, for the dashboard course picker. */
export function GET(_req: NextRequest) {
  return route(async () => ok({ courses: getCourseList() }));
}
