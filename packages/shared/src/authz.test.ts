import { describe, expect, it } from "vitest";
import { can, type Principal } from "./authz";

const student: Principal = { id: "u1", role: "STUDENT", plan: "free", status: "ACTIVE" };
const paid: Principal = { id: "u2", role: "STUDENT", plan: "learner", status: "ACTIVE" };
const teacher: Principal = { id: "t1", role: "TEACHER", status: "ACTIVE" };
const author: Principal = { id: "a1", role: "AUTHOR", status: "ACTIVE" };
const admin: Principal = { id: "ad", role: "ADMIN", status: "ACTIVE" };

describe("can()", () => {
  it("free tier may submit Tier-1 but not Tier-3", () => {
    expect(can(student, { type: "task:submit", enrolled: true, prereqPassed: true, tier: 1 }).allowed).toBe(true);
    const t3 = can(student, { type: "task:submit", enrolled: true, prereqPassed: true, tier: 3 });
    expect(t3.allowed).toBe(false);
    expect(t3.reason).toBe("plan_required");
  });

  it("paid tier may submit Tier-3", () => {
    expect(can(paid, { type: "task:submit", enrolled: true, prereqPassed: true, tier: 3 }).allowed).toBe(true);
  });

  it("blocks submit without enrollment or prerequisites", () => {
    expect(can(paid, { type: "task:submit", enrolled: false, prereqPassed: true, tier: 1 }).reason).toBe("not_enrolled");
    expect(can(paid, { type: "task:submit", enrolled: true, prereqPassed: false, tier: 1 }).reason).toBe("prerequisite_incomplete");
  });

  it("solution and hint gates", () => {
    expect(can(student, { type: "solution:read", gateMet: false }).reason).toBe("solution_locked");
    expect(can(student, { type: "solution:read", gateMet: true }).allowed).toBe(true);
    expect(can(student, { type: "hint:read", requestedLevel: 3, currentLevel: 1 }).reason).toBe("hint_locked");
    expect(can(student, { type: "hint:read", requestedLevel: 2, currentLevel: 1 }).allowed).toBe(true);
  });

  it("student:read — self, teacher-of-cohort, else forbidden", () => {
    expect(can(student, { type: "student:read", targetUserId: "u1" }).allowed).toBe(true);
    expect(can(student, { type: "student:read", targetUserId: "other" }).reason).toBe("forbidden");
    expect(can(teacher, { type: "student:read", targetUserId: "s9", teacherCohortUserIds: ["s9"] }).allowed).toBe(true);
    expect(can(teacher, { type: "student:read", targetUserId: "s9", teacherCohortUserIds: ["s8"] }).reason).toBe("forbidden");
  });

  it("content writes require AUTHOR; teacher access requires TEACHER", () => {
    expect(can(author, { type: "content:write" }).allowed).toBe(true);
    expect(can(student, { type: "content:write" }).reason).toBe("forbidden");
    expect(can(teacher, { type: "teacher:access" }).allowed).toBe(true);
    expect(can(student, { type: "teacher:access" }).reason).toBe("forbidden");
  });

  it("admin bypasses; suspended is denied everything", () => {
    expect(can(admin, { type: "content:write" }).allowed).toBe(true);
    expect(can(admin, { type: "admin:access" }).allowed).toBe(true);
    const suspended: Principal = { ...paid, status: "SUSPENDED" };
    expect(can(suspended, { type: "task:submit", enrolled: true, prereqPassed: true, tier: 1 }).reason).toBe("account_suspended");
  });
});
