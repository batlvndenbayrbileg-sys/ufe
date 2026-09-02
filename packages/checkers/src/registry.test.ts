import { describe, expect, it } from "vitest";
import { registerChecker, runCheck, runChecks, verdict } from "./registry";
import type { CheckerContext } from "./types";

const ctx: CheckerContext = { files: {}, consoleErrors: [] };

describe("registry & runner", () => {
  it("unknown checker type → infra, not a student failure", async () => {
    const r = await runCheck({ id: "x", type: "does.not.exist", args: {} }, ctx);
    expect(r.passed).toBe(false);
    expect(r.errorKind).toBe("infra");
    expect(r.durationMs).toBeGreaterThanOrEqual(0);
  });

  it("a checker that throws → infra (never blames the student)", async () => {
    registerChecker("test.throws", () => {
      throw new Error("boom");
    });
    const r = await runCheck({ id: "t", type: "test.throws", args: {} }, ctx);
    expect(r.errorKind).toBe("infra");
    expect(r.raw).toContain("boom");
  });

  it("verdict(all) ignores infra results but requires the rest to pass", async () => {
    registerChecker("test.pass", () => ({ passed: true }));
    registerChecker("test.fail", () => ({ passed: false }));
    const results = await runChecks(
      [
        { id: "a", type: "test.pass", args: {} },
        { id: "b", type: "does.not.exist", args: {} }, // infra
      ],
      ctx,
    );
    expect(verdict(results, "all").passed).toBe(true); // infra excluded, a passed
    expect(verdict(results, "all").infra).toBe(true);

    const withFail = await runChecks(
      [
        { id: "a", type: "test.pass", args: {} },
        { id: "b", type: "test.fail", args: {} },
      ],
      ctx,
    );
    expect(verdict(withFail, "all").passed).toBe(false);
  });

  it("verdict(weighted) scores by weight", async () => {
    const results = await runChecks(
      [
        { id: "a", type: "test.pass", args: {} },
        { id: "b", type: "test.fail", args: {} },
      ],
      ctx,
    );
    const v = verdict(results, "weighted", 0.5, { a: 3, b: 1 });
    expect(v.score).toBeCloseTo(0.75, 5);
    expect(v.passed).toBe(true); // 0.75 ≥ 0.5
  });
});
