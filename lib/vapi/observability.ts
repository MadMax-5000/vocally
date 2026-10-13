import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { summarizeSession } from "@/lib/ai/summarize-session";
import { logServerWarning } from "@/lib/logger";
import { PhoneLineState } from "@prisma/client";
import { isFailureReason, recordLineHealth } from "@/lib/phone/health-check";
import {
  maybeRedactPii,
  maskKeypadEntries,
} from "@/lib/agent-security/pii";

type EndOfCallReportMessage = {
  call?: { id?: string };
  artifact?: {
    transcript?: string;
    messages?: Array<{ role?: string; message?: string }>;
    recording?: { url?: string };
  };
  endedReason?: string;
  durationSeconds?: number;
  cost?: number;
  costBreakdown?: unknown;
};

export async function handleEndOfCallReport(message: EndOfCallReportMessage) {
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

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    select: {
      agent: {
        select: { id: true, saveRecordings: true, piiRedactionEnabled: true },
      },
    },
  });
  const saveRecordings = session?.agent?.saveRecordings !== false;
  const redact = session?.agent?.piiRedactionEnabled === true;

  const endedReason = message.endedReason;
  // Always mask caller keypad entries (PINs/card codes) before persisting.
  const transcript = maskKeypadEntries(
    maybeRedactPii(artifact?.transcript || "", redact),
  );
  const durationSeconds = message.durationSeconds || 0;
  const cost = message.cost || 0;
  const messages = artifact?.messages || [];
  const recordingUrl = saveRecordings
    ? artifact?.recording?.url || null
    : null;

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

  // Only store BOT messages here — USER messages are stored in real-time
  // by the escalation-handler to avoid duplicates.
  if (messages && messages.length > 0) {
    for (const msg of messages) {
      if (msg.role === 'assistant' && msg.message) {
        await prisma.message.create({
          data: {
            sessionId,
            role: 'BOT',
            content: maskKeypadEntries(maybeRedactPii(msg.message, redact)),
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
      costBreakdown: (message.costBreakdown as Prisma.InputJsonValue) ?? Prisma.JsonNull,
      transferOutcome: endedReason === "transfer" ? "success" : null
    },
    update: {
      endedReason,
      costBreakdown: (message.costBreakdown as Prisma.InputJsonValue) ?? Prisma.JsonNull,
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

  // Record line health (near-real-time founder alert)
  try {
    if (endedReason) {
      const state: PhoneLineState = isFailureReason(endedReason) ? "FAILING" : "HEALTHY";
      await recordLineHealth({
        orgId: callLog.orgId,
        agentId: session?.agent?.id ?? null,
        state,
        reason: state === "FAILING" ? endedReason : undefined,
      });
    }
  } catch (err) {
    // Non-critical — health check cron also covers this
    logServerWarning(`[Vapi Observability] health-record failed ${vapiCallId}`, {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

type VapiEventMessage = {
  type?: string;
  call?: { id?: string };
  status?: string;
};

export async function logVapiEvent(message: VapiEventMessage) {
  // For status-update, transcript, hang
  const callId = message.call?.id;
  if (!callId) return;

  if (message.type === "hang") {
    logServerWarning(`[Vapi Observability] Call hung: ${callId}`, { callId });
  } else if (message.type === "status-update") {
    if (message.status === "ended") {
      // Handled by end-of-call-report
    } else if (message.status === "failed") {
      logServerWarning(`[Vapi Observability] Call failed: ${callId}`, { callId, status: message.status });

      // Near-real-time health update on provider failure
      try {
        const failedCall = await prisma.callLog.findUnique({
          where: { vapiCallId: callId },
          select: {
            orgId: true,
            session: { select: { agentId: true } },
          },
        });
        if (failedCall) {
          await recordLineHealth({
            orgId: failedCall.orgId,
            agentId: failedCall.session?.agentId ?? null,
            state: "FAILING",
            reason: "status-update:failed",
          });
        }
      } catch {
        // non-critical
      }
    }
  } else if (message.type === "transcript") {
    // We could parse partial transcripts or detect language changes here
  }
}
