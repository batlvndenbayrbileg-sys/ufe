import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import {
  CourseSchema,
  LessonSchema,
  ModuleSchema,
  SkillDefSchema,
  type Lesson,
  type ResolvedCourse,
  type ResolvedModule,
  type ResolvedStage,
} from "./schema";

export class ContentLoadError extends Error {
  readonly file: string;
  readonly issues?: z.ZodIssue[];
  constructor(file: string, message: string, issues?: z.ZodIssue[]) {
    super(`${file}: ${message}`);
    this.name = "ContentLoadError";
    this.file = file;
    this.issues = issues;
  }
}

function readJson<S extends z.ZodTypeAny>(file: string, schema: S): z.infer<S> {
  if (!existsSync(file)) throw new ContentLoadError(file, "file not found");
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(file, "utf8"));
  } catch (e) {
    throw new ContentLoadError(file, `invalid JSON: ${(e as Error).message}`);
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    const first = result.error.issues[0];
    throw new ContentLoadError(
      file,
      `schema error at ${first?.path.join(".") || "<root>"}: ${first?.message}`,
      result.error.issues,
    );
  }
  return result.data;
}

/** Course dir layout: course.json, skills.json, modules/<id>.json, lessons/<id>.json */
export interface CourseLayout {
  courseFile: string;
  skillsFile: string;
  moduleFile: (id: string) => string;
  lessonFile: (id: string) => string;
}

export function courseLayout(dir: string): CourseLayout {
  return {
    courseFile: join(dir, "course.json"),
    skillsFile: join(dir, "skills.json"),
    moduleFile: (id) => join(dir, "modules", `${id}.json`),
    lessonFile: (id) => join(dir, "lessons", `${id}.json`),
  };
}

export function loadLesson(file: string): Lesson {
  return readJson(file, LessonSchema);
}

/** Load and fully resolve a course from disk (stages → modules → lessons). */
export function loadCourse(dir: string): ResolvedCourse {
  const layout = courseLayout(dir);
  const course = readJson(layout.courseFile, CourseSchema);
  const skills = existsSync(layout.skillsFile)
    ? readJson(layout.skillsFile, z.array(SkillDefSchema))
    : [];

  const stages: ResolvedStage[] = course.stages
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((stage) => {
      const moduleObjects: ResolvedModule[] = stage.moduleIds.map((moduleId) => {
        const mod = readJson(layout.moduleFile(moduleId), ModuleSchema);
        const lessonObjects = mod.lessons.map((lessonId) => {
          const lesson = loadLesson(layout.lessonFile(lessonId));
          if (lesson.moduleId !== mod.id) {
            throw new ContentLoadError(
              layout.lessonFile(lessonId),
              `lesson.moduleId "${lesson.moduleId}" ≠ module "${mod.id}"`,
            );
          }
          return lesson;
        });
        lessonObjects.sort((a, b) => a.order - b.order);
        return { ...mod, lessonObjects };
      });
      return { ...stage, moduleObjects };
    });

  return { ...course, stages, skills };
}

/** Flatten a resolved course to a lesson list in course order. */
export function flattenLessons(course: ResolvedCourse): Lesson[] {
  const out: Lesson[] = [];
  for (const stage of course.stages) {
    for (const mod of stage.moduleObjects) out.push(...mod.lessonObjects);
  }
  return out;
}
