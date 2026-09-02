import type { Lesson, ResolvedCourse, SkillDef } from "./schema";
import { flattenLessons } from "./loader";

/** Serialized, edge-cacheable form of a course (what the DB sync + app consume). */
export interface CourseBundle {
  generatedAt: string;
  course: {
    id: string;
    slug: string;
    title: ResolvedCourse["title"];
    description: ResolvedCourse["description"];
    level: string;
  };
  skills: SkillDef[];
  stages: Array<{
    id: string;
    order: number;
    title: ResolvedCourse["stages"][number]["title"];
    badgeId?: string;
    modules: Array<{
      id: string;
      order: number;
      title: ResolvedCourse["stages"][number]["moduleObjects"][number]["title"];
      description: ResolvedCourse["stages"][number]["moduleObjects"][number]["description"];
      estimatedHours: number;
      lessonIds: string[];
    }>;
  }>;
  lessons: Lesson[];
  stats: {
    stageCount: number;
    moduleCount: number;
    lessonCount: number;
    taskCount: number;
  };
}

export function bundleCourse(course: ResolvedCourse): CourseBundle {
  const lessons = flattenLessons(course);
  const stages = course.stages.map((s) => ({
    id: s.id,
    order: s.order,
    title: s.title,
    badgeId: s.badgeId,
    modules: s.moduleObjects.map((m) => ({
      id: m.id,
      order: m.order,
      title: m.title,
      description: m.description,
      estimatedHours: m.estimatedHours,
      lessonIds: m.lessonObjects.map((l) => l.id),
    })),
  }));

  return {
    generatedAt: new Date().toISOString(),
    course: {
      id: course.id,
      slug: course.slug,
      title: course.title,
      description: course.description,
      level: course.level,
    },
    skills: course.skills,
    stages,
    lessons,
    stats: {
      stageCount: stages.length,
      moduleCount: stages.reduce((n, s) => n + s.modules.length, 0),
      lessonCount: lessons.length,
      taskCount: lessons.reduce((n, l) => n + l.tasks.length, 0),
    },
  };
}
