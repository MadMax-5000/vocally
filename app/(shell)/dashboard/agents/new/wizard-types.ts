import type {
  AgentChannelType,
  AgentTone,
  AgentType,
  CreativityLevel,
  SupportedLanguage,
} from "@prisma/client";

import {
  getAgentTemplateById,
  type AgentTemplate,
} from "@/lib/templates/agent-templates";

export const ONBOARDING_STEP_ORDER = [
  "start",
  "tone",
  "creativity",
  "languages",
  "knowledge",
  "complete",
] as const;

export type OnboardingStep = (typeof ONBOARDING_STEP_ORDER)[number];

export type WizardFormState = {
  step: OnboardingStep;
  templateId: string | null;
  tone: AgentTone | null;
  toneIsCustom: boolean;
  customTone: string;
  creativity: CreativityLevel | null;
  languages: SupportedLanguage[];
  knowledgeDocIds: string[];
  name: string;
  website: string;
  description: string;
  handoffEnabled: boolean;
  agentType: AgentType | null;
  channels: AgentChannelType[];
  defaultLanguage: SupportedLanguage | null;
  instructions: string;
  welcomeMessage: string;
};

export const initialWizardState: WizardFormState = {
  step: "start",
  templateId: null,
  tone: null,
  toneIsCustom: false,
  customTone: "",
  creativity: null,
  languages: [],
  knowledgeDocIds: [],
  name: "",
  website: "",
  description: "",
  handoffEnabled: true,
  agentType: null,
  channels: [],
  defaultLanguage: null,
  instructions: "",
  welcomeMessage: "",
};

function wizardStateFromTemplate(template: AgentTemplate): WizardFormState {
  const { defaults } = template;
  return {
    step: "complete",
    templateId: template.id,
    tone: defaults.tone,
    toneIsCustom: false,
    customTone: "",
    creativity: defaults.creativity,
    languages: [...defaults.languages],
    knowledgeDocIds: [],
    name: defaults.nameSuggestion,
    website: "",
    description: defaults.description,
    handoffEnabled: defaults.handoffEnabled,
    agentType: defaults.agentType,
    channels: [...defaults.channels],
    defaultLanguage: defaults.defaultLanguage,
    instructions: defaults.instructions,
    welcomeMessage: defaults.welcomeMessage,
  };
}

export function getInitialWizardState(templateId?: string | null): WizardFormState {
  if (!templateId) return initialWizardState;
  const template = getAgentTemplateById(templateId);
  if (!template) return initialWizardState;
  return wizardStateFromTemplate(template);
}
