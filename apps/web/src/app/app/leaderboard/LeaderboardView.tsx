"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell, Spinner, ThemeToggle } from "@khiye/ui";
import { Trophy } from "lucide-react";
import type { CourseMapData } from "../course-types";
import { BrandLockup } from "../../BrandMark";
import s from "./leaderboard.module.css";

const COURSES = ["internet-programming", "mobile-programming"];

interface ModuleItem {
  id: string;
  title: string;
  stageTitle: string;
  taskTotal: number;
}
interface Entry {
  rank: number;
  userId: string;
  name: string;
  username: string;
  tasksPassed: number;
}
interface Board {
  moduleId: string;
  title: string;
  taskTotal: number;
  entries: Entry[];
}

const MEDAL = ["🥇", "🥈", "🥉"];

export function LeaderboardView() {
  const [maps, setMaps] = useState<Record<string, CourseMapData>>({});
  const [course, setCourse] = useState(COURSES[0]!);
  const [moduleId, setModuleId] = useState<string | null>(null);
  const [board, setBoard] = useState<Board | null>(null);
  const [boardLoading, setBoardLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    Promise.all(
      COURSES.map((slug) =>
        fetch(`/api/courses/${slug}`)
          .then((r) => (r.ok ? r.json() : null))
          .then((res) => [slug, res?.data as CourseMapData | undefined] as const)
          .catch(() => [slug, undefined] as const),
      ),
    ).then((pairs) => {
      if (!alive) return;
      const next: Record<string, CourseMapData> = {};
      for (const [slug, m] of pairs) if (m) next[slug] = m;
      setMaps(next);
    });
    return () => {
      alive = false;
    };
  }, []);

  const modules: ModuleItem[] = useMemo(() => {
    const map = maps[course];
    if (!map) return [];
    return map.stages.flatMap((stage) =>
      stage.modules.map((mod) => ({
        id: mod.id,
        title: mod.title.mn,
        stageTitle: stage.title.mn,
        taskTotal: mod.lessons.reduce((n, l) => n + l.taskIds.length, 0),
      })),
    );
  }, [maps, course]);

  // Default to the first module of the selected course.
  useEffect(() => {
    if (modules.length > 0 && !modules.some((m) => m.id === moduleId)) {
      setModuleId(modules[0]!.id);
    }
  }, [modules, moduleId]);

  useEffect(() => {
    if (!moduleId) return;
    let alive = true;
    setBoardLoading(true);
    fetch(`/api/leaderboard/${moduleId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((res) => {
        if (!alive) return;
        const d = res?.data;
        setBoard(d ? { moduleId: d.moduleId, title: d.title?.mn ?? "", taskTotal: d.taskTotal, entries: d.entries } : null);
      })
      .catch(() => alive && setBoard(null))
      .finally(() => alive && setBoardLoading(false));
    return () => {
      alive = false;
    };
  }, [moduleId]);

  const header = (
    <>
      <BrandLockup />
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
        <a href="/app" className={s.back}>
          ← Хянах самбар
        </a>
        <ThemeToggle />
      </div>
    </>
  );

  // Group modules by stage for the picker.
  const groups = useMemo(() => {
    const out: Array<{ stage: string; items: ModuleItem[] }> = [];
    for (const m of modules) {
      let g = out[out.length - 1];
      if (!g || g.stage !== m.stageTitle) {
        g = { stage: m.stageTitle, items: [] };
        out.push(g);
      }
      g.items.push(m);
    }
    return out;
  }, [modules]);

  return (
    <AppShell header={header}>
      <div className={s.page}>
        <div className={s.head}>
          <h1 className={s.title}>
            <Trophy size={22} strokeWidth={2.2} /> Тэргүүлэгчид
          </h1>
          <p className={s.sub}>Модуль тус бүрээр хамгийн олон даалгавар бодсон суралцагчид.</p>
        </div>

        <div className={s.tabs}>
          {COURSES.map((slug) => (
            <button
              key={slug}
              type="button"
              className={`${s.tab} ${course === slug ? s.tabActive : ""}`}
              onClick={() => setCourse(slug)}
            >
              {maps[slug]?.title.mn ?? (slug === "mobile-programming" ? "Мобайл" : "Интернэт")}
            </button>
          ))}
        </div>

        <div className={s.layout}>
          <div className={s.moduleList}>
            {groups.map((g) => (
              <div key={g.stage} className={s.moduleGroup}>
                <div className={s.moduleGroupTitle}>{g.stage}</div>
                {g.items.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className={`${s.moduleBtn} ${moduleId === m.id ? s.moduleBtnActive : ""}`}
                    onClick={() => setModuleId(m.id)}
                  >
                    <span className={s.moduleBtnTitle}>{m.title}</span>
                    <span className={s.moduleBtnMeta}>{m.taskTotal}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>

          <div className={s.board}>
            {boardLoading ? (
              <div className={s.boardLoading}>
                <Spinner size={22} label="Ачааллаж байна" />
              </div>
            ) : !board ? (
              <p className={s.empty}>Тэргүүлэгчид одоохондоо алга.</p>
            ) : (
              <>
                <div className={s.boardHead}>
                  <span className={s.boardTitle}>{board.title}</span>
                  <span className={s.boardSub}>{board.taskTotal} даалгавар</span>
                </div>
                {board.entries.length === 0 ? (
                  <p className={s.empty}>
                    Энэ модульд одоохондоо оролцогч алга. Даалгавар бодоод эхний байранд ор!
                  </p>
                ) : (
                  <div className={s.rows}>
                    {board.entries.map((e) => (
                      <div key={e.userId} className={`${s.row} ${e.rank <= 3 ? s.rowTop : ""}`}>
                        <span className={s.rank}>{e.rank <= 3 ? MEDAL[e.rank - 1] : e.rank}</span>
                        <span className={s.avatar} aria-hidden>
                          {e.name.charAt(0)}
                        </span>
                        <span className={s.name}>{e.name}</span>
                        <span className={s.score}>
                          {e.tasksPassed}
                          <span className={s.scoreTotal}>/{board.taskTotal}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
