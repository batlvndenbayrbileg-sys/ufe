import "server-only";
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  flattenLessons,
  loadCourse,
  type Lesson,
  type ResolvedCourse,
  type Task,
} from "@khiye/content-sdk";
import { resolveConcepts, type ResolvedConcept } from "./concepts";

/**
 * Server-side content service. Loads the course from the git content repo,
 * caches it, and produces REDACTED public views — the client never receives a
 * solution or unviewed hint text (docs/blueprint/10 §10.4). Check args are kept
 * server-side; grading runs on the server (§5.6 D4).
 */

/**
 * The catalogue. The web app is now multi-course: React Native ships as its own
 * course ("mobile-programming") beside the web track. `slug` is the folder under
 * content/courses AND the id used in /app/course/<slug> URLs. The first entry is
 * the default when no course is named. Progress/XP are shared (one localStorage
 * blob keyed by task id); per-course completion is computed by task membership.
 */
const COURSE_SLUGS = ["internet-programming", "mobile-programming"] as const;
const DEFAULT_SLUG = COURSE_SLUGS[0];

function resolveCourseDir(slug: string): string | null {
  const bases = [
    process.env.CONTENT_DIR ? join(process.env.CONTENT_DIR, "..", slug) : null,
    join(process.cwd(), "content/courses", slug),
    join(process.cwd(), "../../content/courses", slug),
  ].filter(Boolean) as string[];
  for (const dir of bases) if (existsSync(join(dir, "course.json"))) return dir;
  return null;
}

interface ModuleMeta {
  id: string;
  title: { mn: string; en?: string };
  courseSlug: string;
}

interface Loaded {
  courses: Map<string, ResolvedCourse>; // keyed by slug
  courseByLesson: Map<string, string>; // lessonId → slug
  lessons: Map<string, Lesson>;
  tasks: Map<string, { task: Task; lesson: Lesson }>;
  modules: Map<string, ModuleMeta>; // moduleId → title/course
}

let cache: Loaded | null = null;

function ensureLoaded(): Loaded {
  if (cache) return cache;
  const courses = new Map<string, ResolvedCourse>();
  const courseByLesson = new Map<string, string>();
  const lessons = new Map<string, Lesson>();
  const tasks = new Map<string, { task: Task; lesson: Lesson }>();
  const modules = new Map<string, ModuleMeta>();
  for (const slug of COURSE_SLUGS) {
    const dir = resolveCourseDir(slug);
    if (!dir) {
      // The web course must exist; a not-yet-authored extra course is skipped.
      if (slug === DEFAULT_SLUG) throw new Error(`content course not found: ${slug}`);
      continue;
    }
    const course = loadCourse(dir);
    courses.set(slug, course);
    for (const stage of course.stages) {
      for (const mod of stage.moduleObjects) {
        modules.set(mod.id, { id: mod.id, title: mod.title, courseSlug: slug });
      }
    }
    for (const lesson of flattenLessons(course)) {
      lessons.set(lesson.id, lesson);
      courseByLesson.set(lesson.id, slug);
      for (const task of lesson.tasks) tasks.set(task.id, { task, lesson });
    }
  }
  cache = { courses, courseByLesson, lessons, tasks, modules };
  return cache;
}

/** Resolve a course by slug or by its internal id (both appear in URLs/records). */
function resolveCourse(slugOrId?: string): { slug: string; course: ResolvedCourse } {
  const { courses } = ensureLoaded();
  if (slugOrId) {
    if (courses.has(slugOrId)) return { slug: slugOrId, course: courses.get(slugOrId)! };
    for (const [slug, course] of courses) if (course.id === slugOrId) return { slug, course };
  }
  return { slug: DEFAULT_SLUG, course: courses.get(DEFAULT_SLUG)! };
}

/** The course each lesson belongs to (slug), or the default. */
function courseSlugForLesson(lessonId: string): string {
  return ensureLoaded().courseByLesson.get(lessonId) ?? DEFAULT_SLUG;
}

/** Lightweight catalogue for a course picker: slug, title, description, size. */
export function getCourseList() {
  const { courses } = ensureLoaded();
  return COURSE_SLUGS.filter((s) => courses.has(s)).map((slug) => {
    const course = courses.get(slug)!;
    const lessonCount = course.stages.reduce(
      (n, st) => n + st.moduleObjects.reduce((m, mod) => m + mod.lessonObjects.length, 0),
      0,
    );
    return {
      id: course.id,
      slug,
      title: course.title,
      description: course.description,
      level: course.level,
      stageCount: course.stages.length,
      lessonCount,
    };
  });
}

export function getCourseMap(slugOrId?: string) {
  const { slug, course } = resolveCourse(slugOrId);
  void slug;
  return {
    id: course.id,
    slug: course.slug,
    title: course.title,
    description: course.description,
    stages: course.stages.map((s) => ({
      id: s.id,
      order: s.order,
      title: s.title,
      badgeId: s.badgeId,
      modules: s.moduleObjects.map((m) => ({
        id: m.id,
        order: m.order,
        title: m.title,
        lessons: m.lessonObjects.map((l) => ({
          id: l.id,
          order: l.order,
          title: l.title,
          slug: l.slug,
          estimatedMinutes: l.estimatedMinutes,
          skills: l.skills,
          taskIds: l.tasks.map((t) => t.id),
        })),
      })),
    })),
    skills: course.skills,
  };
}

