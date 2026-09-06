import { getAppOrigin } from "@/lib/app-url";
import { getToolDefinitionsForAgent } from "@/lib/ai/tools/registry";
import { voiceBotSystemPromptV1 } from "@/lib/ai/prompts/voice-bot-v1";
import { buildDateTimeContextSection } from "@/lib/ai/prompts/datetime-context";
import { buildGuardrailPromptSection } from "@/lib/agent-security/guardrails";
import { prependRecordingConsent } from "@/lib/agent-security/consent";
import { isExternalCalendarActive, loadCalendarConnection } from "@/lib/calendar/service";
import { resolveBookAppointmentAction } from "@/lib/deploy/book-appointment-action";
import { resolveEscalationAction } from "@/lib/deploy/escalation-action";
import { prisma } from "@/lib/db/prisma";
import { logServerWarning } from "@/lib/logger";
import { getHandoffPhoneNumber } from "@/server/websocket/escalate-call";
import { buildVoiceEscalationPromptSection } from "@/lib/vapi/voice-escalation-prompt";

import type { AssemblyAiAgentPayload } from "./client";
import { createAgent, updateAgent } from "./client";
import { getAssemblyAiToolSecret, isAssemblyAiConfigured } from "./env";
import { listKnowledgeKeyterms } from "./knowledge";
import { usesAssemblyAiVoicePipeline } from "./pipeline";
import { buildAssemblyAiHttpTools, SEARCH_KNOWLEDGE_DEFINITION } from "./tools";
import { resolveAssemblyAiVoice } from "./voices";
import { ensureAssemblyAiWebhookSubscription } from "./webhook-subscription";

type VoiceChannelConfig = {
  greeting?: string;
  language?: string;
  bargeIn?: boolean;
  timeout?: number;
};

function resolvePromptLanguage(phoneLanguage: string | undefined, defaultLanguage: string): {
  promptLanguage: string;
  languageCode: "en" | "fr";
  languageCodes: string[];
} {
  const phone = (phoneLanguage ?? "").toLowerCase();
  if (phone === "fr" || phone === "french" || defaultLanguage === "FRENCH") {
    return { promptLanguage: "French", languageCode: "fr", languageCodes: ["fr"] };
  }
  if (phone === "en" || phone === "english") {
    return { promptLanguage: "English", languageCode: "en", languageCodes: ["en"] };
  }
  return { promptLanguage: "English or French, matching the caller", languageCode: "en", languageCodes: ["en", "fr"] };
}

function resolveGreeting(
  config: VoiceChannelConfig,
  agentName: string,
  welcomeMessage: string | null,
  languageCode: "en" | "fr",
): string {
  if (typeof config.greeting === "string" && config.greeting.trim().length > 0) {
    return config.greeting.replaceAll("{agentName}", agentName).trim();
  }
  if (welcomeMessage?.trim()) return welcomeMessage.trim();
  if (languageCode === "fr") return "Bonjour, comment puis-je vous aider aujourd'hui ?";
  return "Hello, how can I help you today?";
}

