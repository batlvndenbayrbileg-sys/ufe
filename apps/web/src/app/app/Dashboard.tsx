"use client";

import { useEffect, useMemo, useState } from "react";
import { Flame, Zap, Medal, Trophy, Palette, ArrowRight } from "lucide-react";
import { Alert, AppShell, Badge, Button, Card, ProgressBar, ProgressRing, Spinner, ThemeToggle } from "@khiye/ui";
import { level, loadProgress, lessonProgress, type Progress } from "@/lib/progress";
import { flattenLessons, type MapLesson } from "./course-types";
import { useCourseMap } from "./useCourseMap";
import { BrandLockup } from "../BrandMark";
import { AccountControl } from "../AccountControl";
import { badgeLabel } from "@/lib/badges";
import s from "./dashboard.module.css";

export function Dashboard() {
  const { map, error, reload } = useCourseMap();
  const [progress, setProgress] = useState<Progress | null>(null);

  useEffect(() => {
    setProgress(loadProgress());
  }, []);

  const lessons = useMemo(() => (map ? flattenLessons(map) : []), [map]);

  if (error) {
    return (
      <AppShell header={<BrandLockup />}>
        <Alert tone="danger" title="Хичээлүүд ачаалагдсангүй">
          <p style={{ margin: "0 0 12px" }}>{error}</p>
          <Button onClick={reload}>Дахин оролдох</Button>
        </Alert>
      </AppShell>
    );
  }

  if (!map || !progress) {
    return (
      <AppShell header={<BrandLockup />}>
        <div className={s.loading}>
          <Spinner size={24} label="Ачааллаж байна" />
          <span>Ачааллаж байна…</span>
        </div>
      </AppShell>
    );
  }

  const doneLessons = lessons.filter((l) => lessonProgress(l.taskIds, progress).done);
  const percent = lessons.length ? Math.round((doneLessons.length / lessons.length) * 100) : 0;
  const nextLesson: MapLesson | undefined = lessons.find((l) => !lessonProgress(l.taskIds, progress).done) ?? lessons[0];
  const nextProg = nextLesson ? lessonProgress(nextLesson.taskIds, progress) : { passed: 0, total: 0 };
  const done = percent === 100;

  // Skill mastery at the lesson level: done lessons tagged with the skill / total.
  const skills = map.skills.map((sk) => {
    const withSkill = lessons.filter((l) => l.skills.includes(sk.id));
    const doneN = withSkill.filter((l) => lessonProgress(l.taskIds, progress).done).length;
    return { ...sk, percent: withSkill.length ? Math.round((doneN / withSkill.length) * 100) : 0 };
  });

  const lvl = level(progress.xp);

  return (
    <AppShell
      header={
        <>
          <BrandLockup />
          <div className={s.headerStats}>
            <span className={`${s.headerChip} ${s.chipStreak}`} title="Дараалал">
              <Flame size={15} strokeWidth={2.4} /> {progress.streakDays}
            </span>
            <span className={`${s.headerChip} ${s.chipXp}`} title="Оноо">
              <Zap size={15} strokeWidth={2.4} /> {progress.xp.toLocaleString()}
            </span>
            <Badge tone="neutral">Level {lvl}</Badge>
            <AccountControl />
            <ThemeToggle />
          </div>
        </>
      }
    >
      <div className={s.page}>
        <div>
          <h1 className={s.greeting}>Сайн уу 👋</h1>
          <p className={s.subGreeting}>
            {done ? "Курсээ бүрэн дуусгалаа — гоё!" : "Өнөөдөр хаанаас үргэлжлүүлэх вэ?"}
          </p>
        </div>

        {/* The one card that matters. */}
        {nextLesson ? (
          <div className={s.hero}>
            <ProgressRing
              className={s.heroRing}
              size={72}
              value={nextProg.total ? Math.round((nextProg.passed / nextProg.total) * 100) : 0}
            />
            <div className={s.heroBody}>
              <div className={s.eyebrow}>{done ? "Дуусгав" : "Үргэлжлүүлэх"}</div>
              <div className={s.heroTitle}>{nextLesson.title.mn}</div>
              <div className={s.heroMeta}>
                {nextProg.passed}/{nextProg.total} даалгавар · ~{nextLesson.estimatedMinutes} мин
              </div>
            </div>
            <a href={`/learn/${nextLesson.id}`} className={s.heroCta}>
              {done ? "Дахин үзэх" : "Үргэлжлүүлэх"} <ArrowRight size={17} strokeWidth={2.4} />
            </a>
          </div>
        ) : null}

        {/* Gamification at a glance. */}
        <div className={s.stats}>
          <div className={s.stat}>
            <span className={`${s.statIcon} ${s.iconStreak}`}>
              <Flame size={22} strokeWidth={2.2} />
            </span>
            <div>
              <div className={s.statValue}>
                {progress.streakDays} <span style={{ fontSize: "var(--text-md)", fontWeight: 600 }}>өдөр</span>
              </div>
              <div className={s.statLabel}>Дараалал</div>
            </div>
          </div>
          <div className={s.stat}>
            <span className={`${s.statIcon} ${s.iconXp}`}>
              <Zap size={22} strokeWidth={2.2} />
            </span>
            <div>
              <div className={s.statValue}>{progress.xp.toLocaleString()}</div>
              <div className={s.statLabel}>Нийт оноо (XP)</div>
            </div>
          </div>
          <div className={s.stat}>
            <span className={`${s.statIcon} ${s.iconLevel}`}>
              <Medal size={22} strokeWidth={2.2} />
            </span>
            <div>
              <div className={s.statValue}>Level {lvl}</div>
              <div className={s.statLabel}>Түвшин</div>
            </div>
          </div>
        </div>

        {/* Course progress. */}
        <Card>
          <div className={s.panelHead}>
            <strong style={{ fontSize: "var(--text-md)" }}>{map.title.mn}</strong>
            <span className={s.panelRight}>
              {doneLessons.length}/{lessons.length} хичээл · {percent}%
            </span>
          </div>
          <ProgressBar value={percent} />
          <a href={`/app/course/${map.id}`} className={s.courseLink}>
            Бүх хичээл харах →
          </a>
        </Card>

        <div className={s.body}>
          {/* Skills — two columns so 17 rows read as a grid, not a ledger. */}
          <Card>
            <div className={s.panelHead}>
              <span className={s.panelTitle}>Ур чадвар</span>
            </div>
            <div className={s.skillGrid}>
              {skills.map((sk) => (
                <div key={sk.id} className={s.skill}>
                  <span className={s.skillName}>{sk.title.mn}</span>
                  <span className={s.skillPct}>{sk.percent}%</span>
                  <ProgressBar
                    className={s.skillBar}
                    value={sk.percent}
                    tone={sk.percent === 100 ? "success" : "accent"}
                  />
                </div>
              ))}
            </div>
          </Card>

          {/* Badges. */}
          <Card>
            <div className={s.panelHead}>
              <span className={s.panelTitle}>Тэмдэг ({progress.badges.length})</span>
            </div>
            {progress.badges.length ? (
              <div className={s.badgeWrap}>
                {progress.badges.map((b) => (
                  <Badge key={b} tone="accent" size="md">
                    {badgeLabel(b)}
                  </Badge>
                ))}
              </div>
            ) : (
              <div className={s.badgeEmpty}>
                <div className={s.badgePlaceholders} aria-hidden>
                  <span className={s.badgeDot}>
                    <Trophy size={18} />
                  </span>
                  <span className={s.badgeDot}>
                    <Zap size={18} />
                  </span>
                  <span className={s.badgeDot}>
                    <Palette size={18} />
                  </span>
                </div>
                <p className={s.badgeEmptyText}>Эхний хичээлээ дуусгаад анхны тэмдгээ ав.</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
