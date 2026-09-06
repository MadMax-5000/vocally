import { prisma } from "@/lib/db/prisma";
import { summarizeSession } from "@/lib/ai/summarize-session";
import { maybeRedactPii } from "@/lib/agent-security/pii";
import { logServerWarning } from "@/lib/logger";
import { markForwardingVerified } from "@/lib/twilio/provision-number";
import {
  findOrCreateSession,
  resolveVoiceNumber,
} from "@/lib/twilio/voice/handler";
import { normalizeE164 } from "@/lib/telephony/e164";

import { getSession } from "./client";
import type { AssemblyAiCallPayload, AssemblyAiSessionPayload } from "./webhooks";

type TimelineTurn = {
  user_transcript?: string | null;
  agent_text?: string | null;
  status?: string;
};

type TimelineArtifact = {
  turns?: TimelineTurn[];
};

async function resolveAgentByAssemblyAiId(assemblyaiAgentId: string | undefined): Promise<{
  id: string;
  orgId: string;
} | null> {
  if (!assemblyaiAgentId) return null;
  return prisma.agent.findUnique({
    where: { assemblyaiAgentId },
    select: { id: true, orgId: true },
  });
}

export async function handleAssemblyAiCallConnected(call: AssemblyAiCallPayload): Promise<void> {
  const toNumber = call.to_number ? normalizeE164(call.to_number) : null;
  const fromNumber = call.from_number ? normalizeE164(call.from_number) : "Unknown";

  let orgId: string | null = null;
  let agentId: string | null = null;

  if (toNumber) {
    const resolved = await resolveVoiceNumber(toNumber);
    if (resolved) {
      orgId = resolved.orgId;
      agentId = resolved.agentId;
    }
  }

  if (!agentId) {
    const byRemote = await resolveAgentByAssemblyAiId(call.agent_id);
    if (byRemote) {
      orgId = byRemote.orgId;
      agentId = byRemote.id;
    }
  }

  if (!orgId || !agentId) {
    logServerWarning("[AssemblyAI] call.connected could not resolve agent", {});
    return;
  }

  await findOrCreateSession({
    orgId,
    agentId,
    callerNumber: fromNumber,
    callSid: call.call_id,
    assemblyaiSessionId: call.session_id ?? null,
    assemblyaiCallId: call.call_id,
  });

  if (toNumber) {
    try {
      await markForwardingVerified(toNumber);
    } catch (err) {
      logServerWarning("[AssemblyAI] Failed to mark forwarding verified", {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
}

export async function handleAssemblyAiSessionCompleted(
  session: AssemblyAiSessionPayload,
): Promise<void> {
  const callLog = await prisma.callLog.findUnique({
    where: { assemblyaiSessionId: session.session_id },
    select: { sessionId: true },
  });
  if (!callLog) {
    logServerWarning("[AssemblyAI] session.completed with no CallLog", {});
    return;
  }

  const dbSession = await prisma.session.findUnique({
    where: { id: callLog.sessionId },
    select: {
      agent: { select: { saveRecordings: true, piiRedactionEnabled: true } },
    },
  });
  const saveRecordings = dbSession?.agent?.saveRecordings !== false;
  const redact = dbSession?.agent?.piiRedactionEnabled === true;

  let transcript = "";
  let recordingUrl: string | null = null;
  const messages: Array<{ role: "USER" | "BOT"; content: string }> = [];

  try {
    const remote = await getSession(session.session_id);
    const artifacts = remote.artifacts ?? [];
    const audio = artifacts.find((a) => a.type === "audio");
    const timeline = artifacts.find((a) => a.type === "timeline");
    if (saveRecordings && audio?.url) recordingUrl = audio.url;

    if (timeline?.url) {
      const res = await fetch(timeline.url);
      if (res.ok) {
        const body = (await res.json()) as TimelineArtifact;
        for (const turn of body.turns ?? []) {
          if (turn.user_transcript) {
            messages.push({
              role: "USER",
              content: maybeRedactPii(turn.user_transcript, redact),
            });
          }
          if (turn.agent_text) {
            messages.push({
              role: "BOT",
              content: maybeRedactPii(turn.agent_text, redact),
            });
          }
        }
        transcript = maybeRedactPii(
          messages.map((m) => `${m.role}: ${m.content}`).join("\n"),
          redact,
        );
      }
    }
  } catch (err) {
    logServerWarning("[AssemblyAI] Failed to load session artifacts", {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  const duration = Math.round(session.duration_seconds ?? 0);

  await prisma.callLog.update({
    where: { sessionId: callLog.sessionId },
    data: {
      transcript,
      duration,
      recordingUrl,
    },
  });

  if (messages.length > 0) {
    const existingCount = await prisma.message.count({
      where: { sessionId: callLog.sessionId },
    });
    if (existingCount === 0) {
      await prisma.message.createMany({
        data: messages.map((m) => ({
          sessionId: callLog.sessionId,
          role: m.role,
          content: m.content,
        })),
      });
    }
  }

  await prisma.session.update({
    where: { id: callLog.sessionId },
    data: {
      status: "RESOLVED",
      endedAt: session.ended_at ? new Date(session.ended_at) : new Date(),
    },
  });

  try {
    await summarizeSession(callLog.sessionId);
  } catch (err) {
    logServerWarning("[AssemblyAI] Failed to summarize session", {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

export async function handleAssemblyAiCallEnded(call: AssemblyAiCallPayload): Promise<void> {
  if (!call.session_id) return;

  const existing = await prisma.callLog.findUnique({
    where: { assemblyaiSessionId: call.session_id },
    select: { sessionId: true, transcript: true },
  });
  if (existing?.transcript) return;

  const session = existing
    ? await prisma.session.findUnique({
        where: { id: existing.sessionId },
        select: { endedAt: true },
      })
    : null;
  if (session?.endedAt) return;

  await handleAssemblyAiSessionCompleted({
    session_id: call.session_id,
    agent_id: call.agent_id,
    status: call.status,
    duration_seconds: undefined,
    ended_at: call.ended_at,
  });
}