/** Full (server-only) task — includes checks with args and the solution. */
export function getTaskFull(taskId: string): { task: Task; lesson: Lesson } | null {
  return ensureLoaded().tasks.get(taskId) ?? null;
}

export function getLessonFull(lessonId: string): Lesson | null {
  return ensureLoaded().lessons.get(lessonId) ?? null;
}

// ── Redacted public shapes ───────────────────────────────────────────────────

export interface TaskPublic {
  id: string;
  order: number;
  title: Lesson["tasks"][number]["title"];
  statement: Task["statement"];
  requirements?: Task["requirements"];
  expected: Task["expected"];
  targetFile?: string;
  marker?: string;
  starter?: Task["starter"];
  xp: number;
  estimatedMinutes: number;
  skills: string[];
  checkCount: number;
  hints: Array<{ level: number; xpCost: number; unlocked: boolean }>;
  solution: { unlocked: boolean };
}

function redactTask(task: Task): TaskPublic {
  return {
    id: task.id,
    order: task.order,
    title: task.title,
    statement: task.statement,
    requirements: task.requirements,
    expected: task.expected,
    targetFile: task.targetFile,
    marker: task.marker,
    starter: task.starter,
    xp: task.xp,
    estimatedMinutes: task.estimatedMinutes,
    skills: task.skills,
    checkCount: task.checks.length,
    // Hint text/code and the solution are fetched on demand through gated endpoints.
    hints: task.hints.map((h) => ({ level: h.level, xpCost: h.xpCost, unlocked: false })),
    solution: { unlocked: false },
  };
}

/** A quiz question with the answer key stripped — options stay, `correct` and
 *  the explanation are revealed only by the grading endpoint. */
export interface QuizQuestionPublic {
  id: string;
  question: { mn: string; en?: string };
  options: Array<{ mn: string; en?: string }>;
  /** A pre-answer nudge (no answer key). Absent if the question defines none. */
  hint?: { mn: string; en?: string };
}

export interface LessonPublic {
  id: string;
  moduleId: string;
  /** Slug of the course this lesson belongs to (for course-scoped links). */
  courseSlug: string;
  slug: string;
  title: Lesson["title"];
  why: Lesson["why"];
  buildsInProject: string;
  estimatedMinutes: number;
  skills: string[];
  concepts: string[];
  /** Interactive glossary cards for this lesson's concepts (empty if none defined). */
  conceptNotes: ResolvedConcept[];
  execution: Lesson["execution"];
  workspace: Lesson["workspace"];
  completion: Lesson["completion"];
  mobileFriendly: boolean;
  tasks: TaskPublic[];
  quiz: QuizQuestionPublic[];
}

export function getLessonPublic(lessonId: string): LessonPublic | null {
  const lesson = getLessonFull(lessonId);
  if (!lesson) return null;
  return {
    id: lesson.id,
    moduleId: lesson.moduleId,
    courseSlug: courseSlugForLesson(lesson.id),
    slug: lesson.slug,
    title: lesson.title,
    why: lesson.why,
    buildsInProject: lesson.buildsInProject,
    estimatedMinutes: lesson.estimatedMinutes,
    skills: lesson.skills,
    concepts: lesson.concepts,
    conceptNotes: resolveConcepts(lesson.concepts),
    execution: lesson.execution,
    workspace: lesson.workspace,
    completion: lesson.completion,
    mobileFriendly: lesson.mobileFriendly,
    tasks: [...lesson.tasks].sort((a, b) => a.order - b.order).map(redactTask),
    quiz: lesson.quiz.map((q) => ({
      id: q.id,
      question: q.question,
      options: q.options,
      ...(q.hint ? { hint: q.hint } : {}),
    })),
  };
}

export interface QuizResult {
  id: string;
  correct: boolean;
  correctIndex: number;
  explanation: { mn: string; en?: string };
}

/**
 * Grade a quiz submission against the (server-side) answer key. `answers[i]` is
 * the chosen option index for question i, or -1/undefined if unanswered.
 * Returns per-question results plus the score, or null if the lesson is unknown.
 */
export function gradeQuiz(
  lessonId: string,
  answers: number[],
): { results: QuizResult[]; score: number; total: number } | null {
  const lesson = getLessonFull(lessonId);
  if (!lesson) return null;
  const results = lesson.quiz.map((q, i) => ({
    id: q.id,
    correct: answers[i] === q.correct,
    correctIndex: q.correct,
    explanation: q.explanation,
  }));
  return { results, score: results.filter((r) => r.correct).length, total: results.length };
}

