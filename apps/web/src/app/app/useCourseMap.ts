"use client";

import { useCallback, useEffect, useState } from "react";
import type { CourseMapData } from "./course-types";

/**
 * Load the course map, with the three states remote data actually has.
 *
 * Both screens used to swallow the failure (`.catch(() => {})`), which left the
 * page on "Ачааллаж байна…" for ever with nothing to click — the exact failure
 * M9 teaches students to avoid.
 */
export function useCourseMap(slug = "internet-programming") {
  const [map, setMap] = useState<CourseMapData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    fetch(`/api/courses/${slug}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(`Сервер ${r.status} буцаалаа`);
        return r.json();
      })
      .then((res) => setMap(res.data as CourseMapData))
      .catch((problem: unknown) => {
        setError(problem instanceof Error ? problem.message : "Хичээлүүдийг ачаалж чадсангүй");
      });
  }, [slug]);

  useEffect(load, [load]);

  return { map, error, reload: load };
}
