import type { AgentTone, AgentType } from "@prisma/client";

export type AgentPersonalityInput = {
  agentType?: AgentType | null;
  customRole?: string | null;
  tone?: AgentTone | null;
  customTone?: string | null;
  description?: string | null;
  websiteUrl?: string | null;
};

const TONE_LABELS: Record<AgentTone, string> = {
  PROFESSIONAL: "professional",
  FRIENDLY: "friendly",
  LUXURY: "luxury",
  FAST_CONCISE: "fast and concise",
  EMPATHETIC: "empathetic",
  ENERGETIC: "energetic",
  CALM: "calm",
  CONFIDENT: "confident",
  CONVERSATIONAL: "conversational",
  FORMAL: "formal",
  SUPPORTIVE: "supportive",
};

const TYPE_LABELS: Record<AgentType, string> = {
  RETAIL_ECOMMERCE: "retail and ecommerce",
  HEALTHCARE_MEDICAL: "healthcare and medical",
  FINANCE_BANKING: "finance and banking",
  REAL_ESTATE: "real estate",
  EDUCATION_TRAINING: "education and training",
  HOSPITALITY_TRAVEL: "hospitality and travel",
  AUTOMOTIVE: "automotive",
  PROFESSIONAL_SERVICES: "professional services",
  TECHNOLOGY_SOFTWARE: "technology and software",
  GOVERNMENT_PUBLIC: "government and public sector",
  FOOD_BEVERAGE: "food and beverage",
  MANUFACTURING: "manufacturing",
  CUSTOM: "custom",
};

export function buildAgentPersonalityPromptSection(
  input: AgentPersonalityInput,
): string {
  const lines: string[] = [];

  const customRole = input.customRole?.trim();
  if (input.agentType === "CUSTOM" && customRole) {
    lines.push(`Your role: ${customRole}.`);
  } else if (input.agentType && input.agentType !== "CUSTOM") {
    lines.push(`You operate in a ${TYPE_LABELS[input.agentType]} context.`);
  }

  const customTone = input.customTone?.trim();
  if (input.tone) {
    const base = `Speak in a ${TONE_LABELS[input.tone]} tone.`;
    lines.push(
      customTone ? `${base} Additional style notes: ${customTone}` : base,
    );
  } else if (customTone) {
    lines.push(`Speaking style: ${customTone}`);
  }

  const description = input.description?.trim();
  if (description) {
    lines.push(`Your main goal: ${description}`);
  }

  const websiteUrl = input.websiteUrl?.trim();
  if (websiteUrl) {
    lines.push(
      `The business website is ${websiteUrl}. Share it when relevant; do not invent other URLs.`,
    );
  }

  if (lines.length === 0) return "";
  return ["## Personality", ...lines].join("\n");
}
