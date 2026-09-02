import { Inter, JetBrains_Mono } from "next/font/google";

/**
 * Cyrillic is a first-class constraint (docs/blueprint/14 §14.3). Both faces
 * cover Mongolian Cyrillic including Ө/ө and Ү/ү. Self-hosted by next/font —
 * no runtime request to Google from Mongolian networks.
 */
export const inter = Inter({
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
  variable: "--font-inter",
  display: "swap",
});

export const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin", "cyrillic"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});
