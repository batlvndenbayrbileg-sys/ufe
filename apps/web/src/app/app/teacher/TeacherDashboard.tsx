"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { Users, TrendingUp, Clock, Zap, Lock, X } from "lucide-react";
import { AppShell, Badge, Spinner, ThemeToggle } from "@khiye/ui";
import { useIsAdmin } from "@/lib/admin";
import { demoCohort } from "@/lib/cohort";
import { fmtDuration, fmtWhen, type ResolvedStats } from "@/lib/stats";
import { flattenLessons } from "../course-types";
import { useCourseMap } from "../useCourseMap";
import { BrandLockup } from "../../BrandMark";
import { StatPanels } from "../stats/StatPanels";
import s from "./teacher.module.css";

interface Row {
  id: string;
  name: string;
  username: string;
  email: string;
  role: string;
  totalXp: number;
  level: number;
  streakDays: number;
  tasksPassed: number;
  lessonsCompleted: number;
  totalDurationMs: number;
  lastActiveAt: number | null;
  demo?: boolean;
}

type SortKey = "xp" | "tasks" | "time" | "active" | "name";
const SORTS: Array<{ key: SortKey; label: string }> = [
  { key: "xp", label: "XP" },
  { key: "tasks", label: "Даалгавар" },
  { key: "time", label: "Хугацаа" },
  { key: "active", label: "Идэвх" },
  { key: "name", label: "Нэр" },
];

function sortRows(rows: Row[], key: SortKey): Row[] {
  const by = [...rows];
  switch (key) {
    case "name":
      return by.sort((a, b) => a.name.localeCompare(b.name, "mn"));
    case "xp":
      return by.sort((a, b) => b.totalXp - a.totalXp);
    case "tasks":
      return by.sort((a, b) => b.tasksPassed - a.tasksPassed);
    case "time":
      return by.sort((a, b) => b.totalDurationMs - a.totalDurationMs);
    case "active":
      return by.sort((a, b) => (b.lastActiveAt ?? 0) - (a.lastActiveAt ?? 0));
  }
}