export async function buildAssemblyAiAgentPayload(agentId: string): Promise<AssemblyAiAgentPayload | null> {
  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    include: {
      org: { select: { name: true } },
      languages: { select: { language: true } },
      channels: { select: { channel: true, enabled: true, config: true } },
      voices: { select: { voiceId: true, isPrimary: true } },
    },
  });
  if (!agent) return null;

  const voiceChannel = agent.channels.find((c) => c.channel === "VOICE_CALLS");
  const voiceConfig = (voiceChannel?.config ?? {}) as VoiceChannelConfig;

  if (
    !usesAssemblyAiVoicePipeline({
      defaultLanguage: agent.defaultLanguage,
      languages: agent.languages.map((l) => l.language),
      phoneLanguage: voiceConfig.language,
      assemblyAiConfigured: isAssemblyAiConfigured(),
    })
  ) {
    return null;
  }

  const { promptLanguage, languageCode, languageCodes } = resolvePromptLanguage(
    voiceConfig.language,
    agent.defaultLanguage,
  );

  const bookAppointmentAction = resolveBookAppointmentAction(agent.channels);
  const calendarConnection = await loadCalendarConnection(agentId, agent.orgId);
  const escalationConfig = resolveEscalationAction(agent.channels);

  let handoffAvailable = false;
  try {
    await getHandoffPhoneNumber(agentId);
    handoffAvailable = true;
  } catch {
    handoffAvailable = false;
  }

  const toolDefs = getToolDefinitionsForAgent({
    allowCreateTicket: escalationConfig.allowCreateTicketTool,
    includeCollectLeads: false,
    includeCustomForm: false,
    includeBookAppointment: bookAppointmentAction.enabled,
    includeListAvailableSlots: isExternalCalendarActive(
      bookAppointmentAction,
      calendarConnection,
    ),
    includeSecureInput: false,
  });

  const appOrigin = getAppOrigin();
  const bearer = getAssemblyAiToolSecret();
  if (!bearer) {
    throw new Error("ASSEMBLYAI_WEBHOOK_SECRET must be at least 32 characters for HTTP tools");
  }

  const tools = buildAssemblyAiHttpTools({
    appOrigin,
    agentId,
    bearerToken: bearer,
    definitions: toolDefs,
    includeSearchKnowledge: true,
    includeTransferToHuman: handoffAvailable,
  });

  const escalationPrompt = handoffAvailable
    ? buildVoiceEscalationPromptSection(escalationConfig.triggers, handoffAvailable)
    : "";
  const guardrailSection = buildGuardrailPromptSection({
    stayOnTopic: agent.guardrailStayOnTopic,
    refuseSensitive: agent.guardrailRefuseSensitive,
    escalateWhenUnsure: agent.guardrailEscalateWhenUnsure,
  });
  const instructions = [agent.instructions, escalationPrompt, guardrailSection]
    .filter(Boolean)
    .join("\n\n");

  const systemPrompt = voiceBotSystemPromptV1({
    agentName: agent.name,
    orgName: agent.org.name,
    instructions,
    personality: {
      agentType: agent.agentType,
      customRole: agent.customRole,
      tone: agent.tone,
      customTone: agent.customTone,
      description: agent.description,
      websiteUrl: agent.websiteUrl,
    },
    knowledgeContext:
      "Use the search_knowledge tool for company facts, policies, products, and hours. Do not invent details.",
    language: promptLanguage,
    dateTimeContext: buildDateTimeContextSection(bookAppointmentAction.timezone),
    toolDefinitions: [SEARCH_KNOWLEDGE_DEFINITION, ...toolDefs],
    bookAppointment: bookAppointmentAction.enabled ? bookAppointmentAction : undefined,
  });

  const greeting = prependRecordingConsent(
    resolveGreeting(voiceConfig, agent.name, agent.welcomeMessage, languageCode),
    agent.recordingConsentEnabled,
    languageCode,
  );

  const bargeIn = voiceConfig.bargeIn !== false;
  const keyterms = await listKnowledgeKeyterms(agentId);
  const primaryVoice = agent.voices.find((v) => v.isPrimary)?.voiceId;
  const voiceId = resolveAssemblyAiVoice({
    languageCode,
    preferredVoiceId: primaryVoice,
  });

  return {
    name: agent.name.slice(0, 80),
    system_prompt: systemPrompt,
    greeting,
    voice: { voice_id: voiceId },
    input: {
      format: { encoding: "audio/pcmu", sample_rate: 8000 },
      language_codes: languageCodes,
      keyterms: keyterms.length > 0 ? keyterms : undefined,
      turn_detection: { interrupt_response: bargeIn },
    },
    output: {
      voice: voiceId,
      format: { encoding: "audio/pcmu", sample_rate: 8000 },
    },
    tools,
  };
}

export async function syncAssemblyAiAgent(agentId: string): Promise<string | null> {
  if (!isAssemblyAiConfigured()) return null;

  const payload = await buildAssemblyAiAgentPayload(agentId);
  if (!payload) return null;

  const existing = await prisma.agent.findUnique({
    where: { id: agentId },
    select: { assemblyaiAgentId: true },
  });

  let remoteId = existing?.assemblyaiAgentId ?? null;
  if (remoteId) {
    await updateAgent(remoteId, payload);
  } else {
    const created = await createAgent(payload);
    remoteId = created.id;
    await prisma.agent.update({
      where: { id: agentId },
      data: { assemblyaiAgentId: remoteId },
    });
  }

  await ensureAssemblyAiWebhookSubscription();
  return remoteId;
}

export async function maybeSyncAssemblyAiAgent(agentId: string): Promise<void> {
  try {
    await syncAssemblyAiAgent(agentId);
  } catch (err) {
    logServerWarning("[AssemblyAI] Agent sync failed", {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
