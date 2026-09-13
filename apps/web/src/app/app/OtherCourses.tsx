"use client";

import { useEffect, useState } from "react";
import { Card, ProgressBar } from "@khiye/ui";
import { Smartphone, Globe, ArrowRight } from "lucide-react";
import { loadProgress } from "@/lib/progress";
import { flattenLessons, type CourseMapData } from "./course-types";
import { lessonProgress } from "@/lib/progress";
import s from "./dashboard.module.css";

interface CatalogueCourse {
  id: string;
  slug: string;
  title: { mn: string; en?: string };
  description?: { mn: string; en?: string };
  lessonCount: number;
  stageCount: number;
}

const ICON: Record<string, typeof Globe> = {
  "mobile-programming": Smartphone,
  "internet-programming": Globe,
};

/**
 * Lists every course EXCEPT the one the dashboard already features, so a student
 * can jump into the React Native track. Progress is read from the shared store
 * by task membership, so a course at 0% reads honestly as "not started".
 */
export function OtherCourses({ excludeId }: { excludeId?: string }) {
  const [courses, setCourses] = useState<CatalogueCourse[] | null>(null);
  const [maps, setMaps] = useState<Record<string, CourseMapData>>({});

  useEffect(() => {
    let alive = true;
    fetch("/api/courses")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((res) => {
        if (!alive) return;
        const list = (res.data?.courses ?? []) as CatalogueCourse[];
        setCourses(list.filter((c) => c.id !== excludeId));
      })
      .catch(() => setCourses([]));
    return () => {
      alive = false;
    };
  }, [excludeId]);

  useEffect(() => {
    if (!courses) return;
    let alive = true;
    for (const c of courses) {
      fetch(`/api/courses/${c.slug}`)
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
        .then((res) => {
          if (alive && res.data) setMaps((m) => ({ ...m, [c.id]: res.data as CourseMapData }));
        })
        .catch(() => {});
    }
    return () => {
      alive = false;
    };
  }, [courses]);

  if (!courses || courses.length === 0) return null;

  const progress = loadProgress();

  return (
    <Card>
      <div className={s.panelHead}>
        <span className={s.panelTitle}>Өөр курс үзэх</span>
      </div>
      <div className={s.otherCourses}>
        {courses.map((c) => {
          const map = maps[c.id];
          const lessons = map ? flattenLessons(map) : [];
          const done = lessons.filter((l) => lessonProgress(l.taskIds, progress).done).length;
          const pct = lessons.length ? Math.round((done / lessons.length) * 100) : 0;
          const Icon = ICON[c.slug] ?? Globe;
          return (
            <a key={c.id} href={`/app/course/${c.slug}`} className={s.otherCourse}>
              <span className={s.otherCourseIcon} aria-hidden>
                <Icon size={20} strokeWidth={2.2} />
              </span>
              <span className={s.otherCourseBody}>
                <span className={s.otherCourseTitle}>{c.title.mn}</span>
                <span className={s.otherCourseMeta}>
                  {map ? `${done}/${lessons.length} хичээл · ${pct}%` : `${c.lessonCount} хичээл`}
                </span>
                {map ? <ProgressBar className={s.otherCourseBar} value={pct} /> : null}
              </span>
              <ArrowRight size={17} strokeWidth={2.4} className={s.otherCourseArrow} />
            </a>
          );
        })}
      </div>
    </Card>
  );
}
