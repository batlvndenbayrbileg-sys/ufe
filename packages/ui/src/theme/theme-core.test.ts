import { describe, expect, it } from "vitest";
import { resolveTheme, themeInitScript, THEME_STORAGE_KEY } from "./theme-core";

describe("theme-core", () => {
  it("resolves system against the OS preference", () => {
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
    expect(resolveTheme("light", true)).toBe("light");
  });

  it("init script references the storage key and guards for private mode", () => {
    const script = themeInitScript();
    expect(script).toContain(THEME_STORAGE_KEY);
    expect(script).toContain("try");
    expect(script).toContain("data-theme");
  });
});
