import { describe, expect, it } from "vitest";
import { DEFAULT_LOCALE, isLocale, pick, resolveLocale } from "./i18n";
import { translateRuntimeError, RUNTIME_ERROR_RULE_COUNT } from "./errors/mn";

describe("i18n", () => {
  it("mn is the default source locale", () => {
    expect(DEFAULT_LOCALE).toBe("mn");
  });

  it("validates and resolves locales", () => {
    expect(isLocale("mn")).toBe(true);
    expect(isLocale("fr")).toBe(false);
    expect(resolveLocale("en")).toBe("en");
    expect(resolveLocale("zz")).toBe("mn");
    expect(resolveLocale(undefined)).toBe("mn");
  });

  it("pick falls back to mn when en is absent", () => {
    expect(pick({ mn: "Сайн уу" }, "en")).toBe("Сайн уу");
    expect(pick({ mn: "Сайн уу", en: "Hi" }, "en")).toBe("Hi");
    expect(pick({ mn: "Сайн уу", en: "Hi" }, "mn")).toBe("Сайн уу");
  });
});

describe("runtime error translation", () => {
  it("translates a common undefined.map error into Mongolian", () => {
    const t = translateRuntimeError("Cannot read properties of undefined (reading 'map')");
    expect(t).not.toBeNull();
    expect(t?.what).toContain(".map");
    expect(t?.howToFind).toContain("console.log");
  });

  it("covers the common beginner errors (≥ 20 rules)", () => {
    expect(RUNTIME_ERROR_RULE_COUNT).toBeGreaterThanOrEqual(20);
    expect(translateRuntimeError("Cannot read properties of null (reading 'addEventListener')")?.what).toContain("null");
    expect(translateRuntimeError("Assignment to constant variable.")?.howToFind).toContain("let");
    expect(translateRuntimeError("Identifier 'cart' has already been declared")?.what).toContain("cart");
  });

  it("returns null for an unknown error", () => {
    expect(translateRuntimeError("some totally novel error")).toBeNull();
  });
});
