import { describe, expect, it } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
  it("joins strings and drops falsy", () => {
    expect(cn("a", false, "b", null, undefined, "", "c")).toBe("a b c");
  });
  it("handles arrays and records", () => {
    expect(cn("a", ["b", ["c"]], { d: true, e: false })).toBe("a b c d");
  });
  it("returns empty string for no truthy input", () => {
    expect(cn(false, null, undefined)).toBe("");
  });
});
