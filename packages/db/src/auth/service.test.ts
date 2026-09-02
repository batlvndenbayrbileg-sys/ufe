import { describe, expect, it } from "vitest";
import { slugifyUsername } from "./service";

describe("slugifyUsername", () => {
  it("transliterates Mongolian Cyrillic, incl. Ө and Ү", () => {
    expect(slugifyUsername("Ануужин")).toBe("anuujin");
    expect(slugifyUsername("Өнөбат")).toBe("onobat");
    expect(slugifyUsername("Үзэсгэлэн")).toBe("uzesgelen");
  });
  it("lowercases, strips punctuation, collapses dashes", () => {
    expect(slugifyUsername("  Bat  Erdene! ")).toBe("bat-erdene");
  });
  it("falls back to 'user' for empty input", () => {
    expect(slugifyUsername("!!!")).toBe("user");
  });
  it("caps length", () => {
    expect(slugifyUsername("a".repeat(50)).length).toBeLessThanOrEqual(24);
  });
});
