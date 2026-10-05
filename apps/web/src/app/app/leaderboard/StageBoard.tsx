"use client";

import { useEffect, useMemo, useState } from "react";
import { Spinner } from "@khiye/ui";
import { Flame, Crown } from "lucide-react";
import s from "./leaderboard.module.css";

interface CourseProgress {
  slug: string;
  title: string;
  stagesTotal: number;
  stagesDone: number;
  stageFlags: boolean[];
  furthestStageTitle: string | null;
  lessonsTotal: number;
  lessonsDone: number;
}
interface StageEntry {
  rank: number;
  userId: string;
  name: string;
  username: string;
  totalXp: number;
  level: number;
  streakDays: number;
  stagesDone: number;
  lessonsCompleted: number;
  courses: CourseProgress[];
}

const MEDAL_CLASS = [s.podiumGold, s.podiumSilver, s.podiumBronze];

/**
 * Who has finished which stage — the question a class actually asks.
 *
 * Each learner carries a flag per stage, so the row draws the WHOLE journey as
 * a track of pips instead of a single number: you can see at a glance who is
 * three stages in and who is nearly done. Top three get a podium.
 */
export function StageBoard({ courseSlug }: { courseSlug: string | "all" }) {
  const [entries, setEntries] = useState<StageEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/leaderboard/stages")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((res) => {
        if (!alive) return;
        if (res.data?.unavailable) {
          setError("Мэдээлэл түр боломжгүй байна. Хэсэг хүлээгээд дахин оролдоно уу.");
          setEntries([]);
          return;
        }
        setEntries((res.data?.entries ?? []) as StageEntry[]);
      })
      .catch(() => alive && setError("Тэргүүлэгчдийг ачаалж чадсангүй."));
    return () => {
      alive = false;
    };
  }, []);

  // Rank by the selected course when one is picked, so the board answers
  // "who is furthest in THIS course", not a cross-course sum.
  const ranked = useMemo(() => {
    if (!entries) return null;
    const pick = (e: StageEntry) =>
      courseSlug === "all" ? null : (e.courses.find((c) => c.slug === courseSlug) ?? null);
    const scored = entries.map((e) => {
      const c = pick(e);
      return {
        e,
        c,
        stages: c ? c.stagesDone : e.stagesDone,
        lessons: c ? c.lessonsDone : e.lessonsCompleted,
      };
    });
    scored.sort(
      (a, b) =>
        b.stages - a.stages || b.lessons - a.lessons || b.e.totalXp - a.e.totalXp ||
        a.e.name.localeCompare(b.e.name),
    );
    return scored.map((x, i) => ({ ...x, rank: i + 1 }));
  }, [entries, courseSlug]);

  if (error) return <p className={s.empty}>{error}</p>;
  if (!ranked)
    return (
      <div className={s.boardLoading}>
        <Spinner size={22} label="Ачааллаж байна" />
      </div>
    );
  if (ranked.length === 0)
    return <p className={s.empty}>Одоохондоо оролцогч алга. Эхний шатаа дуусгаад тэргүүл!</p>;

  const podium = ranked.slice(0, 3);
  const rest = ranked.slice(3);

  const track = (flags: boolean[] | undefined, total: number) => {
    const f = flags ?? [];
    return (
      <span className={s.track} aria-hidden>
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={`${s.pip} ${f[i] ? s.pipDone : ""}`} />
        ))}
      </span>
    );
  };

  return (
    <div className={s.stageBoard}>
      {/* Podium — the top three, tallest in the middle. */}
      <div className={s.podium}>
        {[podium[1], podium[0], podium[2]].map((p, slot) =>
          p ? (
            <div
              key={p.e.userId}
              className={`${s.podiumCard} ${MEDAL_CLASS[p.rank - 1] ?? ""} ${slot === 1 ? s.podiumFirst : ""}`}
            >
              {p.rank === 1 ? <Crown size={18} className={s.podiumCrown} aria-hidden /> : null}
              <span className={s.podiumAvatar} aria-hidden>
                {p.e.name.charAt(0)}
              </span>
              <span className={s.podiumName}>{p.e.name}</span>
              <span className={s.podiumStages}>
                {p.stages} шат
              </span>
              <span className={s.podiumRank}>{p.rank}</span>
            </div>
          ) : (
            <div key={`empty-${slot}`} className={s.podiumEmpty} aria-hidden />
          ),
        )}
      </div>

      <div className={s.rows}>
        {rest.map((r) => {
          const total = r.c ? r.c.stagesTotal : r.e.courses.reduce((n, c) => n + c.stagesTotal, 0);
          const flags = r.c
            ? r.c.stageFlags
            : r.e.courses.flatMap((c) => c.stageFlags);
          return (
            <div key={r.e.userId} className={s.stageRow}>
              <span className={s.rank}>{r.rank}</span>
              <span className={s.avatar} aria-hidden>
                {r.e.name.charAt(0)}
              </span>
              <span className={s.stageWho}>
                <span className={s.name}>{r.e.name}</span>
                <span className={s.stageWhere}>
                  {r.c?.furthestStageTitle ?? (r.stages > 0 ? `${r.stages} шат дуусгасан` : "Эхлээгүй")}
                </span>
              </span>
              {track(flags, total)}
              <span className={s.stageCount}>
                {r.stages}
                <span className={s.scoreTotal}>/{total}</span>
              </span>
              {r.e.streakDays > 0 ? (
                <span className={s.streak} title="Дараалал">
                  <Flame size={13} strokeWidth={2.4} /> {r.e.streakDays}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
