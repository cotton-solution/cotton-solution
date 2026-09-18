import { Inter, IBM_Plex_Mono } from "next/font/google";

/** UI text. */
export const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

/**
 * Every money figure in the product is set in this face. A mono
 * ledger face keeps columns of digits aligned and separates "a
 * number you can act on" from ordinary interface text.
 */
export const figureFont = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-figure",
});

export const fontVariables = `${inter.variable} ${figureFont.variable}`;
