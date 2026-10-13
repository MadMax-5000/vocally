import localFont from "next/font/local";
import { Inter } from "next/font/google";
import { GeistSans } from "geist/font/sans";

/** Editorial accent for marketing hero middle line. */
export const instrumentSerif = localFont({
  src: "./_fonts/instrument-serif-latin-400-normal.woff2",
  variable: "--font-accent",
  display: "swap",
  weight: "400",
  style: "normal",
});

/** Main UI font — default for headings, navigation, titles, and labels. */
export const geist = GeistSans;

/** Paragraphs, UI components, and buttons. Real italics so font-synthesis can stay off. */
export const inter = Inter({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-inter",
});

/** Class string shared by every root `<html>` so Geist is the base font and all font variables are available. */
export const fontVariables = `${geist.className} ${geist.variable} ${inter.variable} ${instrumentSerif.variable}`;
