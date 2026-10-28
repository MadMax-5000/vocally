import { BRAND_EMAILS, BRAND_LEGAL_ADDRESS, BRAND_LEGAL_NAME, BRAND_NAME, BRAND_URL } from "@/lib/constants/brand";
import { PLAN_PRICES } from "@/lib/billing/plan-features";
import { locales, type Locale } from "@/i18n/config";
import { ANSELIO_FACTS, localizedUrl } from "@/lib/seo/ai-facts";

/**
 * Structured data for the marketing pages.
 *
 * What schema is and is not worth here, so nobody re-derives it later: Google states
 * plainly that AI Overviews and AI Mode need no special markup, and there is no evidence
 * that FAQPage or SoftwareApplication markup independently raises how often an LLM cites
 * a page. Markup earns its place by making the facts machine-readable and unambiguous -
 * the same name, URL, price and language everywhere - and by keeping eligibility for the
 * Search features that do read it. That is worth doing, and it is not a silver bullet.
 *
 * Rules for this file:
 *  - Prices come from the billing constants, never retyped.
 *  - Only claim what is visible on the site: no review or aggregateRating markup until
 *    there are real, and real numbers behind it.
 */

const ORGANIZATION_ID = `${BRAND_URL}/#organization`;
const WEBSITE_ID = `${BRAND_URL}/#website`;
const SOFTWARE_ID = `${BRAND_URL}/#software`;

const HREFLANG_LANGUAGES = locales as unknown as Locale[];

function logoObject() {
  return {
    "@type": "ImageObject",
    url: `${BRAND_URL}/images/logo-primary-color.png`,
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: BRAND_NAME,
    legalName: BRAND_LEGAL_NAME,
    alternateName: "Anselio AI",
    url: BRAND_URL,
    logo: logoObject(),
    description: ANSELIO_FACTS.summary,
    email: BRAND_EMAILS.contact,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Casablanca",
      addressCountry: "MA",
      streetAddress: BRAND_LEGAL_ADDRESS,
    },
    areaServed: {
      "@type": "Country",
      name: "Morocco",
    },
    knowsLanguage: [...ANSELIO_FACTS.languages],
    contactPoint: [
      {
        "@type": "ContactPoint",
        email: BRAND_EMAILS.contact,
        contactType: "customer support",
        areaServed: "MA",
        availableLanguage: ["ar", "fr", "en"],
      },
      {
        "@type": "ContactPoint",
        email: BRAND_EMAILS.sales,
        contactType: "sales",
        areaServed: "MA",
        availableLanguage: ["ar", "fr", "en"],
      },
    ],
    ...(ANSELIO_FACTS.sameAs.length > 0 ? { sameAs: [...ANSELIO_FACTS.sameAs] } : {}),
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: BRAND_NAME,
    url: BRAND_URL,
    description: ANSELIO_FACTS.summary,
    inLanguage: HREFLANG_LANGUAGES,
    publisher: { "@id": ORGANIZATION_ID },
  };
}

function planOffers(locale: string) {
  const pricedPlans = [
    { name: "Free", cents: PLAN_PRICES.FREE.madCents },
    { name: "Starter", cents: PLAN_PRICES.STARTER.madCents },
    { name: "Pro", cents: PLAN_PRICES.PRO.madCents },
  ];

  return pricedPlans.map((plan) => ({
    "@type": "Offer",
    name: `${BRAND_NAME} ${plan.name}`,
    price: (plan.cents / 100).toFixed(2),
    priceCurrency: "MAD",
    url: localizedUrl(locale, "/pricing"),
    availability: "https://schema.org/InStock",
    priceSpecification: {
      "@type": "UnitPriceSpecification",
      price: (plan.cents / 100).toFixed(2),
      priceCurrency: "MAD",
      unitCode: "MON",
    },
  }));
}

/**
 * Localized software entity. Enterprise is intentionally absent from the offers array:
 * it has no published price, and inventing one would be worse than omitting it.
 */
export function softwareApplicationJsonLd(locale: string = "en") {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": SOFTWARE_ID,
    name: BRAND_NAME,
    description: ANSELIO_FACTS.description,
    applicationCategory: "BusinessApplication",
    applicationSubCategory: "AI customer service",
    operatingSystem: "Web",
    url: localizedUrl(locale, "/"),
    inLanguage: HREFLANG_LANGUAGES,
    featureList: [...ANSELIO_FACTS.capabilities],
    screenshot: `${BRAND_URL}/images/og-default.png`,
    publisher: { "@id": ORGANIZATION_ID },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "MAD",
      lowPrice: "0.00",
      offerCount: 3,
      offers: planOffers(locale),
    },
  };
}

export function faqPageJsonLd(items: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };
}

export function breadcrumbJsonLd(
  locale: string,
  trail: { name: string; path: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: localizedUrl(locale, crumb.path),
    })),
  };
}
