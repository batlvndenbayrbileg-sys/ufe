"use client";

import { IconButton } from "./IconButton";
import { useTheme } from "../theme/ThemeProvider";

/** Small sun/moon toggle wired to the ThemeProvider. */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, toggle } = useTheme();
  const isDark = resolvedTheme === "dark";
  return (
    <IconButton
      aria-label={isDark ? "Гэрэлт горимд шилжих" : "Харанхуй горимд шилжих"}
      onClick={toggle}
      className={className}
    >
      <span aria-hidden style={{ fontSize: 16, lineHeight: 1 }}>
        {isDark ? "☀" : "☾"}
      </span>
    </IconButton>
  );
}
