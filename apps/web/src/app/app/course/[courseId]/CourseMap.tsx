"use client";

import { useEffect, useMemo, useState } from "react";
import { Alert, AppShell, Badge, Button, ProgressBar, ThemeToggle } from "@khiye/ui";
import { loadProgress, lessonProgress, type Progress } from "@/lib/progress";
import { flattenLessons } from "../../course-types";
import { useCourseMap } from "../../useCourseMap";
import styles from "./courseMap.module.css";

type State = "done" | "current" | "locked";

export function CourseMap() {
  const { map, error, reload } = useCourseMap();
  const [progress, setProgress] = useState<Progress | null>(null);
  const [openStages, setOpenStages] = useState<Set<string> | null>(null);

  useEffect(() => {
    setProgress(loadProgress());
  }, []);

  // Lesson states: done from progress; the first not-done lesson is "current"; rest locked.
  const states = useMemo(() => {
    const m = new Map<string, State>();
    if (!map || !progress) return m;
    let currentAssigned = false;
    for (const l of flattenLessons(map)) {
      if (lessonProgress(l.taskIds, progress).done) m.set(l.id, "done");
      else if (!currentAssigned) {
        m.set(l.id, "current");
        currentAssigned = true;
      } else m.set(l.id, "locked");
    }
    return m;
  }, [map, progress]);

  /** Lessons done / total, per stage and overall. */
  const counts = useMemo(() => {
    const byStage = new Map<string, { done: number; total: number }>();
    let done = 0;
    let total = 0;
    if (map) {
      for (const stage of map.stages) {
        let sDone = 0;
        let sTotal = 0;
        for (const mod of stage.modules) {
          for (const l of mod.lessons) {
            sTotal += 1;
            if (states.get(l.id) === "done") sDone += 1;
          }
        }
        byStage.set(stage.id, { done: sDone, total: sTotal });
        done += sDone;
        total += sTotal;
      }
    }
    return { byStage, done, total };
  }, [map, states]);

  const currentStageId = useMemo(() => {
    if (!map) return null;
    for (const stage of map.stages) {
      for (const mod of stage.modules) {
        for (const l of mod.lessons) if (states.get(l.id) === "current") return stage.id;
      }
    }
    return null;
  }, [map, states]);

  // Open the stage you are in; the rest stay folded until you ask for them.
  useEffect(() => {
    if (openStages === null && currentStageId) setOpenStages(new Set([currentStageId]));
  }, [currentStageId, openStages]);

  if (error) {
    return (
      <AppShell header={<strong>Хичээлүүд</strong>}>
        <Alert tone="danger" title="Хичээлүүд ачаалагдсангүй">
          <p style={{ margin: "0 0 12px" }}>{error}</p>
          <Button onClick={reload}>Дахин оролдох</Button>
        </Alert>
      </AppShell>
    );
  }

  if (!map || !progress) {
    return (
      <AppShell header={<strong>Хичээлүүд</strong>}>
        <div style={{ color: "var(--text-muted)" }}>Ачааллаж байна…</div>
      </AppShell>
    );
  }

  const isOpen = (id: string) => openStages?.has(id) ?? id === currentStageId;

  const toggle = (id: string) =>
    setOpenStages((prev) => {
      const next = new Set(prev ?? (currentStageId ? [currentStageId] : []));
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <AppShell
      header={
        <>
          <a href="/app" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: 13 }}>
            ← Хянах самбар
          </a>
          <strong style={{ fontSize: 16 }}>{map.title.mn}</strong>
          <div style={{ marginLeft: "auto" }}>
            <ThemeToggle />
          </div>
        </>
      }
    >
      <div className={styles.page}>
        <div>
          <div className={styles.summary}>
            <span className={styles.summaryCount}>
              {counts.done}/{counts.total}
            </span>
            <span className={styles.summaryLabel}>хичээл дууссан</span>
            <span className={styles.summaryRight}>
              {map.stages.length} шат · {map.stages.reduce((n, s) => n + s.modules.length, 0)} модуль
            </span>
          </div>
          <ProgressBar
            value={counts.total === 0 ? 0 : Math.round((counts.done / counts.total) * 100)}
            label="Курсын явц"
          />
        </div>

        {map.stages.map((stage) => {
          const count = counts.byStage.get(stage.id) ?? { done: 0, total: 0 };
          const complete = count.total > 0 && count.done === count.total;
          const open = isOpen(stage.id);

          return (
            <section
              key={stage.id}
              className={`${styles.stage} ${stage.id === currentStageId ? styles.stageCurrent : ""}`}
            >
              <button
                type="button"
                className={styles.stageHeader}
                aria-expanded={open}
                aria-controls={`stage-${stage.id}`}
                onClick={() => toggle(stage.id)}
              >
                <span aria-hidden className={`${styles.chevron} ${open ? styles.chevronOpen : ""}`}>
                  ▸
                </span>
                <span className={styles.stageOrder}>ШАТ {stage.order}</span>
                <span className={styles.stageTitle}>{stage.title.mn}</span>
                {complete ? (
                  <span aria-label="дууссан" className={styles.stageDone}>
                    ✓
                  </span>
                ) : null}
                {stage.id === currentStageId ? <Badge tone="accent">Одоо</Badge> : null}
                <span className={styles.stageCount}>
                  {count.done}/{count.total}
                </span>
              </button>

              <div id={`stage-${stage.id}`} className={styles.stageBody} hidden={!open}>
                {stage.modules.map((mod) => (
                  <div key={mod.id}>
                    <h3 className={styles.moduleTitle}>{mod.title.mn}</h3>
                    <div className={styles.lessons}>
                      {mod.lessons.map((l) => {
                        const state = states.get(l.id) ?? "locked";
                        const prog = lessonProgress(l.taskIds, progress);
                        const className = `${styles.lesson} ${
                          state === "current" ? styles.lessonCurrent : state === "locked" ? styles.lessonLocked : ""
                        }`;

                        const inner = (
                          <>
                            <span aria-hidden className={styles.mark}>
                              {state === "done" ? "✅" : state === "current" ? "▸" : "🔒"}
                            </span>
                            <span className={styles.srOnly}>
                              {state === "done" ? "Дууссан. " : state === "current" ? "Одоогийн хичээл. " : "Түгжээтэй. "}
                            </span>
                            <span className={styles.lessonTitle}>{l.title.mn}</span>
                            <span className={styles.lessonCount}>
                              {prog.passed}/{prog.total}
                            </span>
                          </>
                        );

                        return state === "locked" ? (
                          <div key={l.id} className={className} aria-disabled title="Өмнөх хичээлээ дуусгаарай">
                            {inner}
                          </div>
                        ) : (
                          <a key={l.id} href={`/learn/${l.id}`} className={className}>
                            {inner}
                          </a>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </AppShell>
  );
}
