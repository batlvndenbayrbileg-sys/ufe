import { describe, expect, it } from "vitest";
import {
  computeLevel,
  computeTaskXp,
  levelTitleKey,
  nextStreak,
  xpForLevel,
} from "./xp";

describe("computeTaskXp", () => {
  it("gives the first-try, no-hint multiplier", () => {
    expect(computeTaskXp({ baseXp: 10, attemptNo: 1, hintsUsed: 0, assisted: false })).toBe(13); // 10 * 1.25
  });
  it("no multiplier after the first attempt", () => {
    expect(computeTaskXp({ baseXp: 10, attemptNo: 2, hintsUsed: 0, assisted: false })).toBe(10);
  });
  it("subtracts hint costs", () => {
    expect(computeTaskXp({ baseXp: 20, attemptNo: 3, hintsUsed: 2, assisted: false })).toBe(19);
    expect(computeTaskXp({ baseXp: 20, attemptNo: 3, hintsUsed: 3, assisted: false })).toBe(17);
  });
  it("assisted caps at 40% and never negative", () => {
    expect(computeTaskXp({ baseXp: 10, attemptNo: 5, hintsUsed: 3, assisted: true })).toBe(4);
    expect(computeTaskXp({ baseXp: 1, attemptNo: 5, hintsUsed: 3, assisted: false })).toBe(0);
  });
});

describe("levels", () => {
  it("computeLevel matches the formula", () => {
    expect(computeLevel(0)).toBe(1);
    expect(computeLevel(60)).toBe(2);
    expect(computeLevel(59)).toBe(1);
    expect(computeLevel(5400)).toBe(10);
  });
  it("xpForLevel inverts computeLevel", () => {
    for (const lvl of [1, 2, 5, 10, 15]) {
      expect(computeLevel(xpForLevel(lvl))).toBe(lvl);
    }
  });
  it("titles are professional and scale", () => {
    expect(levelTitleKey(1)).toBe("beginner");
    expect(levelTitleKey(10)).toBe("fullstackIntern");
    expect(levelTitleKey(15)).toBe("builder");
  });
});

describe("nextStreak", () => {
  it("increments on a consecutive day", () => {
    expect(nextStreak("2026-09-01", "2026-09-02", 3)).toEqual({ days: 4, extendedToday: true });
  });
  it("no change on the same day", () => {
    expect(nextStreak("2026-09-02", "2026-09-02", 3)).toEqual({ days: 3, extendedToday: false });
  });
  it("resets after a gap", () => {
    expect(nextStreak("2026-08-28", "2026-09-02", 7)).toEqual({ days: 1, extendedToday: true });
  });
  it("starts at 1 with no history", () => {
    expect(nextStreak(null, "2026-09-02", 0)).toEqual({ days: 1, extendedToday: true });
  });
});
