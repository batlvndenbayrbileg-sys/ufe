// @khiye/db — Prisma client, repositories, auth helpers (E2).
export { prisma } from "./client";
// Re-export generated types/enums (Role, ProgressStatus, Prisma namespace, …).
export * from "@prisma/client";

export { hashPassword, verifyPassword, isPasswordAcceptable } from "./auth/password";
export {
  registerUser,
  authenticateUser,
  slugifyUsername,
  type RegisterInput,
} from "./auth/service";

export {
  awardTaskCompletion,
  hasPassedTask,
  type SubmitInput,
  type CheckResultInput,
  type AwardResult,
} from "./repos/progress";

export {
  getUserStats,
  listStudents,
  type UserStats,
  type TaskStatRow,
  type StudentRow,
} from "./repos/stats";

export { ensureBootstrapAdmin } from "./repos/admin";

export {
  getWorkspace,
  saveWorkspace,
  assertWorkspaceWithinLimits,
  workspaceSize,
  WORKSPACE_MAX_BYTES,
  WORKSPACE_MAX_FILES,
  type FileSet,
} from "./repos/workspace";
