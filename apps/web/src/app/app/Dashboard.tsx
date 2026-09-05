"use client";

import { useEffect, useMemo, useState } from "react";
import { Alert, AppShell, Badge, Button, Card, ProgressBar, ProgressRing, ThemeToggle } from "@khiye/ui";
import { level, loadProgress, lessonProgress, type Progress } from "@/lib/progress";
import { flattenLessons, type MapLesson } from "./course-types";
import { useCourseMap } from "./useCourseMap";

const BADGE_LABEL: Record<string, string> = {
  "first-website": "🏆 Анхны вэб",
  "js-starter": "⚡ JavaScript эхлэл",
  "ui-builder": "🎨 UI бүтээгч",
  "responsive-master": "📱 Responsive",
  debugger: "🔧 Дебаггер",
  independent: "📚 Бие даасан",
};

export function Dashboard() {
  const { map, error, reload } = useCourseMap();
  const [progress, setProgress] = useState<Progress | null>(null);

  useEffect(() => {
    setProgress(loadProgress());
  }, []);

  const lessons = useMemo(() => (map ? flattenLessons(map) : []), [map]);

  if (error) {
    return (
      <AppShell header={<strong style={{ fontSize: 18 }}>Хийе</strong>}>
        <Alert tone="danger" title="Хичээлүүд ачаалагдсангүй">
          <p style={{ margin: "0 0 12px" }}>{error}</p>
          <Button onClick={reload}>Дахин оролдох</Button>
        </Alert>
      </AppShell>
    );
  }

  if (!map || !progress) {
    return (
      <AppShell header={<strong style={{ fontSize: 18 }}>Хийе</strong>}>
        <div style={{ color: "var(--text-muted)" }}>Ачааллаж байна…</div>
      </AppShell>
    );
  }

  const doneLessons = lessons.filter((l) => lessonProgress(l.taskIds, progress).done);
  const percent = lessons.length ? Math.round((doneLessons.length / lessons.length) * 100) : 0;
  const nextLesson: MapLesson | undefined = lessons.find((l) => !lessonProgress(l.taskIds, progress).done) ?? lessons[0];
  const nextProg = nextLesson ? lessonProgress(nextLesson.taskIds, progress) : { passed: 0, total: 0 };

  // Skill mastery at the lesson level: done lessons tagged with the skill / total.
  const skills = map.skills.map((sk) => {
    const withSkill = lessons.filter((l) => l.skills.includes(sk.id));
    const done = withSkill.filter((l) => lessonProgress(l.taskIds, progress).done).length;
    return { ...sk, percent: withSkill.length ? Math.round((done / withSkill.length) * 100) : 0 };
  });

  const lvl = level(progress.xp);

  return (
    <AppShell
      header={
        <>
          <strong style={{ fontSize: 18, letterSpacing: "-0.01em" }}>Хийе</strong>
          <div style={{ marginLeft: "auto", display: "flex", gap: 14, alignItems: "center", fontSize: 13 }}>
            <span title="Дараалал">🔥 {progress.streakDays}</span>
            <span style={{ color: "var(--xp)", fontWeight: 600 }}>{progress.xp.toLocaleString()} XP</span>
            <Badge tone="neutral">Level {lvl}</Badge>
            <ThemeToggle />
          </div>
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <p style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>Сайн уу 👋</p>

        {/* Continue card — the biggest thing on the page */}
        {nextLesson ? (
          <Card style={{ display: "flex", alignItems: "center", gap: 20, borderColor: "var(--accent)" }}>
            <ProgressRing value={nextProg.total ? Math.round((nextProg.passed / nextProg.total) * 100) : 0} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-subtle)" }}>
                {percent === 100 ? "Дуусгав" : "Үргэлжлүүлэх"}
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, margin: "4px 0" }}>{nextLesson.title.mn}</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                {nextProg.passed}/{nextProg.total} даалгавар · ~{nextLesson.estimatedMinutes} мин
              </div>
            </div>
            <a
              href={`/learn/${nextLesson.id}`}
              style={{ padding: "12px 22px", borderRadius: 8, background: "var(--accent)", color: "var(--on-accent)", textDecoration: "none", fontWeight: 600, whiteSpace: "nowrap" }}
            >
              {percent === 100 ? "Дахин үзэх →" : "Үргэлжлүүлэх →"}
            </a>
          </Card>
        ) : null}

        {/* Course progress */}
        <Card>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <strong style={{ fontSize: 15 }}>{map.title.mn}</strong>
            <span style={{ marginLeft: "auto", fontSize: 13, color: "var(--text-muted)" }}>
              {doneLessons.length}/{lessons.length} хичээл · {percent}%
            </span>
          </div>
          <div style={{ marginTop: 10 }}>
            <ProgressBar value={percent} />
          </div>
          <div style={{ marginTop: 8 }}>
            <a href={`/app/course/${map.id}`} style={{ fontSize: 13 }}>Бүх хичээл харах →</a>
          </div>
        </Card>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Skills */}
          <Card>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-subtle)", marginBottom: 12 }}>Ур чадвар</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {skills.map((s) => (
                <div key={s.id} style={{ display: "grid", gridTemplateColumns: "90px 1fr 36px", gap: 8, alignItems: "center", fontSize: 13 }}>
                  <span>{s.title.mn}</span>
                  <ProgressBar value={s.percent} tone={s.percent === 100 ? "success" : "accent"} />
                  <span style={{ textAlign: "right", color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>{s.percent}%</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Badges */}
          <Card>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-subtle)", marginBottom: 12 }}>
              Тэмдэг ({progress.badges.length})
            </div>
            {progress.badges.length ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {progress.badges.map((b) => (
                  <Badge key={b} tone="accent" size="md">{BADGE_LABEL[b] ?? b}</Badge>
                ))}
              </div>
            ) : (
              <p style={{ margin: 0, color: "var(--text-muted)", fontSize: 13 }}>
                Эхний хичээлээ дуусгаад тэмдэг цуглуулж эхэл.
              </p>
            )}
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
