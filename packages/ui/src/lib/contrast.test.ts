import { describe, expect, it } from "vitest";
import { contrastRatio, parseHex } from "./contrast";

describe("contrast", () => {
  it("computes the extremes", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 0);
    expect(contrastRatio("#ffffff", "#ffffff")).toBeCloseTo(1, 5);
  });
  it("is symmetric", () => {
    expect(contrastRatio("#2563eb", "#ffffff")).toBeCloseTo(
      contrastRatio("#ffffff", "#2563eb"),
      5,
    );
  });
  it("parses shorthand hex", () => {
    expect(parseHex("#fff")).toEqual({ r: 255, g: 255, b: 255 });
    expect(() => parseHex("nope")).toThrow();
  });
});
