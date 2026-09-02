import { describe, expect, it } from "vitest";
import { isAppError } from "@khiye/shared";
import {
  assertWorkspaceWithinLimits,
  WORKSPACE_MAX_FILES,
  workspaceSize,
  type FileSet,
} from "./workspace";

describe("workspace limits", () => {
  it("measures utf-8 byte size", () => {
    expect(workspaceSize({ "a.txt": { content: "abc" } })).toBe(3);
    // Cyrillic is multi-byte
    expect(workspaceSize({ "a.txt": { content: "Ө" } })).toBe(2);
  });

  it("accepts a normal workspace", () => {
    const files: FileSet = { "index.html": { content: "<h1>Shop.mn</h1>" } };
    expect(assertWorkspaceWithinLimits(files)).toBeGreaterThan(0);
  });

  it("rejects too many files", () => {
    const files: FileSet = {};
    for (let i = 0; i <= WORKSPACE_MAX_FILES; i++) files[`f${i}.txt`] = { content: "x" };
    try {
      assertWorkspaceWithinLimits(files);
      throw new Error("should have thrown");
    } catch (e) {
      expect(isAppError(e)).toBe(true);
      expect((e as { code: string }).code).toBe("PAYLOAD_TOO_LARGE");
    }
  });

  it("rejects an oversize workspace", () => {
    const files: FileSet = { "big.txt": { content: "x".repeat(512 * 1024 + 1) } };
    expect(() => assertWorkspaceWithinLimits(files)).toThrow();
  });
});
