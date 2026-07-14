import { VOICE_STACK_CONFIG } from "../voice/voice-stack.config";
import {
  resolveVoiceNumber,
  findOrCreateSession,
  resolveActiveAgent,
} from "@/lib/twilio/voice/handler";
import { getToolDefinitionsForAgent } from "@/lib/ai/tools/registry";
import { prisma } from "@/lib/db/prisma";
import { voiceBotSystemPromptV1 } from "@/lib/ai/prompts/voice-bot-v1";
import { resolveBookAppointmentAction } from "@/lib/deploy/book-appointment-action";
import { resolveEscalationAction } from "@/lib/deploy/escalation-action";
import { getHandoffPhoneNumber } from "@/server/websocket/escalate-call";
import { logServerWarning } from "@/lib/logger";

import { buildVoiceEscalationPromptSection } from "./voice-escalation-prompt";

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
    logServerWarning(`[Vapi] Could not resolve orgId for phone number: ${twilioNumber}`, { twilioNumber: twilioNumber ?? "unknown" });
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
  });

  await prisma.callLog.update({
    where: { sessionId },
    data: { vapiCallId },
  });

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

  const escalationConfig = resolveEscalationAction(agent.channels);
  const bookAppointmentAction = resolveBookAppointmentAction(agent.channels);
  const handoffActive = agent.handoffEnabled && escalationConfig.enabled;

  let handoffAvailable = false;
  if (handoffActive) {
    try {
      await getHandoffPhoneNumber(agentId);
      handoffAvailable = true;
    } catch {
      handoffAvailable = false;
    }
  }

  const tools = getToolDefinitionsForAgent({
    allowCreateTicket: escalationConfig.allowCreateTicketTool,
    includeCollectLeads: false,
    includeCustomForm: false,
    includeBookAppointment: bookAppointmentAction.enabled,
    bookAppointmentDepartments: bookAppointmentAction.departments,
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

  const instructions = [agent.instructions, escalationPrompt].filter(Boolean).join("\n\n");

  const systemPrompt = voiceBotSystemPromptV1({
    agentName: agent.name,
    orgName: agent.org.name,
    instructions,
    knowledgeContext: "",
    language: agent.defaultLanguage,
    toolDefinitions: tools,
    bookAppointment: bookAppointmentAction.enabled
      ? bookAppointmentAction
      : undefined,
  });

  const detectedLanguage: string =
    agent.defaultLanguage === "ARABIC"
      ? "ar"
      : agent.defaultLanguage === "DARIJA"
        ? "ary"
        : agent.defaultLanguage === "FRENCH"
          ? "fr"
          : "en";
  const isArabicOrDarija =
    detectedLanguage === "ar" || detectedLanguage === "ary";

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
      firstMessage:
        agent.welcomeMessage ||
        (detectedLanguage === "ar" || detectedLanguage === "ary"
          ? "مرحباً، كيف يمكنني مساعدتك؟"
          : detectedLanguage === "fr"
            ? "Bonjour, comment puis-je vous aider aujourd'hui ?"
            : "Hello, how can I help you today?"),
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
      firstMessage:
        agent.welcomeMessage ||
        (detectedLanguage === "fr"
          ? "Bonjour, comment puis-je vous aider aujourd'hui ?"
          : "Hello, how can I help you today?"),
    };
  }

  await prisma.session.update({
    where: { id: sessionId },
    data: { language: detectedLanguage },
  });

  return {
    assistant: {
      ...assistantConfig,
      recordingEnabled: true,
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