/** The next lesson id in course order (for unlock), or null. */
/** The next lesson in course order, with enough to label a link. */
export function getNextLesson(lessonId: string): { id: string; title: { mn: string } } | null {
  const id = getNextLessonId(lessonId);
  if (!id) return null;
  const lesson = getLessonFull(id);
  return lesson ? { id, title: lesson.title } : null;
}

export function getNextLessonId(lessonId: string): string | null {
  // Stay within the lesson's own course, so the last web lesson doesn't spill
  // into the mobile course (and vice versa).
  const { courses } = ensureLoaded();
  const slug = courseSlugForLesson(lessonId);
  const course = courses.get(slug);
  if (!course) return null;
  const flat = flattenLessons(course).map((l) => l.id);
  const i = flat.indexOf(lessonId);
  return i >= 0 && i < flat.length - 1 ? flat[i + 1]! : null;
}

// ── Stats resolution (ids → human labels) ────────────────────────────────────

export interface TaskDescriptor {
  taskId: string;
  taskTitle: { mn: string; en?: string };
  lessonId: string;
  lessonTitle: { mn: string; en?: string };
  moduleId: string;
  moduleTitle: { mn: string; en?: string };
  courseSlug: string;
  xp: number;
  estimatedMinutes: number;
}

/** Resolve a set of task ids to their lesson/module/course labels. Ids the
 *  catalogue no longer contains are simply omitted. */
export function describeTasks(taskIds: Iterable<string>): Map<string, TaskDescriptor> {
  const { tasks, modules } = ensureLoaded();
  const out = new Map<string, TaskDescriptor>();
  for (const id of taskIds) {
    const hit = tasks.get(id);
    if (!hit) continue;
    const { task, lesson } = hit;
    const mod = modules.get(lesson.moduleId);
    out.set(id, {
      taskId: id,
      taskTitle: task.title,
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      moduleId: lesson.moduleId,
      moduleTitle: mod?.title ?? { mn: lesson.moduleId },
      courseSlug: courseSlugForLesson(lesson.id),
      xp: task.xp,
      estimatedMinutes: task.estimatedMinutes,
    });
  }
  return out;
}

/** Every skill across all courses, de-duplicated by id (mobile reuses some web
 *  skill ids). Used to label skill-mastery rows in the stats views. */
export function getAllSkills(): Array<{ id: string; title: { mn: string; en?: string }; order: number }> {
  const { courses } = ensureLoaded();
  const seen = new Map<string, { id: string; title: { mn: string; en?: string }; order: number }>();
  for (const course of courses.values()) {
    for (const sk of course.skills) if (!seen.has(sk.id)) seen.set(sk.id, sk);
  }
  return [...seen.values()].sort((a, b) => a.order - b.order);
}

export interface BadgeStage {
  badgeId: string;
  courseSlug: string;
  stageTitle: { mn: string; en?: string };
  lessonIds: string[];
}

/** Stages that grant an achievement badge, with the lessons that make them up.
 *  A badge is "earned" once every lesson in its stage is complete — this lets
 *  both the student page (localStorage) and the admin view (DB) derive the same
 *  achievement list without a separate awards table. */
export function getBadgeStages(): BadgeStage[] {
  const { courses } = ensureLoaded();
  const out: BadgeStage[] = [];
  for (const [slug, course] of courses) {
    for (const stage of course.stages) {
      if (!stage.badgeId) continue;
      const lessonIds = stage.moduleObjects.flatMap((m) => m.lessonObjects.map((l) => l.id));
      out.push({ badgeId: stage.badgeId, courseSlug: slug, stageTitle: stage.title, lessonIds });
    }
  }
  return out;
}

/** Map every task id to the lesson it belongs to (both courses). */
export function getTaskLessonIndex(): Map<string, string> {
  const { tasks } = ensureLoaded();
  const out = new Map<string, string>();
  for (const [taskId, { lesson }] of tasks) out.set(taskId, lesson.id);
  return out;
}

/** Map every lesson id to its skill ids (both courses), for mastery percentages. */
export function getLessonSkillIndex(): Map<string, string[]> {
  const { lessons } = ensureLoaded();
  const out = new Map<string, string[]>();
  for (const [id, lesson] of lessons) out.set(id, lesson.skills);
  return out;
}

export interface ModuleInfo {
  moduleId: string;
  title: { mn: string; en?: string };
  courseSlug: string;
  lessonIds: string[];
  taskTotal: number;
}

/** A module's lessons and total task count — for the leaderboard resolver. */
export function getModuleInfo(moduleId: string): ModuleInfo | null {
  const { lessons, modules } = ensureLoaded();
  const mod = modules.get(moduleId);
  if (!mod) return null;
  const lessonIds: string[] = [];
  let taskTotal = 0;
  for (const [id, lesson] of lessons) {
    if (lesson.moduleId === moduleId) {
      lessonIds.push(id);
      taskTotal += lesson.tasks.length;
    }
  }
  return { moduleId, title: mod.title, courseSlug: mod.courseSlug, lessonIds, taskTotal };
}
