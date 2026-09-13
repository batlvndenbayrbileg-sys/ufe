"use client";

import { useState } from "react";
import {
  Zap,
  Medal,
  Flame,
  Clock,
  CircleCheckBig,
  Target,
  Lightbulb,
  ChevronRight,
  Trophy,
  Lock,
} from "lucide-react";
import { Badge, Card, ProgressBar } from "@khiye/ui";
import { fmtDuration, fmtWhen, type ResolvedStats } from "@/lib/stats";
import s from "./stats.module.css";

/** Shared, source-agnostic renderer for a ResolvedStats bundle. Drawn by both
 *  the student's own page and the admin's per-student drill-down. */
export function StatPanels({ stats }: { stats: ResolvedStats }) {
  const earned = stats.achievements.filter((a) => a.earned);
  const locked = stats.achievements.filter((a) => !a.earned);

  const cards = [
    { Icon: Zap, label: "Нийт XP", value: stats.xp.toLocaleString(), tint: s.tintXp },
    { Icon: Medal, label: "Түвшин", value: `Level ${stats.level}`, tint: s.tintLevel },
    { Icon: Flame, label: "Дараалал", value: `${stats.streakDays} өдөр`, tint: s.tintStreak },
    { Icon: Clock, label: "Нийт хугацаа", value: fmtDuration(stats.totalTimeMs), tint: s.tintTime },
    { Icon: CircleCheckBig, label: "Бодсон даалгавар", value: String(stats.tasksPassed), tint: s.tintDone },
    { Icon: Target, label: "Бие даан бодсон", value: `${stats.soloRatio}%`, tint: s.tintSolo },
    { Icon: Lightbulb, label: "Ашигласан сэжүүр", value: String(stats.hintsTotal), tint: s.tintHint },
  ];

  return (
    <div className={s.panels}>
      <div className={s.cards}>
        {cards.map((c) => (
          <div key={c.label} className={s.card}>
            <span className={`${s.cardIcon} ${c.tint}`}>
              <c.Icon size={18} strokeWidth={2.2} />
            </span>
            <div>
              <div className={s.cardValue}>{c.value}</div>
              <div className={s.cardLabel}>{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Achievements */}
      <Card>
        <div className={s.panelHead}>
          <span className={s.panelTitle}>
            <Trophy size={16} strokeWidth={2.2} /> Амжилтууд
          </span>
          <span className={s.panelRight}>
            {earned.length}/{stats.achievements.length}
          </span>
        </div>
        {stats.achievements.length === 0 ? (
          <p className={s.empty}>Амжилт бүртгэгдээгүй байна.</p>
        ) : (
          <div className={s.achievements}>
            {earned.map((a) => (
              <div key={a.id} className={s.ach}>
                <span className={s.achLabel}>{a.label}</span>
                <span className={s.achWhen}>{fmtWhen(a.at)}</span>
              </div>
            ))}
            {locked.map((a) => (
              <div key={a.id} className={`${s.ach} ${s.achLocked}`}>
                <span className={s.achLabel}>
                  <Lock size={12} strokeWidth={2.4} /> {a.label}
                </span>
                <span className={s.achWhen}>Аваагүй</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Time per lesson / task */}
      <Card>
        <div className={s.panelHead}>
          <span className={s.panelTitle}>
            <Clock size={16} strokeWidth={2.2} /> Даалгавар тус бүрийн хугацаа
          </span>
        </div>
        {stats.lessons.length === 0 ? (
          <p className={s.empty}>Одоохондоо бодсон даалгавар алга. Эхний хичээлээ эхлүүлээрэй.</p>
        ) : (
          <div className={s.lessons}>
            {stats.lessons.map((l) => (
              <LessonRow key={l.lessonId} lesson={l} />
            ))}
          </div>
        )}
      </Card>

      {/* Skills */}
      {stats.skills.length ? (
        <Card>
          <div className={s.panelHead}>
            <span className={s.panelTitle}>Ур чадвар</span>
          </div>
          <div className={s.skillGrid}>
            {stats.skills.map((sk) => (
              <div key={sk.id} className={s.skill}>
                <span className={s.skillName}>{sk.title}</span>
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
      ) : null}
    </div>
  );
}

function LessonRow({ lesson }: { lesson: ResolvedStats["lessons"][number] }) {
  const [open, setOpen] = useState(false);
  const complete = lesson.passed === lesson.total && lesson.total > 0;
  return (
    <div className={`${s.lesson} ${open ? s.lessonOpen : ""}`}>
      <button type="button" className={s.lessonToggle} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <ChevronRight size={15} className={s.lessonChevron} aria-hidden />
        <span className={s.lessonName}>{lesson.title}</span>
        {complete ? <Badge tone="success" size="sm">Дууссан</Badge> : (
          <Badge tone="neutral" size="sm">{lesson.passed}/{lesson.total}</Badge>
        )}
        <span className={s.lessonTime}>
          <Clock size={13} strokeWidth={2.2} /> {fmtDuration(lesson.durationMs)}
        </span>
      </button>
      {open ? (
        <div className={s.taskList}>
          {lesson.tasks.map((t) => (
            <div key={t.taskId} className={s.taskRow}>
              <span className={s.taskName}>
                {t.passed ? (
                  <CircleCheckBig size={13} strokeWidth={2.4} className={s.taskDone} />
                ) : (
                  <span className={s.taskPending} aria-hidden />
                )}
                {t.title}
              </span>
              <span className={s.taskMeta}>
                <span title="Хугацаа">
                  <Clock size={12} strokeWidth={2.2} /> {fmtDuration(t.durationMs)}
                </span>
                <span title="Оролдлого">↻ {t.attempts}</span>
                {t.hintsUsed > 0 ? (
                  <span title="Сэжүүр">
                    <Lightbulb size={12} strokeWidth={2.2} /> {t.hintsUsed}
                  </span>
                ) : null}
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
