import "server-only";
import { listStudentProgressDetail, listStudents } from "@khiye/db";
import { getLessonFull, getStageIndex } from "./content";

export interface RosterCourseProgress {
  slug: string;
  title: string;
  stagesTotal: number;
  stagesDone: number;
  /** One flag per stage, in course order — the little track the UI draws. */
  stageFlags: boolean[];
  /** Title of the furthest stage they have finished, or null. */
  furthestStageTitle: string | null;
  lessonsTotal: number;
  lessonsDone: number;
}

export interface RosterEntry {
  id: string;
  name: string;
  username: string;
  email?: string;
  role: string;
  totalXp: number;
  level: number;
  streakDays: number;
  tasksPassed: number;
  lessonsCompleted: number;
  totalDurationMs: number;
  lastActiveAt: number | null;
  /** What they're on right now — the question a teacher actually asks. */
  current: {
    lessonId: string;
    lessonTitle: string;
    stageTitle: string | null;
    courseSlug: string | null;
    tasksPassed: number;
    tasksTotal: number;
  } | null;
  courses: RosterCourseProgress[];
}

/**
 * The class roster: headline numbers plus, for every student, which stages they
 * have finished and the lesson they are sitting on right now.
 *
 * Progress lives in the DB per lesson; the course shape lives in content. This
 * is where the two meet, so both the teacher dashboard and the stage
 * leaderboard read one consistent picture.
 */
export async function buildRoster(opts: { limit?: number } = {}): Promise<RosterEntry[]> {
  const students = await listStudents({ limit: opts.limit ?? 500 });
  if (students.length === 0) return [];

  const detail = await listStudentProgressDetail(students.map((s) => s.id));
  const stages = getStageIndex();

  // Stage lookup for "which stage is this lesson in".
  const stageOfLesson = new Map<string, { title: string; slug: string }>();
  for (const st of stages) {
    for (const id of st.lessonIds) stageOfLesson.set(id, { title: st.title.mn, slug: st.courseSlug });
  }

  const bySlug = new Map<string, typeof stages>();
  for (const st of stages) {
    const list = bySlug.get(st.courseSlug) ?? [];
    list.push(st);
    bySlug.set(st.courseSlug, list);
  }

  return students.map((s) => {
    const d = detail.get(s.id);
    const done = new Set(d?.completedLessonIds ?? []);

    const courses: RosterCourseProgress[] = [];
    for (const [slug, list] of bySlug) {
      const ordered = [...list].sort((a, b) => a.order - b.order);
      const stageFlags = ordered.map(
        (st) => st.lessonIds.length > 0 && st.lessonIds.every((id) => done.has(id)),
      );
      const lessonIds = ordered.flatMap((st) => st.lessonIds);
      const lastDoneIdx = stageFlags.lastIndexOf(true);
      courses.push({
        slug,
        title: ordered[0]?.courseTitle.mn ?? slug,
        stagesTotal: ordered.length,
        stagesDone: stageFlags.filter(Boolean).length,
        stageFlags,
        furthestStageTitle: lastDoneIdx >= 0 ? (ordered[lastDoneIdx]?.title.mn ?? null) : null,
        lessonsTotal: lessonIds.length,
        lessonsDone: lessonIds.filter((id) => done.has(id)).length,
      });
    }

    const curId = d?.currentLessonId ?? null;
    const curLesson = curId ? getLessonFull(curId) : null;
    const curStage = curId ? (stageOfLesson.get(curId) ?? null) : null;

    return {
      id: s.id,
      name: s.name,
      username: s.username,
      email: s.email,
      role: s.role,
      totalXp: s.totalXp,
      level: s.level,
      streakDays: s.streakDays,
      tasksPassed: s.tasksPassed,
      lessonsCompleted: s.lessonsCompleted,
      totalDurationMs: s.totalDurationMs,
      lastActiveAt: s.lastActiveAt ?? d?.lastProgressAt ?? null,
      current: curId
        ? {
            lessonId: curId,
            lessonTitle: curLesson?.title.mn ?? curId,
            stageTitle: curStage?.title ?? null,
            courseSlug: curStage?.slug ?? null,
            tasksPassed: d?.currentTasksPassed ?? 0,
            tasksTotal: d?.currentTasksTotal ?? 0,
          }
        : null,
      courses,
    };
  });
}
