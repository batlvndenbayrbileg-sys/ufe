export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "khiye-theme";

/** Inline script (stringified) that applies the stored theme before first paint,
 *  preventing a flash of the wrong theme. Rendered in <head> by ThemeScript. */
export function themeInitScript(storageKey = THEME_STORAGE_KEY): string {
  return `(function(){try{var t=localStorage.getItem(${JSON.stringify(
    storageKey,
  )});if(t==="light"||t==="dark"){document.documentElement.setAttribute("data-theme",t);}else{document.documentElement.removeAttribute("data-theme");}}catch(e){}})();`;
}

/** Apply a theme choice to the document root. `system` removes the stamp so the
 *  OS preference (via prefers-color-scheme) drives the palette. */
export function applyTheme(theme: Theme, root: HTMLElement): void {
  if (theme === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", theme);
}

export function systemPrefersDark(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

export function resolveTheme(theme: Theme, prefersDark: boolean): ResolvedTheme {
  if (theme === "system") return prefersDark ? "dark" : "light";
  return theme;
}
