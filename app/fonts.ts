import localFont from "next/font/local";

/** Editorial accent for marketing hero middle line. */
export const instrumentSerif = localFont({
  src: "./_fonts/instrument-serif-latin-400-normal.woff2",
  variable: "--font-accent",
  display: "swap",
  weight: "400",
  style: "normal",
});
