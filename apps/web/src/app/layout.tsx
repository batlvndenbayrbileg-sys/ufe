import type { ReactNode } from "react";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { ThemeProvider, ThemeScript } from "@khiye/ui";
import "@khiye/ui/styles/tokens.css";
import { inter, jetbrainsMono } from "./fonts";

export const metadata: Metadata = {
  title: "Хийе",
  description:
    "Interactive, Mongolian-language programming education. Build a real e-commerce app, yourself.",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body>
        <ThemeScript />
        <ThemeProvider defaultTheme="system">
          <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
