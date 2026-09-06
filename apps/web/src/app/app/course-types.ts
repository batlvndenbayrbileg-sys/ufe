export interface MapLesson {
  id: string;
  order: number;
  title: { mn: string; en?: string };
  slug: string;
  estimatedMinutes: number;
  skills: string[];
  taskIds: string[];
}
export interface MapModule {
  id: string;
  order: number;
  title: { mn: string; en?: string };
  lessons: MapLesson[];
}
export interface MapStage {
  id: string;
  order: number;
  title: { mn: string; en?: string };
  badgeId?: string;
  modules: MapModule[];
}
export interface CourseMapData {
  id: string;
  title: { mn: string; en?: string };
  description: { mn: string; en?: string };
  stages: MapStage[];
  skills: Array<{ id: string; title: { mn: string; en?: string }; order: number }>;
}

export function flattenLessons(map: CourseMapData): MapLesson[] {
  return map.stages.flatMap((s) => s.modules.flatMap((m) => m.lessons));
}

/** A lesson's place in the ladder: finished, the one to do now, or still locked. */
export type LessonState = "done" | "current" | "locked";

/**
 * Whether a lesson can be opened. Students may open what they have finished and
 * the one lesson they are on; an admin (or the local "preview all" flag) may
 * open every lesson regardless of progress. Pure so it can be unit-tested.
 */
export function isLessonAccessible(state: LessonState, isAdmin: boolean): boolean {
  return isAdmin || state !== "locked";
}
