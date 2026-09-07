import { getRequestConfig } from "next-intl/server";
import type { AbstractIntlMessages } from "next-intl";
import { cookies } from "next/headers";
import { DEFAULT_LOCALE, resolveLocale } from "@khiye/shared";
import mn from "./messages/mn.json";
import en from "./messages/en.json";

const MESSAGES = { mn, en } as const;

/**
 * Single-locale-per-request config (no locale-prefixed routing yet).
 * Locale is read from a `locale` cookie and defaults to Mongolian.
 * Locale-prefixed routing / the mn⇄en switcher lands with E1/E7.
 */
export default getRequestConfig(async () => {
  const store = await cookies();
  const locale = resolveLocale(store.get("locale")?.value ?? DEFAULT_LOCALE);
  // Cast: next-intl supports arrays (e.g. home.showcaseSlides) at runtime, but
  // its AbstractIntlMessages type only models strings and nested objects.
  return { locale, messages: MESSAGES[locale] as unknown as AbstractIntlMessages };
});
