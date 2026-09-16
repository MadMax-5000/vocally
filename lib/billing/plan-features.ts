export type PlanFeature = {
  text: string;
  included: boolean;
};

export type PlanMeta = {
  key: string;
  name: string;
  description: string;
  blurb: string;
  features: PlanFeature[];
};

export type PlanId = "FREE" | "STARTER" | "PRO" | "ENTERPRISE";

/** Number(s) included in the plan. Pro ships one Moroccan number (Téléphonie Maroc); extra packs are sales-led. */
export const MAX_PHONE_NUMBERS: Record<PlanId, number> = {
  FREE: 0,
  STARTER: 0,
  PRO: 1,
  ENTERPRISE: Infinity,
};

/** Maximum AI agents an org can create per plan. */
export const MAX_AGENTS: Record<PlanId, number> = {
  FREE: 1,
  STARTER: 2,
  PRO: 5,
  ENTERPRISE: Infinity,
};

/** Conversations (customer sessions) included per month; overage is billed at cost per 100. */
export const MAX_CONVERSATIONS: Record<PlanId, number> = {
  FREE: 50,
  STARTER: 500,
  PRO: 2_000,
  ENTERPRISE: Infinity,
};

/** WhatsApp / Instagram / Messenger (Zernio) accounts included. Extra accounts are 100 MAD/mo each, sales-led. */
export const MAX_SOCIAL_ACCOUNTS: Record<PlanId, number> = {
  FREE: 0,
  STARTER: 3,
  PRO: 6,
  ENTERPRISE: Infinity,
};

/** SMS segments included per month; overage billed at pass-through cost. */
export const MAX_SMS_SEGMENTS: Record<PlanId, number> = {
  FREE: 0,
  STARTER: 0,
  PRO: 100,
  ENTERPRISE: Infinity,
};

export const ANALYTICS_ENABLED: Record<PlanId, boolean> = {
  FREE: false,
  STARTER: true,
  PRO: true,
  ENTERPRISE: true,
};

export const SMS_ENABLED: Record<PlanId, boolean> = {
  FREE: false,
  STARTER: false,
  PRO: true,
  ENTERPRISE: true,
};

export const EMAIL_CHANNEL_ENABLED: Record<PlanId, boolean> = {
  FREE: false,
  STARTER: true,
  PRO: true,
  ENTERPRISE: true,
};

export const QA_SCORING_ENABLED: Record<PlanId, boolean> = {
  FREE: false,
  STARTER: false,
  PRO: true,
  ENTERPRISE: true,
};

/**
 * AI voice minutes included in the plan. Pro ships 300 with its number;
 * extra packs add 300 each (sales-led).
 */
export const MAX_CALL_MINUTES: Record<PlanId, number> = {
  FREE: 0,
  STARTER: 0,
  PRO: 300,
  ENTERPRISE: Infinity,
};

/** Public SaaS prices in MAD centimes, HT. */
export const PLAN_PRICES: Record<string, { madCents: number }> = {
  FREE: { madCents: 0 },
  STARTER: { madCents: 100_000 },
  PRO: { madCents: 300_000 },
};

// Fallback copy when i18n is unavailable
export const PLAN_META: Record<PlanId, PlanMeta> = {
  FREE: {
    key: "free",
    name: "Free",
    description: "Try Anselio on your website — no credit card required.",
    blurb: "Get started with free website chat.",
    features: [
      { text: "1 AI agent", included: true },
      { text: "50 conversations / mo", included: true },
      { text: "Website chat only", included: true },
      { text: "Knowledge base (10 MB)", included: true },
      { text: "WhatsApp and social channels", included: false },
      { text: "Morocco telephony", included: false },
    ],
  },
  STARTER: {
    key: "starter",
    name: "Starter",
    description: "For small businesses that need AI on chat, WhatsApp, social, and email.",
    blurb: "Growing teams that need more channels, members, and conversations.",
    features: [
      { text: "Up to 2 AI agents", included: true },
      { text: "Website chat + help page", included: true },
      { text: "WhatsApp, Instagram, Messenger", included: true },
      { text: "Email channel", included: true },
      { text: "Knowledge base (50 MB)", included: true },
      { text: "Inbox and lead capture", included: true },
      { text: "2 dashboard members", included: true },
      { text: "Morocco telephony", included: false },
    ],
  },
  PRO: {
    key: "pro",
    name: "Pro",
    description: "For teams that need SMS, API, and their own AI phone number.",
    blurb: "Production contact centers; one Moroccan number and 300 voice minutes included.",
    features: [
      { text: "Everything in Starter", included: true },
      { text: "Up to 5 AI agents", included: true },
      { text: "Email channel + API", included: true },
      { text: "100 SMS segments / mo", included: true },
      { text: "6 WhatsApp / Meta accounts", included: true },
      { text: "1 Moroccan number + 300 AI voice minutes", included: true },
      { text: "Advanced analytics + 500 MB knowledge base", included: true },
    ],
  },
  ENTERPRISE: {
    key: "enterprise",
    name: "Enterprise",
    description: "Custom volume, compliance, and dedicated support.",
    blurb: "Custom contracts for larger contact centers and multi-number phone.",
    features: [
      { text: "Unlimited AI agents", included: true },
      { text: "Custom volume and billing", included: true },
      { text: "Unlimited numbers and concurrent lines", included: true },
      { text: "Custom roles, SSO, and audit logs", included: true },
      { text: "Law 09-08 / DPA, SLA, and CSM", included: true },
      { text: "Dedicated success manager", included: true },
    ],
  },
};
