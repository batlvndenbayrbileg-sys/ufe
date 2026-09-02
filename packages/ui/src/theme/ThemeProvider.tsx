"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  applyTheme,
  resolveTheme,
  systemPrefersDark,
  THEME_STORAGE_KEY,
  type ResolvedTheme,
  type Theme,
} from "./theme-core";

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export interface ThemeProviderProps {
  children: ReactNode;
  /** Default when nothing is stored. `/learn` overrides this to "dark". */
  defaultTheme?: Theme;
  storageKey?: string;
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = THEME_STORAGE_KEY,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [prefersDark, setPrefersDark] = useState(false);

  // Hydrate from storage + subscribe to OS preference changes.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored === "light" || stored === "dark" || stored === "system") {
        setThemeState(stored);
      }
    } catch {
      /* private mode / blocked storage — keep default */
    }
    setPrefersDark(systemPrefersDark());

    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) => setPrefersDark(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [storageKey]);

  // Reflect the choice onto <html>.
  useEffect(() => {
    applyTheme(theme, document.documentElement);
  }, [theme]);

  const setTheme = useCallback(
    (next: Theme) => {
      setThemeState(next);
      try {
        localStorage.setItem(storageKey, next);
      } catch {
        /* ignore */
      }
    },
    [storageKey],
  );

  const resolvedTheme = resolveTheme(theme, prefersDark);

  const toggle = useCallback(() => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }, [resolvedTheme, setTheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, resolvedTheme, setTheme, toggle }),
    [theme, resolvedTheme, setTheme, toggle],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within <ThemeProvider>");
  return ctx;
}
