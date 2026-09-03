"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell, Badge, ThemeToggle } from "@khiye/ui";
import { loadProgress, lessonProgress, type Progress } from "@/lib/progress";
import { flattenLessons, type CourseMapData } from "../../course-types";

type State = "done" | "current" | "locked";

export function CourseMap() {
  const [map, setMap] = useState<CourseMapData | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);

  useEffect(() => {
    setProgress(loadProgress());
    fetch("/api/courses/internet-programming")
      .then((r) => r.json())
      .then((res) => setMap(res.data as CourseMapData))
      .catch(() => {});
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

  if (!map || !progress) {
    return <AppShell header={<strong>Хичээлүүд</strong>}><div style={{ color: "var(--text-muted)" }}>Ачааллаж байна…</div></AppShell>;
  }

  return (
    <AppShell
      header={
        <>
          <a href="/app" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: 13 }}>← Хянах самбар</a>
          <strong style={{ fontSize: 16 }}>{map.title.mn}</strong>
          <div style={{ marginLeft: "auto" }}><ThemeToggle /></div>
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 28, maxWidth: 720 }}>
        {map.stages.map((stage) => (
          <section key={stage.id}>
            <h2 style={{ fontSize: 15, margin: "0 0 12px", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 11, color: "var(--text-subtle)", letterSpacing: "0.1em" }}>STAGE {stage.order}</span>
              {stage.title.mn}
            </h2>
            {stage.modules.map((mod) => (
              <div key={mod.id} style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)", marginBottom: 6 }}>{mod.title.mn}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {mod.lessons.map((l) => {
                    const state = states.get(l.id) ?? "locked";
                    const prog = lessonProgress(l.taskIds, progress);
                    const clickable = state !== "locked";
                    const inner = (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          padding: "10px 14px",
                          borderRadius: 8,
                          border: "1px solid var(--border)",
                          background: state === "current" ? "var(--accent-subtle)" : "var(--surface)",
                          opacity: state === "locked" ? 0.55 : 1,
                          cursor: clickable ? "pointer" : "not-allowed",
                        }}
                      >
                        <span aria-hidden style={{ fontSize: 16 }}>
                          {state === "done" ? "✅" : state === "current" ? "▸" : "🔒"}
                        </span>
                        <span style={{ flex: 1, fontWeight: state === "current" ? 600 : 400 }}>{l.title.mn}</span>
                        <span style={{ fontSize: 12, color: "var(--text-subtle)" }}>
                          {prog.passed}/{prog.total}
                        </span>
                        {state === "current" ? <Badge tone="accent">Одоо</Badge> : null}
                      </div>
                    );
                    return clickable ? (
                      <a key={l.id} href={`/learn/${l.id}`} style={{ textDecoration: "none", color: "inherit" }}>{inner}</a>
                    ) : (
                      <div key={l.id} aria-disabled title="Өмнөх хичээлээ дуусгаарай">{inner}</div>
                    );
                  })}
                </div>
              </div>
            ))}
          </section>
        ))}
      </div>
    </AppShell>
  );
}
