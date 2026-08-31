import { VOICE_STACK_CONFIG } from "../voice/voice-stack.config";
import {
  resolveVoiceNumber,
  findOrCreateSession,
  resolveActiveAgent,
  getMonthlyCallMinutes,
} from "@/lib/twilio/voice/handler";
import { markForwardingVerified } from "@/lib/twilio/provision-number";
import { getToolDefinitionsForAgent } from "@/lib/ai/tools/registry";
import { prisma } from "@/lib/db/prisma";
import { voiceBotSystemPromptV1 } from "@/lib/ai/prompts/voice-bot-v1";
import { buildDateTimeContextSection } from "@/lib/ai/prompts/datetime-context";
import { resolveBookAppointmentAction } from "@/lib/deploy/book-appointment-action";
import { isExternalCalendarActive, loadCalendarConnection } from "@/lib/calendar/service";
import { resolveEscalationAction } from "@/lib/deploy/escalation-action";
import { getHandoffPhoneNumber } from "@/server/websocket/escalate-call";
import { logServerWarning } from "@/lib/logger";
import { generateEmbedding } from "@/lib/ai/embeddings";
import { similaritySearch } from "@/lib/knowledge/vector-store";

import { buildVoiceEscalationPromptSection } from "./voice-escalation-prompt";
import { buildGuardrailPromptSection } from "@/lib/agent-security/guardrails";
import { prependRecordingConsent } from "@/lib/agent-security/consent";

type VoiceChannelConfig = {
  greeting?: string;
  language?: string;
  bargeIn?: boolean;
  timeout?: number;
  voicemailDetection?: boolean;
  handoffPhone?: string;
};

function mapLanguageCode(
  channelLanguage: string | undefined,
  agentDefault: string,
): { promptLanguage: string; detectedLanguage: string; isArabicOrDarija: boolean } {
  const fromChannel = channelLanguage && channelLanguage !== "auto" ? channelLanguage : null;

  if (fromChannel === "ar" || fromChannel === "arabic") {
    return { promptLanguage: "Arabic", detectedLanguage: "ar", isArabicOrDarija: true };
  }
  if (fromChannel === "ary" || fromChannel === "darija") {
    return { promptLanguage: "Darija", detectedLanguage: "ary", isArabicOrDarija: true };
  }
  if (fromChannel === "fr" || fromChannel === "french") {
    return { promptLanguage: "French", detectedLanguage: "fr", isArabicOrDarija: false };
  }
  if (fromChannel === "en" || fromChannel === "english") {
    return { promptLanguage: "English", detectedLanguage: "en", isArabicOrDarija: false };
  }

  const detectedLanguage =
    agentDefault === "ARABIC"
      ? "ar"
      : agentDefault === "DARIJA"
        ? "ary"
        : agentDefault === "FRENCH"
          ? "fr"
          : "en";

  const promptLanguage =
    detectedLanguage === "ar"
      ? "Arabic"
      : detectedLanguage === "ary"
        ? "Darija"
        : detectedLanguage === "fr"
          ? "French"
          : "English";

  return {
    promptLanguage,
    detectedLanguage,
    isArabicOrDarija: detectedLanguage === "ar" || detectedLanguage === "ary",
  };
}

function resolveGreeting(
  config: VoiceChannelConfig,
  agentName: string,
  welcomeMessage: string | null,
  detectedLanguage: string,
): string {
  if (typeof config.greeting === "string" && config.greeting.trim().length > 0) {
    return config.greeting.replaceAll("{agentName}", agentName).trim();
  }
  if (welcomeMessage?.trim()) return welcomeMessage.trim();

  if (detectedLanguage === "ar" || detectedLanguage === "ary") {
    return "مرحباً، كيف يمكنني مساعدتك؟";
  }
  if (detectedLanguage === "fr") {
    return "Bonjour, comment puis-je vous aider aujourd'hui ?";
  }
  return "Hello, how can I help you today?";
}

