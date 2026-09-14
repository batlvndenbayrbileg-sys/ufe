import type { ReactNode } from "react";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { ThemeProvider, ThemeScript } from "@khiye/ui";
import "@khiye/ui/styles/tokens.css";
import "./content-guard.css";
import { inter, jetbrainsMono } from "./fonts";
import { Providers } from "./Providers";
import { ContentGuard } from "./ContentGuard";

export const metadata: Metadata = {
  title: "UFE ISMD",
  description:
    "Interactive, Mongolian-language programming education. Build a real e-commerce app, yourself.",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    // ThemeScript sets data-theme on <html> before hydration from the stored
    // preference, which the server can't know — so the attribute legitimately
    // differs on first paint. Suppress the (expected) hydration warning here.
    <html
      lang={locale}
      className={`${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body>
        <ThemeScript />
        <ContentGuard />
        <ThemeProvider defaultTheme="system">
          <Providers>
            <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
