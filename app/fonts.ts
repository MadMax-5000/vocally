import localFont from "next/font/local";

/** Self-hosted so compile does not fetch Google Fonts (times out / aborts off-network). */
export const inter = localFont({
  src: "./_fonts/inter-latin-wght-normal.woff2",
  variable: "--font-inter",
  display: "swap",
  weight: "100 900",
});

/** Editorial italic accent for marketing hero middle line. */
export const instrumentSerif = localFont({
  src: "./_fonts/instrument-serif-latin-400-italic.woff2",
  variable: "--font-accent",
  display: "swap",
  weight: "400",
  style: "italic",
});