async function retrieveVoiceKnowledgeContext(params: {
  orgId: string;
  agentId: string;
  seedQuery: string;
}): Promise<string> {
  try {
    const agentDocs = await prisma.agentKnowledgeDoc.findMany({
      where: { agentId: params.agentId },
      select: { knowledgeDocId: true },
    });
    const attachedDocIds = agentDocs.map((d) => d.knowledgeDocId);

    const { embedding } = await generateEmbedding(params.seedQuery);
    let results = await similaritySearch(embedding, params.orgId, 5, 0.7, attachedDocIds);

    if (results.length === 0 && attachedDocIds.length > 0) {
      results = await similaritySearch(embedding, params.orgId, 5, 0.55, attachedDocIds);
    }

    if (results.length === 0) return "";
    return results.map((r) => `[${r.docTitle}] ${r.content}`).join("\n\n");
  } catch (err) {
    logServerWarning("[Vapi] Voice knowledge retrieval failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return "";
  }
}

export async function handleAssistantRequest(message: {
  call?: {
    id?: string;
    phoneNumber?: { number?: string };
    customer?: { number?: string };
  };
}) {
  const call = message.call;
  const twilioNumber = call?.phoneNumber?.number;
  const callerNumber = call?.customer?.number;
  const vapiCallId = call?.id;

  let orgId: string | null = null;
  let agentId: string | null = null;

  if (twilioNumber) {
    const resolved = await resolveVoiceNumber(twilioNumber);
    if (resolved) {
      orgId = resolved.orgId;
      agentId = resolved.agentId;
    }
  }

  if (!orgId) {
    logServerWarning(`[Vapi] Could not resolve orgId for phone number: ${twilioNumber}`, {
      twilioNumber: twilioNumber ?? "unknown",
    });
    return { assistant: null };
  }

  const { used, max } = await getMonthlyCallMinutes(orgId);
  if (max !== Infinity && used >= max) {
    logServerWarning(`[Vapi] Monthly call minute limit reached for orgId: ${orgId}`, {
      orgId,
      used,
      max,
    });
    return { assistant: null };
  }

  if (!agentId) {
    agentId = await resolveActiveAgent(orgId);
  }

  if (!agentId) {
    logServerWarning(`[Vapi] No active voice agent found for orgId: ${orgId}`, { orgId });
    return { assistant: null };
  }

  const { sessionId } = await findOrCreateSession({
    orgId,
    agentId,
    callerNumber: callerNumber || "Unknown",
    callSid: call?.id || "unknown-vapi-call",
    vapiCallId: vapiCallId ?? null,
  });

  if (twilioNumber) {
    try {
      await markForwardingVerified(twilioNumber);
    } catch (err) {
      logServerWarning("[Vapi] Failed to mark forwarding verified", {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    include: {
      org: { select: { name: true } },
      channels: { select: { channel: true, enabled: true, config: true } },
    },
  });

  if (!agent) {
    return { assistant: null };
  }

  const voiceChannel = agent.channels.find((c) => c.channel === "VOICE_CALLS");
  const voiceConfig = (voiceChannel?.config ?? {}) as VoiceChannelConfig;

  const { promptLanguage, detectedLanguage, isArabicOrDarija } = mapLanguageCode(
    voiceConfig.language,
    agent.defaultLanguage,
  );

  const firstMessage = prependRecordingConsent(
    resolveGreeting(
      voiceConfig,
      agent.name,
      agent.welcomeMessage,
      detectedLanguage,
    ),
    agent.recordingConsentEnabled,
    detectedLanguage,
  );

  const bargeIn = voiceConfig.bargeIn !== false;
  const silenceTimeoutSeconds =
    typeof voiceConfig.timeout === "number" && voiceConfig.timeout > 0
      ? Math.min(Math.max(voiceConfig.timeout, 5), 60)
      : 15;

  const escalationConfig = resolveEscalationAction(agent.channels);
  const bookAppointmentAction = resolveBookAppointmentAction(agent.channels);
  const calendarConnection = await loadCalendarConnection(agentId, orgId);

  // Voice transfer depends on Phone settings handoff number (or HANDOFF_PHONE_NUMBER),
  // not Web Chat escalations.
  let handoffAvailable = false;
  try {
    await getHandoffPhoneNumber(agentId);
    handoffAvailable = true;
  } catch {
    handoffAvailable = false;
  }
  const handoffActive = handoffAvailable;

  const tools = getToolDefinitionsForAgent({
    allowCreateTicket: escalationConfig.allowCreateTicketTool,
    includeCollectLeads: false,
    includeCustomForm: false,
    includeBookAppointment: bookAppointmentAction.enabled,
    includeListAvailableSlots: isExternalCalendarActive(
      bookAppointmentAction,
      calendarConnection,
    ),
  });

  if (handoffActive && handoffAvailable) {
    tools.push({
      type: "function",
      function: {
        name: "transfer_to_human",
        description:
          "Transfer the caller to a live human agent. Use when escalation rules apply or the customer asks for a person.",
        parameters: {
          type: "object",
          properties: {
            reason: {
              type: "string",
              description: "Brief internal reason for the transfer",
            },
          },
          required: ["reason"],
        },
      },
    });
  }

  const escalationPrompt = handoffActive
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

  const knowledgeContext = await retrieveVoiceKnowledgeContext({
    orgId,
    agentId,
    seedQuery: `${agent.name}. ${agent.instructions?.slice(0, 400) ?? ""}`,
  });

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
    knowledgeContext,
    language: promptLanguage,
    dateTimeContext: buildDateTimeContextSection(bookAppointmentAction.timezone),
    toolDefinitions: tools,
    bookAppointment: bookAppointmentAction.enabled ? bookAppointmentAction : undefined,
  });

  const interruptionSettings = bargeIn
    ? { numWordsToInterruptAssistant: 2 }
    : { numWordsToInterruptAssistant: 100 };

  let assistantConfig: Record<string, unknown> = {};

  if (isArabicOrDarija) {
    assistantConfig = {
      name: `${agent.name} Cascaded (AR)`,
      transcriber: VOICE_STACK_CONFIG.PIPELINES.cascaded.transcriber,
      model: {
        ...VOICE_STACK_CONFIG.PIPELINES.cascaded.model,
        temperature: 0.5,
        maxTokens: 250,
        messages: [{ role: "system", content: systemPrompt }],
        tools,
      },
      voice: {
        ...VOICE_STACK_CONFIG.PIPELINES.cascaded.voice,
        stability: 0.45,
        similarityBoost: 0.8,
      },
      firstMessage,
      silenceTimeoutSeconds,
      ...interruptionSettings,
      voicemailDetectionEnabled: voiceConfig.voicemailDetection === true,
    };
  } else {
    assistantConfig = {
      name: `${agent.name} Realtime (EN/FR)`,
      model: {
        ...VOICE_STACK_CONFIG.PIPELINES.realtime.model,
        temperature: 0.6,
        maxTokens: 200,
        messages: [{ role: "system", content: systemPrompt }],
        tools,
      },
      voice: VOICE_STACK_CONFIG.PIPELINES.realtime.voice,
      firstMessage,
      silenceTimeoutSeconds,
      ...interruptionSettings,
      voicemailDetectionEnabled: voiceConfig.voicemailDetection === true,
    };
  }

  await prisma.session.update({
    where: { id: sessionId },
    data: { language: detectedLanguage },
  });

  return {
    assistant: {
      ...assistantConfig,
      recordingEnabled: agent.saveRecordings,
      clientMessages: [
        "tool-calls",
        "end-of-call-report",
        "status-update",
        "transcript",
        "hang",
      ],
      serverMessages: [
        "tool-calls",
        "end-of-call-report",
        "status-update",
        "transcript",
        "hang",
      ],
      metadata: {
        sessionId,
        orgId,
        agentId,
      },
    },
  };
}
