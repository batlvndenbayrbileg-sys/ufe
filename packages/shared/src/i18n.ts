/**
 * Locale primitives shared by the app and any package that renders copy.
 * Mongolian is the SOURCE language; English is a translation (decision D7,
 * docs/blueprint/14-design-system.md §14.6).
 */

export const LOCALES = ["mn", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "mn";

export const LOCALE_LABELS: Record<Locale, string> = {
  mn: "Монгол",
  en: "English",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

export function resolveLocale(value: string | undefined | null): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

/** A string that exists in both locales; `en` optional since `mn` is the source. */
export interface Localized {
  mn: string;
  en?: string;
}

export function pick(text: Localized, locale: Locale): string {
  if (locale === "en" && text.en) return text.en;
  return text.mn;
}
