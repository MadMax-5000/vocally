import type { MetadataRoute } from "next";

import { locales } from "@/i18n/config";
import { BRAND_URL } from "@/lib/constants/brand";
import {
  PUBLIC_SITEMAP_PATHS,
  absoluteLanguageAlternates,
  localizedPath,
} from "@/lib/seo/metadata";

export default function sitemap(): MetadataRoute.Sitemap {
  return locales.flatMap((locale) =>
    PUBLIC_SITEMAP_PATHS.map((path) => ({
      url: `${BRAND_URL}${localizedPath(locale, path)}`,
      alternates: {
        languages: absoluteLanguageAlternates(path),
      },
    })),
  );
}
