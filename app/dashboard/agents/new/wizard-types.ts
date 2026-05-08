import type {
  AgentChannelType,
  AgentTone,
  CreativityLevel,
  SupportedLanguage,
} from "@prisma/client";

export const ONBOARDING_STEP_ORDER = [
  "start",
  "tone",
  "creativity",
  "languages",
  "channels",
  "knowledge",
  "complete",
] as const;

export type OnboardingStep = (typeof ONBOARDING_STEP_ORDER)[number];

export type WizardFormState = {
  step: OnboardingStep;
  tone: AgentTone | null;
  toneIsCustom: boolean;
  customTone: string;
  creativity: CreativityLevel | null;
  languages: SupportedLanguage[];
  channels: AgentChannelType[];
  knowledgeDocIds: string[];
  name: string;
  website: string;
  description: string;
  handoffEnabled: boolean;
};

export const initialWizardState: WizardFormState = {
  step: "start",
  tone: null,
  toneIsCustom: false,
  customTone: "",
  creativity: null,
  languages: [],
  channels: [],
  knowledgeDocIds: [],
  name: "",
  website: "",
  description: "",
  handoffEnabled: true,
};
