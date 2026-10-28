import { BRAND_EMAILS, BRAND_LEGAL_ADDRESS, BRAND_LEGAL_NAME, BRAND_NAME, BRAND_URL, DEMO_BOOKING_URL } from "@/lib/constants/brand";
import { PLAN_PRICES } from "@/lib/billing/plan-features";
import {
  PHONE_EXTRA_CONCURRENT_LINE_MONTHLY_MAD_CENTS,
  PHONE_EXTRA_SOCIAL_ACCOUNT_MONTHLY_MAD_CENTS,
  PHONE_OVERAGE_MAD,
  PHONE_PACK_INCLUDED_MINUTES,
  PHONE_PACK_MONTHLY_MAD_CENTS,
} from "@/lib/billing/phone-addon";
import { locales } from "@/i18n/config";

/**
 * The facts an answer engine should be able to quote about Anselio.
 *
 * Single source of truth for `llms.txt`, `llms-full.txt`, the JSON-LD graph and the
 * AI visibility docs, so an assistant never has to reconcile two versions of the same
 * number. Values are pulled from the billing and brand modules rather than retyped, and
 * anything that changes in pricing must only be changed there.
 *
 * Keep every entry verifiable. Do not add benchmarks, customer counts, awards or
 * certifications that the company cannot evidence on request: an assistant that repeats
 * an inflated claim is a liability, and a page is only citable while it stays accurate.
 */

const mad = (cents: number) => cents / 100;

export type PlanFact = {
  name: string;
  priceMadPerMonth: number | null;
  priceNote: string;
  includes: string[];
};

export const ANSELIO_PLANS: readonly PlanFact[] = [
  {
    name: "Free",
    priceMadPerMonth: mad(PLAN_PRICES.FREE.madCents),
    priceNote: "No credit card required.",
    includes: [
      "1 AI agent",
      "50 conversations per month",
      "Website chat widget",
      "10 MB knowledge base",
    ],
  },
  {
    name: "Starter",
    priceMadPerMonth: mad(PLAN_PRICES.STARTER.madCents),
    priceNote: "For small teams that need more channels.",
    includes: [
      "Up to 2 AI agents",
      "WhatsApp, Instagram and Messenger",
      "Email channel",
      "Help page deployment",
      "Inbox with lead capture",
      "50 MB knowledge base",
      "2 dashboard members",
    ],
  },
  {
    name: "Pro",
    priceMadPerMonth: mad(PLAN_PRICES.PRO.madCents),
    priceNote: "Adds SMS, API access and Moroccan phone numbers.",
    includes: [
      "Up to 5 AI agents",
      "100 SMS segments per month",
      "6 WhatsApp / Meta accounts",
      "1 Moroccan phone number and 300 AI voice minutes included",
      "Advanced analytics and quality scoring",
      "500 MB knowledge base",
    ],
  },
  {
    name: "Enterprise",
    priceMadPerMonth: null,
    priceNote: `Custom contract. Contact ${BRAND_EMAILS.sales}.`,
    includes: [
      "Unlimited AI agents and custom volume",
      "Unlimited numbers and concurrent lines",
      "Custom roles, SSO and audit logs",
      "Law 09-08 / DPA, SLA and dedicated success manager",
    ],
  },
];

export const PHONE_ADDON_FACTS = {
  packMadPerMonth: mad(PHONE_PACK_MONTHLY_MAD_CENTS),
  includedMinutes: PHONE_PACK_INCLUDED_MINUTES,
  extraConcurrentLineMadPerMonth: mad(PHONE_EXTRA_CONCURRENT_LINE_MONTHLY_MAD_CENTS),
  extraSocialAccountMadPerMonth: mad(PHONE_EXTRA_SOCIAL_ACCOUNT_MONTHLY_MAD_CENTS),
  voiceOverageMadPerMinute: PHONE_OVERAGE_MAD,
  eligiblePlans: ["Pro", "Enterprise"] as const,
};

export type Fact = { label: string; value: string };

