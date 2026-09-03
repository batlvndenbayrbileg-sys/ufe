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

/**
 * Server-side content service. Loads the course from the git content repo,
 * caches it, and produces REDACTED public views — the client never receives a
 * solution or unviewed hint text (docs/blueprint/10 §10.4). Check args are kept
 * server-side; grading runs on the server (§5.6 D4).
 */

const COURSE_ID = "internet-programming";

function resolveCourseDir(): string {
  const candidates = [
    process.env.CONTENT_DIR,
    join(process.cwd(), "content/courses", COURSE_ID),
    join(process.cwd(), "../../content/courses", COURSE_ID),
  ].filter(Boolean) as string[];
  for (const dir of candidates) if (existsSync(join(dir, "course.json"))) return dir;
  throw new Error(`content course not found; looked in: ${candidates.join(", ")}`);
}

let cache: { course: ResolvedCourse; lessons: Map<string, Lesson>; tasks: Map<string, { task: Task; lesson: Lesson }> } | null = null;

function ensureLoaded() {
  if (cache) return cache;
  const course = loadCourse(resolveCourseDir());
  const lessons = new Map<string, Lesson>();
  const tasks = new Map<string, { task: Task; lesson: Lesson }>();
  for (const lesson of flattenLessons(course)) {
    lessons.set(lesson.id, lesson);
    for (const task of lesson.tasks) tasks.set(task.id, { task, lesson });
  }
  cache = { course, lessons, tasks };
  return cache;
}

export function getCourseMap() {
  const { course } = ensureLoaded();
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

export interface LessonPublic {
  id: string;
  moduleId: string;
  slug: string;
  title: Lesson["title"];
  why: Lesson["why"];
  buildsInProject: string;
  estimatedMinutes: number;
  skills: string[];
  concepts: string[];
  execution: Lesson["execution"];
  workspace: Lesson["workspace"];
  completion: Lesson["completion"];
  mobileFriendly: boolean;
  tasks: TaskPublic[];
}

export function getLessonPublic(lessonId: string): LessonPublic | null {
  const lesson = getLessonFull(lessonId);
  if (!lesson) return null;
  return {
    id: lesson.id,
    moduleId: lesson.moduleId,
    slug: lesson.slug,
    title: lesson.title,
    why: lesson.why,
    buildsInProject: lesson.buildsInProject,
    estimatedMinutes: lesson.estimatedMinutes,
    skills: lesson.skills,
    concepts: lesson.concepts,
    execution: lesson.execution,
    workspace: lesson.workspace,
    completion: lesson.completion,
    mobileFriendly: lesson.mobileFriendly,
    tasks: [...lesson.tasks].sort((a, b) => a.order - b.order).map(redactTask),
  };
}

/** The next lesson id in course order (for unlock), or null. */
export function getNextLessonId(lessonId: string): string | null {
  const { course } = ensureLoaded();
  const flat = flattenLessons(course).map((l) => l.id);
  const i = flat.indexOf(lessonId);
  return i >= 0 && i < flat.length - 1 ? flat[i + 1]! : null;
}
