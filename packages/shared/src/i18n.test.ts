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

  it("covers the common beginner errors (≥ 25 rules)", () => {
    expect(RUNTIME_ERROR_RULE_COUNT).toBeGreaterThanOrEqual(25);
    expect(translateRuntimeError("Cannot read properties of null (reading 'addEventListener')")?.what).toContain("null");
    expect(translateRuntimeError("Assignment to constant variable.")?.howToFind).toContain("let");
    expect(translateRuntimeError("Identifier 'cart' has already been declared")?.what).toContain("cart");
  });

  it("translates React errors (stage 3)", () => {
    expect(
      translateRuntimeError("Too many re-renders. React limits the number of renders")?.what,
    ).toContain("дахин зурж");
    expect(translateRuntimeError("Objects are not valid as a React child (found: object)")?.what).toContain("Объект");
    expect(
      translateRuntimeError("React has detected a change in the order of Hooks")?.howToFind,
    ).toContain("useState");
  });

  it("translates SQLite errors (stage 6), naming the table/column", () => {
    expect(translateRuntimeError("no such table: products")?.what).toContain("products");
    expect(translateRuntimeError("no such column: price")?.what).toContain("price");
    expect(translateRuntimeError('near "SELCT": syntax error')?.what).toContain("SELCT");
    expect(translateRuntimeError("UNIQUE constraint failed: products.id")?.what).toContain("products.id");
  });

  it("returns null for an unknown error", () => {
    expect(translateRuntimeError("some totally novel error")).toBeNull();
  });
});