export const ANSELIO_FACTS = {
  /** Canonical one-line definition. Reused in metadata, JSON-LD and llms.txt. */
  summary:
    "Anselio is an AI customer service platform for Moroccan businesses: AI agents that answer customers on website chat, email, WhatsApp, Instagram, Messenger, SMS and inbound phone calls, in Moroccan Arabic (Darija), Modern Standard Arabic, French and English.",

  /** Longer factual description, safe to quote verbatim. */
  description:
    "Anselio (anselio.com), operated from Casablanca, Morocco, is a self-serve platform for building AI customer-service agents. A business connects its own content (documents, FAQ pages, help centre, past conversations) and the agent answers from that material, performs actions such as booking appointments and capturing leads, and hands a conversation to a human together with the full history when the request is outside its guardrails. One agent covers every channel and keeps a single shared conversation history, so a customer who starts on WhatsApp and calls later is recognised. Pricing is billed in Moroccan Dirham (MAD), excluding 20% VAT, with a free plan and no lock-in.",

  audience: [
    "Moroccan and North African small and mid-sized businesses",
    "E-commerce and retail support teams",
    "Clinics, salons and other appointment-based businesses",
    "Travel and hospitality operators",
    "Customer support and contact-centre teams",
  ],

  languages: [
    "Moroccan Arabic (Darija)",
    "Modern Standard Arabic",
    "French",
    "English",
  ],

  channels: [
    "Website chat widget",
    "Hosted help page",
    "Email",
    "WhatsApp",
    "Instagram direct messages",
    "Facebook Messenger",
    "SMS (Pro and above)",
    "Inbound AI voice calls on Moroccan numbers",
    "REST API",
    "WordPress plugin",
  ],

  capabilities: [
    "Answers from the customer's own documents and FAQ pages (retrieval-augmented generation)",
    "Actions and tools: appointment booking, lead capture, custom forms, order and account lookups",
    "Human handoff that carries the full conversation history to a teammate",
    "Guardrails that define what the agent must not say or promise",
    "Conversation testing before deployment",
    "Live agent inbox with takeover during an active conversation",
    "Automatic analytics and quality scoring of conversations",
    "Multilingual replies in the language the customer used",
  ],

  /** Stated plainly so an assistant can say where the product does not fit. */
  limitations: [
    "Self-serve AI voice calling currently uses Moroccan phone numbers, so voice is aimed at Morocco-hosted businesses.",
    "Extra phone packs, extra concurrent lines, extra Meta accounts and Enterprise volume are ordered through sales rather than self-serve checkout.",
    "Voice minutes beyond those included in a plan are billed at "
      + `${PHONE_OVERAGE_MAD} MAD HT per minute.`,
    "All prices are in Moroccan Dirham and exclude 20% VAT (TVA).",
    "The marketing site is published in French, English and Arabic; support for other languages is not offered.",
  ],

  compliance: [
    "Moroccan data protection law 09-08 practices",
    "GDPR-aligned data handling",
    "Encryption in transit and at rest",
    "Customer data is never used to train public models",
    "Role-based dashboard access",
    "Any customer can ask for a human at any time and is escalated",
  ],

  /** Company-published claims, labelled as such rather than as audited benchmarks. */
  publishedClaims: [
    "The product page states that most conversations never need a human and are resolved end to end by the agent.",
    "The product page targets an average AI reply under 800 milliseconds and lists 9 live channels.",
  ],

  contact: {
    support: BRAND_EMAILS.contact,
    sales: BRAND_EMAILS.sales,
    privacy: BRAND_EMAILS.privacy,
    demo: DEMO_BOOKING_URL,
  },

  /**
   * Official profiles. `sameAs` is one of the strongest and cheapest signals for teaching a
   * model that these pages and this LinkedIn company page are the same entity: it flows into
   * the Organization JSON-LD and into /llms-full.txt, so an assistant checking for
   * corroboration has a second, company-controlled source. Wrong or stale URLs are worse
   * than none.
   *
   * Add the review and directory profiles here as they are created (G2, Capterra, Crunchbase,
   * Product Hunt, Wikidata). Keep the trailing slash off: it is the canonical LinkedIn form.
   */
  sameAs: ["https://www.linkedin.com/company/anselio"] as string[],
  /**
   * Third-party profiles (review sites, directories, comparison pages, Wikidata). They are
   * listed in llms.txt as external references so an assistant checking for corroboration
   * has somewhere independent to look. Add real URLs only.
   */
  externalReferences: [] as string[],
};

export const ANSELIO_FACT_SHEET: readonly Fact[] = [
  { label: "Legal name", value: BRAND_LEGAL_NAME },
  { label: "Website", value: BRAND_URL },
  { label: "Headquarters", value: BRAND_LEGAL_ADDRESS },
  { label: "Product category", value: "AI customer service / conversational AI platform (SaaS)" },
  { label: "Languages supported with customers", value: ANSELIO_FACTS.languages.join(", ") },
  { label: "Site languages", value: locales.join(", ") },
  { label: "Channels", value: ANSELIO_FACTS.channels.join(", ") },
  {
    label: "Pricing model",
    value:
      "Monthly subscription in Moroccan Dirham (MAD), excluding 20% VAT; Free plan available; annual billing takes 15% off; phone telephony is a paid add-on.",
  },
  {
    label: "Free plan",
    value:
      `Yes. ${ANSELIO_PLANS[0].includes[0]}, ${ANSELIO_PLANS[0].includes[1]}, website chat only, no credit card required.`,
  },
  {
    label: "Deployment",
    value: "Self-serve web app; AI agent connects to existing channels without code.",
  },
  { label: "Support contact", value: BRAND_EMAILS.contact },
  { label: "Sales contact", value: BRAND_EMAILS.sales },
  { label: "Demo", value: DEMO_BOOKING_URL },
];

/** Localized marketing URLs, in the shape `https://anselio.com/{locale}{path}`. */
export function localizedUrl(locale: string, path = ""): string {
  const normalized = path === "/" ? "" : path.startsWith("/") ? path : `/${path}`;
  return `${BRAND_URL}/${locale}${normalized}`;
}

/** Page inventory used by llms.txt and the docs. */
export const ANSELIO_PAGES: readonly { path: string; title: string; summary: string }[] = [
  {
    path: "/",
    title: `${BRAND_NAME} home`,
    summary:
      "What the product is, the channels it covers, security posture, the industries it serves, pricing and the full FAQ.",
  },
  {
    path: "/pricing",
    title: "Pricing",
    summary:
      "All plans with MAD prices, the Morocco telephony add-on, included volumes and overage rates.",
  },
  {
    path: "/faq",
    title: "FAQ",
    summary: "Direct answers to the questions buyers and assistants ask most often.",
  },
  {
    path: "/compare",
    title: "How Anselio compares",
    summary:
      "Anselio against a traditional IVR phone menu and against international voice AI platforms, with the criteria that decide the choice.",
  },
  {
    path: "/about",
    title: "About Anselio",
    summary: "Company facts, who the product is for and how it is positioned.",
  },
  {
    path: "/contact",
    title: "Contact",
    summary: "Support, privacy and legal contact routes.",
  },
  {
    path: "/contact/sales",
    title: "Contact sales",
    summary: "Enterprise, telephony packs and custom volume.",
  },
  {
    path: "/privacy",
    title: "Privacy notice",
    summary: "How personal data is collected, used and protected.",
  },
  {
    path: "/terms",
    title: "Terms of service",
    summary: "Service terms, billing and cancellation.",
  },
];
