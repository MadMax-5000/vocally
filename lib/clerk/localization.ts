import { arSA } from "@clerk/localizations/ar-SA";
import { enUS } from "@clerk/localizations/en-US";
import { frFR } from "@clerk/localizations/fr-FR";

export function clerkLocalizationForLocale(locale: string) {
  if (locale === "fr") return frFR;
  if (locale === "ar") return arSA;
  return enUS;
}
