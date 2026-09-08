import { z } from "zod";

/**
 * Content schema (docs/blueprint/04-content-schema.md §4.3). Mongolian is the
 * source language, so `mn` is required and `en` optional throughout.
 * This is the authoritative contract: authors write it, the loop consumes it.
 */

export const LocalizedSchema = z.object({
  mn: z.string().min(1, "mn text is required"),
  en: z.string().optional(),
});
export type Localized = z.infer<typeof LocalizedSchema>;

export const SkillIdSchema = z.string().regex(/^[a-z][a-z0-9-]*$/, "skill id must be kebab-case");

// ── FilePatch: the 6 workspace operations ────────────────────────────────────

export const FilePatchSchema = z.discriminatedUnion("op", [
  z.object({ op: z.literal("create"), path: z.string().min(1), content: z.string() }),
  z.object({ op: z.literal("replace"), path: z.string().min(1), content: z.string() }),
  z.object({ op: z.literal("append"), path: z.string().min(1), content: z.string() }),
  z.object({ op: z.literal("delete"), path: z.string().min(1) }),
  z.object({ op: z.literal("rename"), path: z.string().min(1), to: z.string().min(1) }),
  z.object({
    op: z.literal("insertAfter"),
    path: z.string().min(1),
    anchor: z.string().min(1),
    content: z.string(),
  }),
]);
export type FilePatch = z.infer<typeof FilePatchSchema>;

// ── Check / Hint / Solution ──────────────────────────────────────────────────

export const CheckSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  args: z.record(z.unknown()).default({}),
  onFail: LocalizedSchema,
  onPass: LocalizedSchema.optional(),
  weight: z.number().positive().default(1),
  hidden: z.boolean().default(false),
});
export type Check = z.infer<typeof CheckSchema>;

export const HintSchema = z.object({
  level: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  text: LocalizedSchema,
  code: z.string().optional(),
  xpCost: z.number().int().nonnegative().default(0),
});
export type Hint = z.infer<typeof HintSchema>;

export const SolutionSchema = z.object({
  patch: z.array(FilePatchSchema).min(1),
  explanation: LocalizedSchema,
  xpPenalty: z.number().int().nonnegative().default(0),
});
export type Solution = z.infer<typeof SolutionSchema>;

// ── Task ─────────────────────────────────────────────────────────────────────

export const ExpectedSchema = z.object({
  description: LocalizedSchema,
  image: z.string().optional(),
  previewRef: z.string().optional(),
});

export const TaskSchema = z.object({
  id: z.string().min(1),
  order: z.number().int().nonnegative(),
  title: LocalizedSchema,
  statement: LocalizedSchema,
  requirements: z.array(LocalizedSchema).optional(),
  expected: ExpectedSchema,
  starter: z.array(FilePatchSchema).optional(),
  targetFile: z.string().optional(),
  marker: z.string().optional(),
  checks: z.array(CheckSchema).min(1, "every task needs at least one check"),
  checkMode: z.enum(["all", "weighted"]).default("all"),
  passThreshold: z.number().min(0).max(1).default(1),
  hints: z.array(HintSchema),
  solution: SolutionSchema,
  xp: z.number().int().positive().default(10),
  estimatedMinutes: z.number().int().positive().default(5),
  skills: z.array(SkillIdSchema),
  allowSkip: z.boolean().default(false),
});
export type Task = z.infer<typeof TaskSchema>;

// ── Lesson ───────────────────────────────────────────────────────────────────

export const ExecutionSchema = z.object({
  tier: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  runtime: z.enum(["static", "sqlite", "vite-react", "next", "node", "postgres", "pglite"]),
  entry: z.string().optional(),
  autoRun: z.boolean().default(false),
  services: z.array(z.enum(["postgres", "mailhog"])).optional(),
});

