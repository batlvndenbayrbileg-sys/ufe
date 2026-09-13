import { computeLevel } from "@khiye/shared";
import type { Progress } from "./progress";
import { badgeLabel } from "./badges";
import type { CourseMapData, MapLesson } from "../app/app/course-types";

/**
 * Display-ready stats shape shared by the student page and the admin drill-down.
 * The server route (rich, DB-backed) and the client fallback (localStorage)
 * both produce this same shape, so one renderer draws either source.
 */

export interface StatTask {
  taskId: string;
  title: string;
  durationMs: number;
  attempts: number;
  hintsUsed: number;
  assisted: boolean;
  passed: boolean;
  at: number | null;
}

export interface StatLesson {
  lessonId: string;
  title: string;
  moduleTitle: string;
  courseSlug: string;
  passed: number;
  total: number;
  durationMs: number;
  lastAt: number | null;
  tasks: StatTask[];
}

export interface StatSkill {
  id: string;
  title: string;
  percent: number;
  xp: number;
}

export interface StatAchievement {
  id: string;
  label: string;
  at: number | null;
  earned: boolean;
}

export interface ResolvedStats {
  source: "server" | "local";
  xp: number;
  level: number;
  streakDays: number;
  tasksPassed: number;
  /** Total time across every recorded attempt (ms). */
  totalTimeMs: number;
  hintsTotal: number;
  /** Tasks solved without a hint / peek at the solution. */
  soloCount: number;
  /** Share of solved tasks done solo, 0–100. */
  soloRatio: number;
  lessonsCompleted: number;
  achievements: StatAchievement[];
  skills: StatSkill[];
  lessons: StatLesson[];
}

// ── Formatters ───────────────────────────────────────────────────────────────

/** Compact duration: "2ц 5м", "12м", "48с". */
export function fmtDuration(ms: number): string {
  if (!ms || ms < 0) return "0с";
  const totalSec = Math.round(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}ц ${m}м`;
  if (m > 0) return `${m}м ${s}с`;
  return `${s}с`;
}

/** Relative day label in Mongolian. */
export function fmtWhen(at: number | null): string {
  if (!at) return "—";
  const days = Math.floor((Date.now() - at) / 86_400_000);
  if (days <= 0) return "Өнөөдөр";
  if (days === 1) return "Өчигдөр";
  if (days < 30) return `${days} хоногийн өмнө`;
  return new Date(at).toLocaleDateString("mn-MN");
}

// ── Local (localStorage) builder ─────────────────────────────────────────────

interface LessonRef {
  lesson: MapLesson;
  moduleTitle: string;
  courseSlug: string;
  badgeId?: string;
  stageTitle: string;
}

function flattenWithContext(map: CourseMapData): LessonRef[] {
  const out: LessonRef[] = [];
  for (const stage of map.stages) {
    for (const mod of stage.modules) {
      for (const lesson of mod.lessons) {
        out.push({
          lesson,
          moduleTitle: mod.title.mn,
          courseSlug: map.id,
          badgeId: stage.badgeId,
          stageTitle: stage.title.mn,
        });
      }
    }
  }
  return out;
}

/**
 * Build display stats from the browser's localStorage progress and the loaded
 * course maps. This is what a signed-out learner (or a signed-in one before the
 * server has any rows) sees — it knows time only for tasks already solved.
 */
export function computeLocalStats(progress: Progress, maps: CourseMapData[]): ResolvedStats {
  const refs = maps.flatMap(flattenWithContext);
  const passed = progress.passedTasks;

  // Per-lesson rollup (only lessons with any solved task, most recent first).
  const lessons: StatLesson[] = [];
  for (const { lesson, moduleTitle, courseSlug } of refs) {
    const rows: StatTask[] = [];
    let dur = 0;
    let last: number | null = null;
    lesson.taskIds.forEach((id, i) => {
      const p = passed[id];
      if (!p) return;
      dur += p.durationMs ?? 0;
      last = last === null ? p.at : Math.max(last, p.at);
      rows.push({
        taskId: id,
        title: `Даалгавар ${i + 1}`,
        durationMs: p.durationMs ?? 0,
        attempts: p.attempts ?? 1,
        hintsUsed: p.hintsUsed ?? 0,
        assisted: p.assisted,
        passed: true,
        at: p.at,
      });
    });
    if (rows.length === 0) continue;
    lessons.push({
      lessonId: lesson.id,
      title: lesson.title.mn,
      moduleTitle,
      courseSlug,
      passed: rows.length,
      total: lesson.taskIds.length,
      durationMs: dur,
      lastAt: last,
      tasks: rows,
    });
  }
  lessons.sort((a, b) => (b.lastAt ?? 0) - (a.lastAt ?? 0));

  // Skills across every course, percent by lessons-with-skill completion.
  const skillMeta = new Map<string, { title: string; order: number }>();
  for (const map of maps) for (const sk of map.skills) if (!skillMeta.has(sk.id)) skillMeta.set(sk.id, { title: sk.title.mn, order: sk.order });
  const doneLessonIds = new Set(
    refs.filter((r) => r.lesson.taskIds.length > 0 && r.lesson.taskIds.every((id) => id in passed)).map((r) => r.lesson.id),
  );
  const skills: StatSkill[] = [...skillMeta.entries()]
    .map(([id, meta]) => {
      const withSkill = refs.filter((r) => r.lesson.skills.includes(id));
      const doneN = withSkill.filter((r) => doneLessonIds.has(r.lesson.id)).length;
      return {
        id,
        title: meta.title,
        percent: withSkill.length ? Math.round((doneN / withSkill.length) * 100) : 0,
        xp: progress.skillXp[id] ?? 0,
      };
    })
    .sort((a, b) => skillMeta.get(a.id)!.order - skillMeta.get(b.id)!.order);

  // Achievements: one per stage badge, earned when every lesson in it is done.
  const stageMap = new Map<string, { label: string; lessonIds: string[] }>();
  for (const r of refs) {
    if (!r.badgeId) continue;
    const entry = stageMap.get(r.badgeId) ?? { label: badgeLabel(r.badgeId), lessonIds: [] };
    entry.lessonIds.push(r.lesson.id);
    stageMap.set(r.badgeId, entry);
  }
  const achievements: StatAchievement[] = [...stageMap.entries()].map(([id, { label, lessonIds }]) => {
    const earned = lessonIds.length > 0 && lessonIds.every((lid) => doneLessonIds.has(lid));
    let at: number | null = null;
    if (earned) {
      for (const lid of lessonIds) {
        const lref = refs.find((r) => r.lesson.id === lid)!;
        for (const tid of lref.lesson.taskIds) {
          const p = passed[tid];
          if (p) at = at === null ? p.at : Math.max(at, p.at);
        }
      }
    }
    return { id, label, at, earned };
  });

  const allRows = lessons.flatMap((l) => l.tasks);
  const tasksPassed = allRows.length;
  const totalTimeMs = allRows.reduce((n, t) => n + t.durationMs, 0);
  const hintsTotal = allRows.reduce((n, t) => n + t.hintsUsed, 0);
  const soloCount = allRows.filter((t) => !t.assisted && t.hintsUsed === 0).length;

  return {
    source: "local",
    xp: progress.xp,
    level: computeLevel(progress.xp),
    streakDays: progress.streakDays,
    tasksPassed,
    totalTimeMs,
    hintsTotal,
    soloCount,
    soloRatio: tasksPassed ? Math.round((soloCount / tasksPassed) * 100) : 0,
    lessonsCompleted: doneLessonIds.size,
    achievements,
    skills,
    lessons,
  };
}
