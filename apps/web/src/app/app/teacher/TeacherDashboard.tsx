"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { Users, TrendingUp, Activity, Zap, Lock } from "lucide-react";
import { AppShell, Badge, ProgressBar, Spinner, ThemeToggle } from "@khiye/ui";
import { useIsAdmin } from "@/lib/admin";
import { cohortSummary, demoCohort, sortStudents, type SortKey } from "@/lib/cohort";
import { flattenLessons } from "../course-types";
import { useCourseMap } from "../useCourseMap";
import { BrandLockup } from "../../BrandMark";
import s from "./teacher.module.css";

const SORTS: Array<{ key: SortKey; label: string }> = [
  { key: "progress", label: "Явц" },
  { key: "xp", label: "XP" },
  { key: "active", label: "Идэвх" },
  { key: "name", label: "Нэр" },
];

function lastActive(days: number): string {
  if (days <= 0) return "Өнөөдөр";
  if (days === 1) return "Өчигдөр";
  return `${days} хоногийн өмнө`;
}

export function TeacherDashboard() {
  const { map } = useCourseMap();
  const { data: session } = useSession();
  const isAdmin = useIsAdmin();
  const [sort, setSort] = useState<SortKey>("progress");
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  const role = session?.user?.role;
  const isStaff = isAdmin || role === "TEACHER";

  const totalLessons = useMemo(() => (map ? flattenLessons(map).length : 0), [map]);
  const cohort = useMemo(() => demoCohort(totalLessons || 84), [totalLessons]);
  const summary = useMemo(() => cohortSummary(cohort), [cohort]);
  const rows = useMemo(() => sortStudents(cohort.students, sort), [cohort.students, sort]);

  const header = (
    <>
      <BrandLockup />
      <div className={s.headerRight}>
        <Badge tone="neutral">Багш</Badge>
        <ThemeToggle />
      </div>
    </>
  );

  if (!ready || !map) {
    return (
      <AppShell header={header}>
        <div className={s.center}>
          <Spinner size={24} label="Ачааллаж байна" />
        </div>
      </AppShell>
    );
  }

  if (!isStaff) {
    return (
      <AppShell header={header}>
        <div className={s.center}>
          <div className={s.denied}>
            <Lock size={36} className={s.deniedIcon} />
            <h1 className={s.deniedTitle}>Зөвхөн багш нарт</h1>
            <p className={s.deniedBody}>
              Энэ самбарыг зөвхөн багш эсвэл админ эрхтэй хэрэглэгч үзэх боломжтой.
            </p>
            <a href="/app" className={s.deniedLink}>
              Хянах самбар руу буцах →
            </a>
          </div>
        </div>
      </AppShell>
    );
  }

  const stats = [
    { Icon: Users, label: "Оюутан", value: String(summary.students), tint: s.tintAccent },
    { Icon: TrendingUp, label: "Дундаж явц", value: `${summary.avgCompletion}%`, tint: s.tintAccent },
    { Icon: Activity, label: "7 хоногт идэвхтэй", value: String(summary.activeThisWeek), tint: s.tintStreak },
    { Icon: Zap, label: "Нийт XP", value: summary.totalXp.toLocaleString(), tint: s.tintXp },
  ];

  return (
    <AppShell header={header}>
      <div className={s.page}>
        <div>
          <h1 className={s.title}>{cohort.name}</h1>
          <p className={s.sub}>
            Элсэх код: <code className={s.code}>{cohort.joinCode}</code>
          </p>
        </div>

        <div className={s.stats}>
          {stats.map((st) => (
            <div key={st.label} className={s.stat}>
              <span className={`${s.statIcon} ${st.tint}`}>
                <st.Icon size={20} strokeWidth={2.2} />
              </span>
              <div>
                <div className={s.statValue}>{st.value}</div>
                <div className={s.statLabel}>{st.label}</div>
              </div>
            </div>
          ))}
        </div>

        <div className={s.rosterHead}>
          <span className={s.rosterTitle}>Оюутнууд</span>
          <div className={s.sortRow}>
            <span className={s.sortLabel}>Эрэмбэлэх:</span>
            {SORTS.map((o) => (
              <button
                key={o.key}
                type="button"
                className={`${s.sortBtn} ${sort === o.key ? s.sortActive : ""}`}
                onClick={() => setSort(o.key)}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr>
                <th className={s.thName}>Оюутан</th>
                <th className={s.thProgress}>Явц</th>
                <th className={s.thNum}>Түвшин</th>
                <th className={s.thNum}>XP</th>
                <th className={s.thNum}>Дараалал</th>
                <th className={s.thActive}>Сүүлд идэвхтэй</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((st) => {
                const pct = totalLessons ? Math.round((st.lessonsDone / totalLessons) * 100) : 0;
                const stale = st.lastActiveDays > 7;
                return (
                  <tr key={st.id}>
                    <td className={s.cellName}>
                      <span className={s.avatar} aria-hidden>
                        {st.name.charAt(0)}
                      </span>
                      {st.name}
                    </td>
                    <td className={s.cellProgress}>
                      <ProgressBar value={pct} tone={pct === 100 ? "success" : "accent"} />
                      <span className={s.progressText}>
                        {st.lessonsDone}/{totalLessons}
                      </span>
                    </td>
                    <td className={s.num}>{st.level}</td>
                    <td className={s.num}>{st.xp.toLocaleString()}</td>
                    <td className={s.num}>{st.streakDays}</td>
                    <td className={`${s.active} ${stale ? s.activeStale : ""}`}>{lastActive(st.lastActiveDays)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