export const WorkspaceSpecSchema = z.object({
  patch: z.array(FilePatchSchema).default([]),
  visibleFiles: z.array(z.string()).default([]),
  openFiles: z.array(z.string()).default([]),
  activeFile: z.string().optional(),
  readOnlyFiles: z.array(z.string()).optional(),
});

export const CompletionSchema = z.object({
  xp: z.number().int().nonnegative().default(15),
  badge: z.string().optional(),
  milestone: z.boolean().default(false),
  celebration: z.enum(["small", "medium", "large"]).default("small"),
});

/** A multiple-choice question checking the concept behind the lesson. */
export const QuizQuestionSchema = z
  .object({
    id: z.string().min(1),
    question: LocalizedSchema,
    options: z.array(LocalizedSchema).min(2, "a question needs at least two options"),
    /** Index into `options` of the correct answer. */
    correct: z.number().int().nonnegative(),
    explanation: LocalizedSchema,
    /** An optional nudge the student can reveal before answering. Safe to send
        to the client — it points toward the idea without giving the answer. */
    hint: LocalizedSchema.optional(),
  })
  .refine((q) => q.correct < q.options.length, {
    message: "`correct` must index into `options`",
    path: ["correct"],
  });
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;

export const LessonSchema = z.object({
  id: z.string().min(1),
  moduleId: z.string().min(1),
  slug: z.string().min(1),
  order: z.number().int().nonnegative(),
  title: LocalizedSchema,
  subtitle: LocalizedSchema.optional(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).default("beginner"),
  estimatedMinutes: z.number().int().positive().default(20),
  skills: z.array(SkillIdSchema),
  concepts: z.array(z.string()).default([]),
  prerequisites: z.array(z.string()).default([]),
  why: LocalizedSchema,
  buildsInProject: z.string().default(""),
  execution: ExecutionSchema,
  workspace: WorkspaceSpecSchema.default({}),
  tasks: z.array(TaskSchema).min(1, "a lesson needs at least one task"),
  quiz: z.array(QuizQuestionSchema).default([]),
  completion: CompletionSchema.default({}),
  mobileFriendly: z.boolean().default(true),
  status: z.enum(["draft", "review", "published", "deprecated"]).default("draft"),
  version: z.number().int().positive().default(1),
  authors: z.array(z.string()).default([]),
  updatedAt: z.string().optional(),
});
export type Lesson = z.infer<typeof LessonSchema>;

// ── Module / Stage / Course ──────────────────────────────────────────────────

export const ModuleSchema = z.object({
  id: z.string().min(1),
  stageId: z.string().min(1),
  order: z.number().int().nonnegative(),
  title: LocalizedSchema,
  description: LocalizedSchema,
  estimatedHours: z.number().nonnegative().default(0),
  lessons: z.array(z.string()).min(1), // lesson id refs, resolved by the loader
});
export type ModuleDef = z.infer<typeof ModuleSchema>;

export const StageSchema = z.object({
  id: z.string().min(1),
  order: z.number().int().nonnegative(),
  title: LocalizedSchema,
  badgeId: z.string().optional(),
  moduleIds: z.array(z.string()).min(1),
});
export type StageDef = z.infer<typeof StageSchema>;

export const CourseSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  title: LocalizedSchema,
  description: LocalizedSchema,
  level: z.string().default("beginner"),
  stages: z.array(StageSchema).min(1),
});
export type CourseDef = z.infer<typeof CourseSchema>;

export const SkillDefSchema = z.object({
  id: SkillIdSchema,
  title: LocalizedSchema,
  order: z.number().int().nonnegative().default(0),
});
export type SkillDef = z.infer<typeof SkillDefSchema>;

/** A fully-resolved course: stages → modules → lessons inlined. */
export interface ResolvedModule extends ModuleDef {
  lessonObjects: Lesson[];
}
export interface ResolvedStage extends StageDef {
  moduleObjects: ResolvedModule[];
}
export interface ResolvedCourse extends Omit<CourseDef, "stages"> {
  stages: ResolvedStage[];
  skills: SkillDef[];
}
