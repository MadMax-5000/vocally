import { prisma } from "@/lib/db/prisma";
import { summarizeSession } from "@/lib/ai/summarize-session";
import { logServerWarning } from "@/lib/logger";

export async function handleEndOfCallReport(message: any) {
  const call = message.call;
  const artifact = message.artifact;
  const vapiCallId = call?.id;

  if (!vapiCallId) return;

  const callLog = await prisma.callLog.findUnique({
    where: { vapiCallId },
    select: { sessionId: true, orgId: true }
  });

  if (!callLog) return;

  const sessionId = callLog.sessionId;

  const endedReason = message.endedReason;
  const transcript = artifact?.transcript || "";
  const durationSeconds = message.durationSeconds || 0;
  const cost = message.cost || 0;
  const messages = artifact?.messages || [];
  const recordingUrl = artifact?.recording?.url || null;

  // Save transcript and duration
  await prisma.callLog.update({
    where: { sessionId },
    data: {
      transcript,
      duration: durationSeconds,
      cost,
      recordingUrl
    }
  });

  // Save message history to Session
  // Typically we might want to store messages if we didn't store them in real-time
  // In Vapi, we get them all at the end
  if (messages && messages.length > 0) {
    for (const msg of messages) {
      if (msg.role !== 'system') {
        await prisma.message.create({
          data: {
            sessionId,
            role: msg.role === 'assistant' ? 'BOT' : 'USER',
            content: msg.message || ""
          }
        });
      }
    }
  }

  // Update VapiCallMetadata
  await prisma.vapiCallMetadata.upsert({
    where: { vapiCallId },
    create: {
      vapiCallId,
      sessionId,
      pipelineMode: "vapi_ended",
      endedReason,
      costBreakdown: message.costBreakdown || null,
      transferOutcome: endedReason === "transfer" ? "success" : null
    },
    update: {
      endedReason,
      costBreakdown: message.costBreakdown || null,
      transferOutcome: endedReason === "transfer" ? "success" : null
    }
  });

  // Summarize
  try {
    await summarizeSession(sessionId);
  } catch (e) {
    logServerWarning(`[Vapi Observability] Failed to summarize session ${sessionId}`, {
      error: e instanceof Error ? e.message : String(e),
    });
  }
}

export async function logVapiEvent(message: any) {
  // For status-update, transcript, hang
  const callId = message.call?.id;
  if (!callId) return;

  if (message.type === "hang") {
    logServerWarning(`[Vapi Observability] Call hung: ${callId}`, { message });
  } else if (message.type === "status-update") {
    if (message.status === "ended") {
      // Handled by end-of-call-report
    } else if (message.status === "failed") {
      logServerWarning(`[Vapi Observability] Call failed: ${callId}`, { message });
    }
  } else if (message.type === "transcript") {
    // We could parse partial transcripts or detect language changes here
  }
}
