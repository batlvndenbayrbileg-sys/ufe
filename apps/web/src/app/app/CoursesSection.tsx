"use client";

import { useEffect, useState } from "react";
import { ProgressBar } from "@khiye/ui";
import { Smartphone, Globe, ArrowRight, Award } from "lucide-react";
import { loadProgress, lessonProgress } from "@/lib/progress";
import { flattenLessons, type CourseMapData } from "./course-types";
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
const ACCENT: Record<string, string | undefined> = {
  "internet-programming": s.accentWeb,
  "mobile-programming": s.accentMobile,
};

/**
 * Every course as an EQUAL card — same layout, icon tile, progress and actions —
 * so the web and React Native tracks read as two tracks of one product, not a
 * featured course plus an afterthought. Progress comes from the shared store by
 * task membership, so an untouched course honestly shows 0%.
 */
export function CoursesSection() {
  const [courses, setCourses] = useState<CatalogueCourse[] | null>(null);
  const [maps, setMaps] = useState<Record<string, CourseMapData>>({});

  useEffect(() => {
    let alive = true;
    fetch("/api/courses")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((res) => {
        if (alive) setCourses((res.data?.courses ?? []) as CatalogueCourse[]);
      })
      .catch(() => setCourses([]));
    return () => {
      alive = false;
    };
  }, []);

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
    <div>
      <div className={s.panelHead}>
        <span className={s.panelTitle}>Миний курсууд</span>
      </div>
      <div className={s.courseGrid}>
        {courses.map((c) => {
          const map = maps[c.id];
          const lessons = map ? flattenLessons(map) : [];
          const total = lessons.length || c.lessonCount;
          const done = lessons.filter((l) => lessonProgress(l.taskIds, progress).done).length;
          const pct = total ? Math.round((done / total) * 100) : 0;
          const finished = total > 0 && done === total;
          const started = done > 0;
          const Icon = ICON[c.slug] ?? Globe;
          return (
            <div key={c.id} className={s.courseCard}>
              <div className={s.courseCardHead}>
                <span className={`${s.courseCardIcon} ${ACCENT[c.slug] ?? ""}`} aria-hidden>
                  <Icon size={22} strokeWidth={2.2} />
                </span>
                <div className={s.courseCardTitleWrap}>
                  <span className={s.courseCardTitle}>{c.title.mn}</span>
                  <span className={s.courseCardMeta}>
                    {map ? `${done}/${total} хичээл · ${pct}%` : `${c.lessonCount} хичээл`}
                  </span>
                </div>
              </div>

              <ProgressBar className={s.courseCardBar} value={pct} tone={finished ? "success" : "accent"} />

              <div className={s.courseCardActions}>
                <a href={`/app/course/${c.slug}`} className={s.courseCardPrimary}>
                  {finished ? "Дахин үзэх" : started ? "Үргэлжлүүлэх" : "Эхлэх"}
                  <ArrowRight size={15} strokeWidth={2.4} />
                </a>
                {finished ? (
                  <a href={`/app/certificate/${c.slug}`} className={s.courseCardCert}>
                    <Award size={14} strokeWidth={2.2} /> Гэрчилгээ
                  </a>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
