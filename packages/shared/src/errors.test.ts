import { describe, expect, it } from "vitest";
import {
  AppError,
  errors,
  httpStatusOf,
  isAppError,
  toErrorResponse,
  toSuccess,
} from "./errors";

describe("AppError", () => {
  it("uses the code's default status and mn copy", () => {
    const e = new AppError("NOT_FOUND");
    expect(e.httpStatus).toBe(404);
    expect(e.mn).toContain("Олдсонгүй");
    expect(isAppError(e)).toBe(true);
  });

  it("allows overriding status, mn and details", () => {
    const e = new AppError("TASK_LOCKED", "locked", {
      httpStatus: 403,
      mn: "тусгай",
      details: { requiredTaskId: "m1-l5-t2" },
    });
    expect(e.mn).toBe("тусгай");
    expect(e.toBody().details).toEqual({ requiredTaskId: "m1-l5-t2" });
  });

  it("factories set details", () => {
    expect(errors.taskLocked("m1-l5-t2").toBody().details).toEqual({
      requiredTaskId: "m1-l5-t2",
    });
    expect(errors.validation({ email: "required" }).toBody().details).toEqual({
      fields: { email: "required" },
    });
  });
});

describe("envelope", () => {
  it("wraps success with meta.requestId", () => {
    expect(toSuccess({ ok: 1 }, "req_abc")).toEqual({
      data: { ok: 1 },
      meta: { requestId: "req_abc" },
    });
  });

  it("wraps an AppError into an error envelope", () => {
    const env = toErrorResponse(errors.unauthenticated(), "req_x");
    expect(env.error.code).toBe("UNAUTHENTICATED");
    expect(env.error.mn).toBeTruthy();
    expect(env.meta.requestId).toBe("req_x");
  });

  it("coerces unknown throwables to INTERNAL and hides their detail", () => {
    const env = toErrorResponse(new Error("db exploded"), "req_y");
    expect(env.error.code).toBe("INTERNAL");
    // raw message must not leak into the student-facing mn field
    expect(env.error.mn).not.toContain("db exploded");
    expect(httpStatusOf(new Error("x"))).toBe(500);
  });
});
