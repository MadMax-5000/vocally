import type { MetadataRoute } from "next";

import { locales } from "@/i18n/config";
import { BRAND_URL } from "@/lib/constants/brand";

const PRIVATE_SEGMENTS = ["dashboard", "onboarding", "sign-in", "sign-up"] as const;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/widget/",
        ...locales.flatMap((locale) =>
          PRIVATE_SEGMENTS.map((segment) => `/${locale}/${segment}`),
        ),
      ],
    },
    sitemap: `${BRAND_URL}/sitemap.xml`,
  };
}
