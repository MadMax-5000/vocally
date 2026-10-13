import { PhoneLineState } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { isFailureReason } from "@/lib/phone/health-check";

const VOICE_PIPELINE = process.env.VOICE_PIPELINE?.trim() || "vapi";
const VAPI_API_KEY = process.env.VAPI_API_KEY?.trim() || "";
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY?.trim() || "";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY?.trim() || "";
const RESEND_API_KEY = process.env.RESEND_API_KEY?.trim() || "";
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL?.trim() || "";
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY?.trim() || "";
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID?.trim() || "";
const AWS_REGION = process.env.AWS_REGION?.trim() || "";
const HANDOFF_PHONE_NUMBER = process.env.HANDOFF_PHONE_NUMBER?.trim() || "";
const NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL?.trim() || "";

/**
 * Founder-facing, presence-only deployment readiness check for the phone
 * channel. Read-heavy, no outbound network calls, no secrets exposed — safe
 * to render into the dashboard at load time.
 *
 * A green row means "the platform believes the wiring is correct." It does
 * NOT replace a real inbound test call — the checklist surfaces that as its
 * final, un-dismissable gate.
 */

export type PhoneDiagnosticStatus = "ok" | "warn" | "blocked";

export type PhoneDiagnosticItem = {
  id: string;
  status: PhoneDiagnosticStatus;
  titleKey: string;
  detailKey?: string;
  params?: Record<string, string | number>;
};

export type PhoneDeployDiagnostics = {
  ok: boolean;
  items: PhoneDiagnosticItem[];
  summaryKey: string;
  summaryDetailKey?: string;
};

const APP_URL = NEXT_PUBLIC_APP_URL.trim();

function isPublicDeployment(): boolean {
  if (!APP_URL) return false;
  const url = APP_URL.toLowerCase();
  return (
    /^https:\/\//.test(url) &&
    !url.includes("localhost") &&
    !url.includes("127.0.0.1") &&
    !url.includes(":3000") &&
    !url.includes(":3001")
  );
}

