import "server-only";
import type { UserStats } from "@khiye/db";
import {
  describeTasks,
  getAllSkills,
  getBadgeStages,
  getLessonSkillIndex,
} from "./content";
import { badgeLabel } from "./badges";
import type { ResolvedStats, StatLesson, StatTask } from "./stats";

/**
 * Turn the DB-backed UserStats (raw ids) into the display-ready ResolvedStats
 * the shared renderer draws — resolving task/lesson/module titles and deriving
 * the same skill percentages and stage achievements the local builder uses, so
 * the student page and the admin drill-down look identical whichever the source.
 */
export function buildResolvedStats(db: UserStats): ResolvedStats {
  const describe = describeTasks(db.tasks.map((t) => t.taskId));
  const completedIds = new Set(db.completedLessons.map((c) => c.lessonId));
  const completedAt = new Map(db.completedLessons.map((c) => [c.lessonId, c.at]));

  // Group task rows by lesson.
  const groups = new Map<string, StatLesson>();
  for (const t of db.tasks) {
    const d = describe.get(t.taskId);
    const lessonId = d?.lessonId ?? "unknown";
    const row: StatTask = {
      taskId: t.taskId,
      title: d?.taskTitle.mn ?? t.taskId,
      durationMs: t.durationMs,
      attempts: t.attempts,
      hintsUsed: t.hintsUsed,
      assisted: t.assisted,
      passed: t.passed,
      at: t.at,
    };
    const g =
      groups.get(lessonId) ??
      ({
        lessonId,
        title: d?.lessonTitle.mn ?? lessonId,
        moduleTitle: d?.moduleTitle.mn ?? "",
        courseSlug: d?.courseSlug ?? "",
        passed: 0,
        total: 0,
        durationMs: 0,
        lastAt: null,
        tasks: [],
      } satisfies StatLesson);
    g.tasks.push(row);
    g.durationMs += t.durationMs;
    if (t.passed) g.passed += 1;
    g.total += 1;
    if (t.at !== null) g.lastAt = g.lastAt === null ? t.at : Math.max(g.lastAt, t.at);
    groups.set(lessonId, g);
  }
  const lessons = [...groups.values()].sort((a, b) => (b.lastAt ?? 0) - (a.lastAt ?? 0));

  // Skills: percent by lessons-with-skill completed; xp from mastery rows.
  const skillIndex = getLessonSkillIndex();
  const xpBySkill = new Map(db.skills.map((s) => [s.skillId, s.xp]));
  const skills = getAllSkills().map((sk) => {
    let withSkill = 0;
    let done = 0;
    for (const [lessonId, ids] of skillIndex) {
      if (!ids.includes(sk.id)) continue;
      withSkill += 1;
      if (completedIds.has(lessonId)) done += 1;
    }
    return {
      id: sk.id,
      title: sk.title.mn,
      percent: withSkill ? Math.round((done / withSkill) * 100) : 0,
      xp: xpBySkill.get(sk.id) ?? 0,
    };
  });

  // Achievements: one per stage badge, earned when every lesson in it is done.
  const achievements = getBadgeStages().map((stage) => {
    const earned = stage.lessonIds.length > 0 && stage.lessonIds.every((lid) => completedIds.has(lid));
    let at: number | null = null;
    if (earned) {
      for (const lid of stage.lessonIds) {
        const c = completedAt.get(lid) ?? null;
        if (c !== null) at = at === null ? c : Math.max(at, c);
      }
    }
    return { id: stage.badgeId, label: badgeLabel(stage.badgeId), at, earned };
  });

  const soloCount = db.tasks.filter((t) => t.passed && !t.assisted && t.hintsUsed === 0).length;

  return {
    source: "server",
    xp: db.profile.totalXp,
    level: db.profile.level,
    streakDays: db.profile.streakDays,
    tasksPassed: db.tasksPassed,
    totalTimeMs: db.totalDurationMs,
    hintsTotal: db.hintsTotal,
    soloCount,
    soloRatio: db.tasksPassed ? Math.round((soloCount / db.tasksPassed) * 100) : 0,
    lessonsCompleted: db.lessonsCompleted,
    achievements,
    skills,
    lessons,
  };
}
