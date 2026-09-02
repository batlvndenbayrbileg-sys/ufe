/**
 * Authorization policy — the single place permission decisions are made
 * (docs/blueprint/13-security.md §13.3). Pure and deterministic: it takes a
 * principal and a typed action context and returns a decision. It never
 * touches the database — callers assemble the context.
 */

export type Role = "STUDENT" | "TEACHER" | "AUTHOR" | "ADMIN";
export type Plan = "free" | "learner" | "institution";

export interface Principal {
  id: string;
  role: Role;
  plan?: Plan;
  status?: "ACTIVE" | "SUSPENDED" | "DELETED";
}

export type Action =
  | { type: "task:submit"; enrolled: boolean; prereqPassed: boolean; tier: number }
  | { type: "task:run"; enrolled: boolean; tier: number }
  | { type: "solution:read"; gateMet: boolean }
  | { type: "hint:read"; requestedLevel: number; currentLevel: number }
  | { type: "student:read"; targetUserId: string; teacherCohortUserIds?: string[] }
  | { type: "content:write" }
  | { type: "content:publish" }
  | { type: "sandbox:start"; tier: number }
  | { type: "teacher:access" }
  | { type: "admin:access" };

export interface Decision {
  allowed: boolean;
  /** Stable machine reason; map to a Mongolian message at the edge. */
  reason?: string;
}

const ALLOW: Decision = { allowed: true };
const deny = (reason: string): Decision => ({ allowed: false, reason });

function planAllowsTier(plan: Plan | undefined, tier: number): boolean {
  if (tier <= 1) return true; // Tier 1 runs in the browser; free tier included
  return plan === "learner" || plan === "institution";
}

/** The single authorization entry point. */
export function can(principal: Principal, action: Action): Decision {
  if (principal.status === "SUSPENDED") return deny("account_suspended");
  if (principal.status === "DELETED") return deny("account_deleted");
  if (principal.role === "ADMIN") return ALLOW; // admins bypass, but the call is still audited upstream

  switch (action.type) {
    case "task:submit": {
      if (!action.enrolled) return deny("not_enrolled");
      if (!action.prereqPassed) return deny("prerequisite_incomplete");
      if (!planAllowsTier(principal.plan, action.tier)) return deny("plan_required");
      return ALLOW;
    }
    case "task:run": {
      if (!action.enrolled) return deny("not_enrolled");
      if (!planAllowsTier(principal.plan, action.tier)) return deny("plan_required");
      return ALLOW;
    }
    case "solution:read":
      return action.gateMet ? ALLOW : deny("solution_locked");
    case "hint:read":
      return action.requestedLevel <= action.currentLevel + 1
        ? ALLOW
        : deny("hint_locked");
    case "student:read": {
      if (principal.id === action.targetUserId) return ALLOW; // self
      if (
        principal.role === "TEACHER" &&
        action.teacherCohortUserIds?.includes(action.targetUserId)
      ) {
        return ALLOW;
      }
      return deny("forbidden");
    }
    case "content:write":
    case "content:publish":
      return principal.role === "AUTHOR" ? ALLOW : deny("forbidden");
    case "sandbox:start":
      return planAllowsTier(principal.plan, action.tier) ? ALLOW : deny("plan_required");
    case "teacher:access":
      return principal.role === "TEACHER" ? ALLOW : deny("forbidden");
    case "admin:access":
      return deny("forbidden"); // only ADMIN, handled above
  }
}

/** Convenience: throws-friendly boolean. */
export function allowed(principal: Principal, action: Action): boolean {
  return can(principal, action).allowed;
}
