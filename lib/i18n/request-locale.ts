import { defaultLocale, locales, type Locale } from "@/i18n/config";

export function getRequestLocale(headers: Headers): Locale {
  const locale = headers.get("cookie")
    ?.match(/(?:^|;\s*)NEXT_LOCALE=([^;]+)/)?.[1];

  return locale && locales.includes(locale as Locale)
    ? (locale as Locale)
    : defaultLocale;
}