export async function getPhoneDeployDiagnostics(
  orgId: string,
  agentId: string | null,
): Promise<PhoneDeployDiagnostics> {
  const items: PhoneDiagnosticItem[] = [];

  // 1. Database migration (prisma db push) — the PhoneLineHealth table may
  //    not exist yet on a freshly pushed schema.
  try {
    await prisma.phoneLineHealth.count();
    items.push({
      id: "database",
      status: "ok",
      titleKey: "dbOk",
      detailKey: "dbOkDetail",
    });
  } catch (err) {
    const failedMigration =
      err instanceof Error &&
      (err.message.includes("does not exist") ||
        err.message.includes("P2021") ||
        err.message.includes("ECONNREFUSED") ||
        err.message.includes("ETIMEDOUT"));
    items.push({
      id: "database",
      status: failedMigration ? "blocked" : "warn",
      titleKey: failedMigration ? "dbBlocked" : "dbWarn",
      detailKey: failedMigration ? "dbBlockedDetail" : "dbWarnDetail",
    });
  }

  // 2. Deployment reachable over public HTTPS (carriers can't hit localhost)
  items.push({
    id: "deployment",
    status: isPublicDeployment() ? "ok" : "blocked",
    titleKey: isPublicDeployment() ? "deploymentOk" : "deploymentBlocked",
    detailKey: isPublicDeployment() ? "deploymentOkDetail" : "deploymentBlockedDetail",
  });

  // 3. Provider keys — presence only. Pipeline-aware:
  //    - Vapi is required for the Arabic/Darija path and the default inbound
  //      path (VOICE_PIPELINE default "vapi").
  //    - AssemblyAI is only used on EN/FR BYO-SIP when the pipeline is set.
  const vapiPresent = VAPI_API_KEY.length > 0;
  const llmPresent = OPENROUTER_API_KEY.length > 0 || OPENAI_API_KEY.length > 0;
  const ttsEnabledVapi = VAPI_API_KEY.length > 0; // Vapi dials TTS via its own creds
  const ttsEnabledByo =
    ELEVENLABS_API_KEY.length > 0 ||
    (AWS_ACCESS_KEY_ID.length > 0 && AWS_REGION.length > 0) ||
    OPENAI_API_KEY.length > 0;
  const ttsPresent = ttsEnabledVapi || ttsEnabledByo;
  const emailPresent = RESEND_API_KEY.length > 0 && RESEND_FROM_EMAIL.length > 0;
  const handoffPresent = HANDOFF_PHONE_NUMBER.length > 0;

  items.push({
    id: "vapi",
    status: vapiPresent ? "ok" : "blocked",
    titleKey: vapiPresent ? "vapiOk" : "vapiBlocked",
    detailKey: vapiPresent ? "vapiOkDetail" : "vapiBlockedDetail",
  });

  items.push({
    id: "llm",
    status: llmPresent ? "ok" : "blocked",
    titleKey: llmPresent ? "llmOk" : "llmBlocked",
    detailKey: llmPresent ? "llmOkDetail" : "llmBlockedDetail",
  });

  items.push({
    id: "tts",
    status: ttsPresent ? "ok" : "warn",
    titleKey: ttsPresent ? "ttsOk" : "ttsWarn",
    detailKey: ttsPresent ? "ttsOkDetail" : "ttsWarnDetail",
  });

  items.push({
    id: "email",
    status: emailPresent ? "ok" : "warn",
    titleKey: emailPresent ? "emailOk" : "emailWarn",
    detailKey: emailPresent ? "emailOkDetail" : "emailWarnDetail",
  });

  items.push({
    id: "handoff",
    status: handoffPresent ? "ok" : "warn",
    titleKey: handoffPresent ? "handoffOk" : "handoffWarn",
    detailKey: handoffPresent ? "handoffOkDetail" : "handoffWarnDetail",
  });

  // 4. Line health (from the live webhook + cron, not a ping)
  const lineHealth = agentId
    ? await prisma.phoneLineHealth.findFirst({
        where: { phoneNumber: { orgId, agentId } },
        orderBy: { updatedAt: "desc" },
        select: {
          state: true,
          lastHealthyAt: true,
          lastFailureAt: true,
          failureReason: true,
        },
      })
    : null;

  if (lineHealth) {
    if (
      lineHealth.state === PhoneLineState.HEALTHY ||
      (lineHealth.state === PhoneLineState.UNKNOWN &&
        (lineHealth.lastHealthyAt || lineHealth.lastFailureAt))
    ) {
      items.push({
        id: "line",
        status: lineHealth.state === PhoneLineState.HEALTHY ? "ok" : "warn",
        titleKey: lineHealth.state === PhoneLineState.HEALTHY ? "lineOk" : "lineWarn",
        detailKey: lineHealth.state === PhoneLineState.HEALTHY ? "lineOkDetail" : "lineWarnDetail",
      });
    } else {
      items.push({
        id: "line",
        status:
          lineHealth.state === PhoneLineState.STALE || lineHealth.state === PhoneLineState.UNKNOWN
            ? "warn"
            : "blocked",
        titleKey: lineHealth.state === PhoneLineState.STALE ? "lineStale" : "lineFailing",
        detailKey: lineHealth.state === PhoneLineState.STALE ? "lineStaleDetail" : "lineFailingDetail",
        params: lineHealth.failureReason
          ? { reason: lineHealth.failureReason }
          : undefined,
      });
    }
  } else {
    items.push({
      id: "line",
      status: "warn",
      titleKey: "lineNeverTested",
      detailKey: "lineNeverTestedDetail",
    });
  }

  // 5. Last real inbound call — the un-dismissable gate.
  const lastCall = agentId
    ? await prisma.callLog.findFirst({
        where: { session: { agentId } },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true, duration: true },
      })
    : null;

  if (lastCall && lastCall.duration && lastCall.duration > 0) {
    const daysAgo = Math.max(
      0,
      Math.floor(
        (Date.now() - lastCall.createdAt.getTime()) / (24 * 60 * 60 * 1000),
      ),
    );
    const callKey = daysAgo === 0 ? "minutesAgo" : "daysAgo";
    items.push({
      id: "testCall",
      status: daysAgo <= 7 ? "ok" : "warn",
      titleKey: "testCallOk",
      detailKey: callKey,
      params: { value: daysAgo === 0 ? Math.max(1, Math.round((Date.now() - lastCall.createdAt.getTime()) / 60000)) : daysAgo },
    });
  } else {
    items.push({
      id: "testCall",
      status: "blocked",
      titleKey: "testCallNever",
      detailKey: "testCallNeverDetail",
    });
  }

  const blocked = items.filter((i) => i.status === "blocked").length;
  const ok = items.every((i) => i.status !== "blocked");

  return {
    ok,
    items,
    summaryKey: blocked === 0 ? "readyTitle" : "notReadyTitle",
    summaryDetailKey: blocked === 0 ? "readyDescription" : "notReadyDescription",
  };
}
