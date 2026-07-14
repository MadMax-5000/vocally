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

/** Maximum phone numbers an org can provision per plan. */
export const MAX_PHONE_NUMBERS: Record<"FREE" | "STARTER" | "PRO" | "ENTERPRISE", number> = {
  FREE: 0,
  STARTER: 1,
  PRO: 3,
  ENTERPRISE: Infinity,
};

export const PLAN_PRICES: Record<string, { madCents: number }> = {
  FREE: { madCents: 0 },
  STARTER: { madCents: 99999 },
  PRO: { madCents: 399999 },
};

// Original hardcoded data (used for fallbacks or unlocalized contexts)
export const PLAN_META: Record<"FREE" | "STARTER" | "PRO" | "ENTERPRISE", PlanMeta> = {
  FREE: {
    key: "free",
    name: "Free",
    description: "Try Anselio with 50 minutes of AI call handling — no credit card required.",
    blurb: "Get started with a 14-day free trial.",
    features: [
      { text: "1 AI agent", included: true },
      { text: "50 call minutes / mo", included: true },
      { text: "Chat channel only", included: true },
      { text: "Basic analytics dashboard", included: false },
      { text: "Knowledge base (RAG)", included: false },
      { text: "Email support", included: false },
    ],
  },
  STARTER: {
    key: "starter",
    name: "Starter",
    description: "For small businesses getting started with AI-powered customer support.",
    blurb: "Growing teams that need more knowledge capacity and channels.",
    features: [
      { text: "Up to 3 AI agents", included: true },
      { text: "2,000 call minutes / mo", included: true },
      { text: "2 channels (phone + chat)", included: true },
      { text: "Knowledge base (50MB storage)", included: true },
      { text: "Basic analytics dashboard", included: true },
      { text: "Email support", included: true },
      { text: "AI Co-pilot for live agents", included: false },
      { text: "Priority support", included: false },
    ],
  },
  PRO: {
    key: "pro",
    name: "Pro",
    description: "For scaling contact centers that need advanced capabilities and all channels.",
    blurb: "Production deployments with higher limits and priority workflows.",
    features: [
      { text: "Up to 8 AI agents", included: true },
      { text: "10,000 call minutes / mo", included: true },
      { text: "All channels (phone, chat, WhatsApp, SMS, email)", included: true },
      { text: "Knowledge base (500MB storage)", included: true },
      { text: "Advanced analytics & QA scoring", included: true },
      { text: "AI Co-pilot for live agents", included: true },
      { text: "Priority support", included: true },
      { text: "SSO & audit logs", included: false },
    ],
  },
  ENTERPRISE: {
    key: "enterprise",
    name: "Enterprise",
    description: "For large organizations with custom compliance, security, and scale requirements.",
    blurb: "Custom contracts, compliance, and dedicated support for large contact centers.",
    features: [
      { text: "Unlimited AI agents", included: true },
      { text: "Custom call minutes", included: true },
      { text: "All channels + custom integrations", included: true },
      { text: "Dedicated support & success manager", included: true },
      { text: "Custom SLAs & compliance (Law 09-08)", included: true },
      { text: "On-premise deployment option", included: true },
      { text: "SSO, audit logs & advanced security", included: true },
      { text: "Custom AI model fine-tuning", included: true },
    ],
  },
};