export function TeacherDashboard() {
  const { map } = useCourseMap();
  const { data: session } = useSession();
  const isAdmin = useIsAdmin();
  const [sort, setSort] = useState<SortKey>("xp");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [demo, setDemo] = useState(false);
  const [selected, setSelected] = useState<Row | null>(null);

  const role = session?.user?.role;
  const isStaff = isAdmin || role === "TEACHER";
  const totalLessons = useMemo(() => (map ? flattenLessons(map).length : 0), [map]);

  useEffect(() => {
    if (!isStaff) return;
    let alive = true;
    fetch("/api/admin/students")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((res) => {
        const list = (res?.data?.students as Row[] | undefined) ?? [];
        if (!alive) return;
        if (list.length > 0) {
          setRows(list);
          setDemo(false);
        } else {
          // No real learners yet — show a labelled sample so the screen isn't empty.
          setRows(demoRows(totalLessons || 84));
          setDemo(true);
        }
      })
      .catch(() => {
        if (!alive) return;
        setRows(demoRows(totalLessons || 84));
        setDemo(true);
      });
    return () => {
      alive = false;
    };
  }, [isStaff, totalLessons]);

  const sorted = useMemo(() => (rows ? sortRows(rows, sort) : []), [rows, sort]);
  const summary = useMemo(() => {
    const list = rows ?? [];
    const n = list.length;
    return {
      students: n,
      tasks: list.reduce((a, r) => a + r.tasksPassed, 0),
      time: list.reduce((a, r) => a + r.totalDurationMs, 0),
      xp: list.reduce((a, r) => a + r.totalXp, 0),
    };
  }, [rows]);

  const header = (
    <>
      <BrandLockup />
      <div className={s.headerRight}>
        <Badge tone="neutral">{role === "ADMIN" ? "Админ" : "Багш"}</Badge>
        <ThemeToggle />
      </div>
    </>
  );

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

  if (!rows) {
    return (
      <AppShell header={header}>
        <div className={s.center}>
          <Spinner size={24} label="Ачааллаж байна" />
        </div>
      </AppShell>
    );
  }

  const stats = [
    { Icon: Users, label: "Суралцагч", value: String(summary.students), tint: s.tintAccent },
    { Icon: TrendingUp, label: "Бодсон даалгавар", value: summary.tasks.toLocaleString(), tint: s.tintAccent },
    { Icon: Clock, label: "Нийт хугацаа", value: fmtDuration(summary.time), tint: s.tintStreak },
    { Icon: Zap, label: "Нийт XP", value: summary.xp.toLocaleString(), tint: s.tintXp },
  ];

  return (
    <AppShell header={header}>
      <div className={s.page}>
        <div>
          <h1 className={s.title}>Суралцагчид</h1>
          <p className={s.sub}>
            {demo
              ? "Одоохондоо жинхэнэ суралцагч бүртгэгдээгүй тул жишээ өгөгдөл харуулж байна."
              : "Мөр дээр дарж тухайн суралцагчийн дэлгэрэнгүй статистикийг үзнэ үү."}
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
          <span className={s.rosterTitle}>Жагсаалт</span>
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
                <th>Суралцагч</th>
                <th className={s.thNum}>XP</th>
                <th className={s.thNum}>Түвшин</th>
                <th className={s.thNum}>Даалгавар</th>
                <th className={s.thNum}>Хугацаа</th>
                <th className={s.thNum}>Дараалал</th>
                <th className={s.thActive}>Сүүлд идэвхтэй</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => {
                const clickable = !demo;
                return (
                  <tr
                    key={r.id}
                    className={clickable ? s.rowClickable : undefined}
                    onClick={clickable ? () => setSelected(r) : undefined}
                  >
                    <td className={s.cellName}>
                      <span className={s.avatar} aria-hidden>
                        {r.name.charAt(0)}
                      </span>
                      <span>
                        {r.name}
                        {r.role !== "STUDENT" ? <Badge tone="neutral" size="sm" style={{ marginLeft: 6 }}>{r.role === "ADMIN" ? "Админ" : "Багш"}</Badge> : null}
                      </span>
                    </td>
                    <td className={s.num}>{r.totalXp.toLocaleString()}</td>
                    <td className={s.num}>{r.level}</td>
                    <td className={s.num}>{r.tasksPassed}</td>
                    <td className={s.num}>{fmtDuration(r.totalDurationMs)}</td>
                    <td className={s.num}>{r.streakDays}</td>
                    <td className={s.active}>{fmtWhen(r.lastActiveAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selected ? <StudentDrawer row={selected} onClose={() => setSelected(null)} /> : null}
    </AppShell>
  );
}

function StudentDrawer({ row, onClose }: { row: Row; onClose: () => void }) {
  const [stats, setStats] = useState<ResolvedStats | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setError(false);
    setStats(null);
    fetch(`/api/admin/students/${row.id}/stats`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((res) => setStats(res?.data?.stats as ResolvedStats))
      .catch(() => setError(true));
  }, [row.id]);

  useEffect(() => {
    load();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [load, onClose]);

  return (
    <div className={s.drawerOverlay} onClick={onClose}>
      <aside className={s.drawer} onClick={(e) => e.stopPropagation()} role="dialog" aria-label={`${row.name} — статистик`}>
        <header className={s.drawerHead}>
          <div>
            <div className={s.drawerName}>{row.name}</div>
            <div className={s.drawerSub}>{row.email || row.username}</div>
          </div>
          <button type="button" className={s.drawerClose} onClick={onClose} aria-label="Хаах">
            <X size={18} />
          </button>
        </header>
        <div className={s.drawerBody}>
          {error ? (
            <p className={s.drawerError}>Статистик ачаалж чадсангүй. Дахин оролдоно уу.</p>
          ) : !stats ? (
            <div className={s.drawerLoading}>
              <Spinner size={22} label="Ачааллаж байна" />
            </div>
          ) : (
            <StatPanels stats={stats} />
          )}
        </div>
      </aside>
    </div>
  );
}

/** A labelled sample roster for when no real learners exist yet. */
function demoRows(totalLessons: number): Row[] {
  return demoCohort(totalLessons).students.map((st) => ({
    id: st.id,
    name: st.name,
    username: "",
    email: "",
    role: "STUDENT",
    totalXp: st.xp,
    level: st.level,
    streakDays: st.streakDays,
    tasksPassed: st.lessonsDone,
    lessonsCompleted: st.lessonsDone,
    totalDurationMs: st.lessonsDone * 90_000,
    lastActiveAt: Date.now() - st.lastActiveDays * 86_400_000,
    demo: true,
  }));
}
