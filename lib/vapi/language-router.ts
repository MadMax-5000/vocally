import { VOICE_STACK_CONFIG } from "../voice/voice-stack.config";
import { resolveVoiceNumber, findOrCreateSession, resolveActiveAgent, resolveWelcomeMessage } from "@/lib/twilio/voice/handler";
import { getToolDefinitionsForAgent } from "@/lib/ai/tools/registry";
import { prisma } from "@/lib/db/prisma";
import { voiceBotSystemPromptV1 } from "@/lib/ai/prompts/voice-bot-v1";
import { parseEscalationActionConfig } from "@/lib/deploy/escalation-action";

export async function handleAssistantRequest(message: any) {
  const call = message.call;
  const twilioNumber = call?.phoneNumber?.number;
  const callerNumber = call?.customer?.number;
  const vapiCallId = call?.id;

  let orgId: string | null = null;
  let agentId: string | null = null;

  // 1. Resolve Twilio number to Agent/Org
  if (twilioNumber) {
    const resolved = await resolveVoiceNumber(twilioNumber);
    if (resolved) {
      orgId = resolved.orgId;
      agentId = resolved.agentId;
    }
  }

  if (!orgId) {
    console.error(`[Vapi] Could not resolve orgId for Twilio number: ${twilioNumber}`);
    return { assistant: null };
  }

  if (!agentId) {
    agentId = await resolveActiveAgent(orgId);
  }

  if (!agentId) {
    console.error(`[Vapi] No active voice agent found for orgId: ${orgId}`);
    return { assistant: null };
  }

  // 2. Create or find Session and CallLog
  const { sessionId } = await findOrCreateSession({
    orgId,
    agentId,
    callerNumber: callerNumber || "Unknown",
    callSid: call?.id || "unknown-vapi-call",
  });

  // Track vapiCallId
  await prisma.callLog.update({
    where: { sessionId },
    data: { vapiCallId },
  });

  // 3. Fetch agent info and configs
  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    include: {
      org: { select: { name: true } },
      channels: {
        where: { channel: "VOICE_CALLS" }
      }
    }
  });

  if (!agent) {
    return { assistant: null };
  }

  const escalationConfig = parseEscalationActionConfig(
    (agent.channels[0]?.config as any)?.actions?.escalations
  );

  // 4. Tools
  const tools = getToolDefinitionsForAgent({
    allowCreateTicket: escalationConfig.allowCreateTicketTool !== false,
    includeCollectLeads: false, // Could be parsed from config if needed
    includeCustomForm: false, // Voice relies on verbal collection
  });

  // Add transfer_to_human
  tools.push({
    type: "function",
    function: {
      name: "transfer_to_human",
      description: "Transfer the caller to a live human agent. Use when the customer asks for a person, confidence is low, or the issue cannot be resolved.",
      parameters: {
        type: "object",
        properties: {
          reason: { type: "string", "description": "Brief internal reason" },
          createTicket: { type: "boolean", "description": "Create support ticket before transfer" },
          summary: { type: "string", "description": "One-sentence context for the human agent" }
        },
        required: ["reason"]
      }
    }
  } as any);

  // 5. System Prompt
  let systemPrompt = voiceBotSystemPromptV1({
    agentName: agent.name,
    orgName: agent.org.name,
    instructions: agent.instructions,
    knowledgeContext: "", // We can add RAG retrieval here later if needed
    language: agent.defaultLanguage, 
    toolDefinitions: tools,
  });

  // 6. Language Routing
  const detectedLanguage: string = "en"; // To be improved based on caller context/history
  const isArabicOrDarija = detectedLanguage === "ar" || detectedLanguage === "ary" || agent.defaultLanguage === "ARABIC" || agent.defaultLanguage === "DARIJA";

  let assistantConfig: any = {};

  if (isArabicOrDarija) {
    // Cascaded Pipeline B (AR/Darija)
    assistantConfig = {
      name: `${agent.name} Cascaded (AR)`,
      transcriber: VOICE_STACK_CONFIG.PIPELINES.cascaded.transcriber,
      model: {
        ...VOICE_STACK_CONFIG.PIPELINES.cascaded.model,
        temperature: 0.5,
        maxTokens: 250,
        messages: [{ role: "system", content: systemPrompt }],
        tools: tools,
      },
      voice: {
        ...VOICE_STACK_CONFIG.PIPELINES.cascaded.voice,
        stability: 0.45,
        similarityBoost: 0.8,
      },
      firstMessage: agent.welcomeMessage || "مرحباً، كيف يمكنني مساعدتك؟",
    };
  } else {
    // Realtime Pipeline A (EN/FR)
    assistantConfig = {
      name: `${agent.name} Realtime (EN/FR)`,
      model: {
        ...VOICE_STACK_CONFIG.PIPELINES.realtime.model,
        temperature: 0.6,
        maxTokens: 200,
        messages: [{ role: "system", content: systemPrompt }],
        tools: tools,
      },
      voice: VOICE_STACK_CONFIG.PIPELINES.realtime.voice,
      firstMessage: agent.welcomeMessage || "Hello, how can I help you today?",
    };
  }

  // Update session language
  await prisma.session.update({
    where: { id: sessionId },
    data: { language: detectedLanguage }
  });

  return {
    assistant: {
      ...assistantConfig,
      recordingEnabled: false,
      clientMessages: ["tool-calls", "end-of-call-report", "status-update", "transcript", "hang"],
      serverMessages: ["tool-calls", "end-of-call-report", "status-update", "transcript", "hang"],
      metadata: {
        sessionId,
        orgId,
        agentId,
      }
    }
  };
}
