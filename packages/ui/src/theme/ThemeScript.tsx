import { themeInitScript, THEME_STORAGE_KEY } from "./theme-core";

/**
 * Renders the no-flash theme init script. Place in the document <head>
 * (before body) so the stored theme is applied before first paint.
 * This is a server component — the script string is static.
 */
export function ThemeScript({ storageKey = THEME_STORAGE_KEY }: { storageKey?: string }) {
  return <script dangerouslySetInnerHTML={{ __html: themeInitScript(storageKey) }} />;
}
