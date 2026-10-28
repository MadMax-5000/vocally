import type { MetadataRoute } from "next";

import { locales } from "@/i18n/config";
import { BRAND_URL } from "@/lib/constants/brand";
import { AI_AGENTS, ALLOW_AI_TRAINING } from "@/lib/seo/ai-crawlers";

const PRIVATE_SEGMENTS = ["dashboard", "onboarding", "sign-in", "sign-up"] as const;

const PRIVATE_PATHS: string[] = [
  "/api/",
  "/widget/",
  ...locales.flatMap((locale) =>
    PRIVATE_SEGMENTS.map((segment) => `/${locale}/${segment}`),
  ),
];

/**
 * robots.txt with an explicit AI/answer-engine policy.
 *
 * The marketing pages are the product's public facts. Assistants can only quote them if
 * the crawler behind that assistant is allowed, so every documented answer-engine token
 * is listed by name rather than left to the wildcard: an explicit group also survives
 * being merged with a managed robots.txt prepended at the CDN edge.
 *
 * Roles and the reasoning behind each token live in `lib/seo/ai-crawlers.ts`, and the
 * operational checklist (including Cloudflare's Bot Preference Sync, which prepends its
 * own block that disallows several of these tokens) is in `docs/ai-visibility.md`.
 */
export default function robots(): MetadataRoute.Robots {
  const rules: MetadataRoute.Robots["rules"] = [
    {
      // Crawlers that index or fetch pages for AI answers, plus training crawlers when
      // the policy allows them.
      userAgent: AI_AGENTS.filter(
        (agent) => agent.role !== "training" || ALLOW_AI_TRAINING,
      ).map((agent) => agent.token),
      allow: "/",
      disallow: PRIVATE_PATHS,
    },
    // When training is opted out, say so for each token instead of leaving it to the
    // wildcard, which allows everything else.
    ...(ALLOW_AI_TRAINING
      ? []
      : [
          {
            userAgent: AI_AGENTS.filter((agent) => agent.role === "training").map(
              (agent) => agent.token,
            ),
            disallow: "/",
          },
        ]),
    {
      userAgent: "*",
      allow: "/",
      disallow: PRIVATE_PATHS,
    },
  ];

  return {
    rules,
    sitemap: `${BRAND_URL}/sitemap.xml`,
  };
}
