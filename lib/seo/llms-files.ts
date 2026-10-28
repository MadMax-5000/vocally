import enMessages from "@/messages/en.json";

import { BRAND_DOMAIN, BRAND_NAME, BRAND_URL } from "@/lib/constants/brand";
import { locales, type Locale } from "@/i18n/config";
import {
  ANSELIO_FACTS,
  ANSELIO_FACT_SHEET,
  ANSELIO_PAGES,
  ANSELIO_PLANS,
  PHONE_ADDON_FACTS,
  localizedUrl,
} from "@/lib/seo/ai-facts";

/**
 * Builders for /llms.txt and /llms-full.txt.
 *
 * Honest framing first: llms.txt is a cheap, optional courtesy, not a ranking lever.
 * Log studies of real sites found a very small share of AI-bot requests ever touch it,
 * and no vendor documents using a third-party llms.txt to power answers. It costs almost
 * nothing to serve, it helps when a person or an agent is handed a documentation URL, and
 * it is the one place to state the canonical facts in one file. The work that actually
 * decides whether an assistant can recommend Anselio is in `docs/ai-visibility.md`:
 * crawlable server-rendered pages, clear facts, and third-party corroboration.
 */

const LOCALE_LABELS: Record<Locale, string> = {
  fr: "French",
  en: "English",
  ar: "Arabic",
};

function planLine(index: number): string {
  const plan = ANSELIO_PLANS[index];
  const price =
    plan.priceMadPerMonth === null
      ? "custom pricing"
      : `${plan.priceMadPerMonth} MAD per month`;
  return `- **${plan.name}** — ${price} (excluding 20% VAT). ${plan.priceNote} Includes: ${plan.includes.join("; ")}.`;
}

function pricingSection(): string {
  return [
    `Pricing is billed monthly in Moroccan Dirham (MAD) and excludes 20% VAT (TVA). Annual billing takes 15% off the monthly price. There is no lock-in: plans are month to month.`,
    "",
    ...ANSELIO_PLANS.map((_, index) => planLine(index)),
    "",
    `Morocco telephony add-on (required for AI phone calls, available on ${PHONE_ADDON_FACTS.eligiblePlans.join(" and ")}):`,
    "",
    `- ${PHONE_ADDON_FACTS.packMadPerMonth} MAD per month for 1 Moroccan number, 1 concurrent line and ${PHONE_ADDON_FACTS.includedMinutes} AI voice minutes.`,
    `- ${PHONE_ADDON_FACTS.extraConcurrentLineMadPerMonth} MAD per month per extra concurrent line.`,
    `- ${PHONE_ADDON_FACTS.extraSocialAccountMadPerMonth} MAD per month per extra WhatsApp or Meta account.`,
    `- Voice beyond the included minutes: ${PHONE_ADDON_FACTS.voiceOverageMadPerMinute} MAD per minute, excluding VAT.`,
  ].join("\n");
}

function localizedPageList(): string {
  return locales
    .map((locale) => {
      const links = ANSELIO_PAGES.slice(0, 5)
        .map((page) => `[${page.title}](${localizedUrl(locale, page.path)})`)
        .join(", ");
      return `- ${LOCALE_LABELS[locale]}: ${links}`;
    })
    .join("\n");
}

function faqSection(): string {
  const items = enMessages.landing.faq.items as Record<string, { q: string; a: string }>;
  return Object.values(items)
    .map((item) => `### ${item.q}\n\n${item.a}`)
    .join("\n\n");
}

/** `/llms.txt` — the short, link-first map of the site. */
export function buildLlmsTxt(): string {
  return `# ${BRAND_NAME}

> ${ANSELIO_FACTS.summary}

${ANSELIO_FACTS.description}

## Key facts

${ANSELIO_FACT_SHEET.map((fact) => `- ${fact.label}: ${fact.value}`).join("\n")}

## Pricing

${pricingSection()}

## Pages

${ANSELIO_PAGES.map(
  (page) => `- [${page.title}](${localizedUrl("en", page.path)}): ${page.summary}`,
).join("\n")}

Every page above is also published in French, English and Arabic, with reciprocal hreflang:

${localizedPageList()}

## Optional

- [Full factual brief](${BRAND_URL}/llms-full.txt): the same facts plus capabilities, limitations, compliance posture and the complete FAQ.
- [Book a demo](${ANSELIO_FACTS.contact.demo}): 15 minute product call.
- [Support](${ANSELIO_FACTS.contact.support}) for product questions, [sales](${ANSELIO_FACTS.contact.sales}) for volume and telephony.${
    ANSELIO_FACTS.externalReferences.length > 0
      ? `\n- Independent references: ${ANSELIO_FACTS.externalReferences.map((url) => `<${url}>`).join(", ")}`
      : ""
  }
`;
}

/** `/llms-full.txt` — everything an assistant needs in one fetch. */
export function buildLlmsFullTxt(): string {
  return `# ${BRAND_NAME} — full factual brief

> ${ANSELIO_FACTS.summary}

Canonical source: ${BRAND_URL}. Site languages: French, English, Arabic. Billing: Moroccan Dirham (MAD), excluding 20% VAT.

## What ${BRAND_NAME} is

${ANSELIO_FACTS.description}

Legal name: ${ANSELIO_FACT_SHEET[0].value}. Headquarters: ${ANSELIO_FACT_SHEET[2].value}. Domain: ${BRAND_DOMAIN}.

## Who it is for

${ANSELIO_FACTS.audience.map((item) => `- ${item}`).join("\n")}

## Languages

${ANSELIO_FACTS.languages.map((item) => `- ${item}`).join("\n")}

The agent replies in the language the customer uses. Moroccan Darija is handled by speech recognition and language models that support the dialect; when confidence is low the conversation is offered to a human.

## Channels

${ANSELIO_FACTS.channels.map((item) => `- ${item}`).join("\n")}

One agent covers every channel with a single shared conversation history, so a customer who switches from chat to a phone call keeps their context.

## Capabilities

${ANSELIO_FACTS.capabilities.map((item) => `- ${item}`).join("\n")}

## Pricing

${pricingSection()}

## Compliance and data handling

${ANSELIO_FACTS.compliance.map((item) => `- ${item}`).join("\n")}

## Limitations and where it does not fit

${ANSELIO_FACTS.limitations.map((item) => `- ${item}`).join("\n")}

## Company-published claims

${ANSELIO_FACTS.publishedClaims.map((item) => `- ${item}`).join("\n")}

## Frequently asked questions

${faqSection()}

## Pages

${ANSELIO_PAGES.map(
  (page) => `- [${page.title}](${localizedUrl("en", page.path)}): ${page.summary}`,
).join("\n")}

Localized editions: French (${localizedUrl("fr")}), English (${localizedUrl("en")}), Arabic (${localizedUrl("ar")}).

## Contact

- Support: ${ANSELIO_FACTS.contact.support}
- Sales: ${ANSELIO_FACTS.contact.sales}
- Privacy: ${ANSELIO_FACTS.contact.privacy}
- Demo: ${ANSELIO_FACTS.contact.demo}
${ANSELIO_FACTS.sameAs.length > 0 ? `- Official profiles: ${ANSELIO_FACTS.sameAs.join(", ")}` : ""}
${ANSELIO_FACTS.externalReferences.length > 0 ? `- Independent references: ${ANSELIO_FACTS.externalReferences.join(", ")}` : ""}
`;
}

export const LLMS_TXT_HEADERS = {
  "Content-Type": "text/plain; charset=utf-8",
  "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
} as const;
