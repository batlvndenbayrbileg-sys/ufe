// @khiye/content-sdk — lesson/task schema, patch engine, loader, linter, bundler (E3).
export * from "./schema";
export {
  applyPatch,
  collectAssetRefs,
  PatchError,
  type FileSet,
  type ApplyOptions,
} from "./patch";
export {
  loadCourse,
  loadLesson,
  flattenLessons,
  courseLayout,
  ContentLoadError,
  type CourseLayout,
} from "./loader";
export {
  lintLesson,
  lintCourse,
  summarize,
  type Diagnostic,
  type Severity,
} from "./lint";
export { bundleCourse, type CourseBundle } from "./build";
