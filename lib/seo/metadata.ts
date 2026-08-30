import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { defaultLocale, locales, type Locale } from "@/i18n/config";
import { BRAND_NAME, BRAND_URL } from "@/lib/constants/brand";

export const SITE_METADATA_BASE = new URL(BRAND_URL);
export const OG_IMAGE_PATH = "/images/og-default.png";
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

export const PUBLIC_SITEMAP_PATHS = [
  "/",
  "/pricing",
  "/contact",
  "/contact/sales",
  "/privacy",
  "/terms",
  "/cookies",
] as const;

export type PublicMetadataKey =
  | "home"
  | "pricing"
  | "contact"
  | "sales"
  | "privacy"
  | "terms"
  | "cookies";

const OG_LOCALE: Record<Locale, string> = {
  fr: "fr_FR",
  en: "en_US",
  ar: "ar_MA",
};

const PATH_BY_KEY: Record<PublicMetadataKey, string> = {
  home: "/",
  pricing: "/pricing",
  contact: "/contact",
  sales: "/contact/sales",
  privacy: "/privacy",
  terms: "/terms",
  cookies: "/cookies",
};

export const noIndexMetadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export function localizedPath(locale: string, path: string): string {
  if (path === "/" || path === "") {
    return `/${locale}`;
  }
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `/${locale}${normalized}`;
}

export function languageAlternates(path: string): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const locale of locales) {
    languages[locale] = localizedPath(locale, path);
  }
  languages["x-default"] = localizedPath(defaultLocale, path);
  return languages;
}

export function absoluteLanguageAlternates(path: string): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const [lang, pathname] of Object.entries(languageAlternates(path))) {
    languages[lang] = new URL(pathname, SITE_METADATA_BASE).toString();
  }
  return languages;
}

function ogImage() {
  return {
    url: OG_IMAGE_PATH,
    width: OG_IMAGE_WIDTH,
    height: OG_IMAGE_HEIGHT,
    alt: BRAND_NAME,
  };
}

export function pageMetadata({
  locale,
  path,
  title,
  description,
  absoluteTitle = false,
}: {
  locale: string;
  path: string;
  title: string;
  description: string;
  absoluteTitle?: boolean;
}): Metadata {
  const pathname = localizedPath(locale, path);
  const url = new URL(pathname, SITE_METADATA_BASE).toString();
  const ogLocale = OG_LOCALE[locale as Locale] ?? OG_LOCALE.en;
  const resolvedTitle = absoluteTitle ? title : `${title} | ${BRAND_NAME}`;
  const image = ogImage();

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: {
      canonical: pathname,
      languages: languageAlternates(path),
    },
    openGraph: {
      type: "website",
      siteName: BRAND_NAME,
      locale: ogLocale,
      url,
      title: resolvedTitle,
      description,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: resolvedTitle,
      description,
      images: [OG_IMAGE_PATH],
    },
  };
}

export async function localizedPageMetadata(
  locale: string,
  key: PublicMetadataKey,
): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "metadata" });
  return pageMetadata({
    locale,
    path: PATH_BY_KEY[key],
    title: t(`${key}.title`),
    description: t(`${key}.description`),
    absoluteTitle: key === "home",
  });
}
