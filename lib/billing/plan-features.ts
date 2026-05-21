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

export const PLAN_PRICES: Record<string, { usdCents: number; madCents: number }> = {
  STARTER: { usdCents: 7900, madCents: 79000 },
  PRO: { usdCents: 29900, madCents: 299000 },
};

export const PLAN_META: Record<"STARTER" | "PRO" | "ENTERPRISE", PlanMeta> = {
  STARTER: {
    key: "starter",
    name: "Starter",
    description: "For small businesses getting started with AI-powered customer support.",
    blurb: "Growing teams that need more knowledge capacity and channels.",
    features: [
      { text: "Up to 1 AI agent", included: true },
      { text: "500 call minutes / mo", included: true },
      { text: "2 channels (phone + chat)", included: true },
      { text: "Email support", included: true },
      { text: "Basic analytics dashboard", included: true },
      { text: "AI Co-pilot for live agents", included: false },
      { text: "Custom knowledge base (RAG)", included: false },
      { text: "Priority support", included: false },
    ],
  },
  PRO: {
    key: "pro",
    name: "Pro",
    description: "For scaling contact centers that need advanced capabilities and all channels.",
    blurb: "Production deployments with higher limits and priority workflows.",
    features: [
      { text: "Up to 5 AI agents", included: true },
      { text: "2,000 call minutes / mo", included: true },
      { text: "All channels (phone, chat, WhatsApp, SMS, email)", included: true },
      { text: "Priority support", included: true },
      { text: "Advanced analytics & QA scoring", included: true },
      { text: "AI Co-pilot for live agents", included: true },
      { text: "Custom knowledge base (RAG)", included: true },
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
