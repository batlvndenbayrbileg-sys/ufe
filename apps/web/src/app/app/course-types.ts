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
