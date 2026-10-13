import { PhoneLineState } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { sendEmail } from "@/lib/email/send";
import { logServerWarning } from "@/lib/logger";
import { BRAND_EMAILS } from "@/lib/constants/brand";

/**
 * Phone line health tracking + founder alerts.
 *
 * Failure is recorded live from the Vapi webhook (end-of-call-report and
 * failed status-update). The daily cron catches stale lines (verified but no
 * inbound for STALE_AFTER_DAYS) and re-sends alerts to ops so a dead line is
 * never discovered by the customer first.
 */

export const STALE_AFTER_DAYS = 7;
export const FAILURE_WINDOW_DAYS = 7;
const RETRY_NOTIFY_MS = 24 * 60 * 60 * 1000;

/** Days a line must be silent before it is considered stale (from first call). */
export function isFailureReason(reason: string | null | undefined): boolean {
  if (!reason) return false;
  const norm = reason.toLowerCase();
  return (
    norm.includes("error") ||
    norm.includes("failed") ||
    norm.includes("unresponsive") ||
    norm.includes("no audio received")
  );
}

function opsEmail(): string {
  return (
    process.env.PHONE_HEALTH_OPS_EMAIL?.trim() ??
    process.env.RESEND_FROM_EMAIL?.trim() ??
    BRAND_EMAILS.contact
  );
}

async function findLineForAgent(
  orgId: string,
  agentId: string | null,
  phoneNumberId?: string,
): Promise<{ id: string; twilioNumber: string } | null> {
  return prisma.twilioPhoneNumber.findFirst({
    where: {
      orgId,
      ...(phoneNumberId ? { id: phoneNumberId } : {}),
      ...(agentId ? { agentId } : {}),
      isActive: true,
    },
    orderBy: { createdAt: "desc" },
    select: { id: true, twilioNumber: true },
  });
}

async function loadLineContext(phoneNumber: {
  id: string;
  twilioNumber: string;
}) {
  const row = await prisma.twilioPhoneNumber.findUnique({
    where: { id: phoneNumber.id },
    select: {
      twilioNumber: true,
      customerNumber: true,
      forwardingVerifiedAt: true,
      org: { select: { name: true } },
      agent: { select: { name: true } },
    },
  });
  return row;
}

async function notifyLineState(params: {
  number: string;
  customerNumber: string | null;
  orgName: string;
  agentName: string | null;
  state: Extract<PhoneLineState, "FAILING" | "STALE"> | "HEALTHY";
  reason?: string | null;
}) {
  const to = opsEmail();
  const line = params.number;
  const org = params.orgName;
  const agent = params.agentName ?? "voice agent";
  const customer = params.customerNumber ?? line;

  const subject =
    params.state === "HEALTHY"
      ? `[Anselio] Line recovered: ${line}`
      : `[Anselio] ATTENTION — phone line down: ${line}`;

  const body =
    params.state === "HEALTHY"
      ? [
          `Line ${line} (${org} / ${agent}) is receiving inbound calls again.`,
          "",
          "No action needed.",
        ].join("\n")
      : [
          `Line ${line} (${org} / ${agent}) is NOT routing calls to the AI.`,
          ...(params.customerNumber
            ? [`Customer forwards ${customer} → ${line}.`]
            : []),
          ...(params.reason ? [`Reason: ${params.reason}`] : []),
          "",
          "Check: Vapi Dashboard → Logs for provider errors, the SIP trunk / SIM",
          "status, and funded provider credits (OpenAI, ElevenLabs, Gladia).",
          "Do not wait for the customer to report it.",
        ].join("\n");

  try {
    await sendEmail({ to, subject, body });
  } catch (err) {
    logServerWarning("phone_health_alert_email_failed", {
      line,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/**
 * Upsert health state for the most recent active line of an agent and alert
 * the founder on meaningful transitions. Called live from the Vapi webhook and
 * from the daily cron.
 */
export async function recordLineHealth(params: {
  orgId: string;
  agentId: string | null;
  state: PhoneLineState;
  reason?: string | null;
  phoneNumberId?: string;
}): Promise<boolean> {
  try {
    const line = await findLineForAgent(params.orgId, params.agentId, params.phoneNumberId);
    if (!line) return false;

    const now = new Date();
    const prev = await prisma.phoneLineHealth.findUnique({
      where: { phoneNumberId: line.id },
    });

    const nextState = params.state;
    const wasBad =
      prev?.state === "FAILING" || prev?.state === "STALE";
    const isBad = nextState === "FAILING" || nextState === "STALE";
    const cooldownElapsed =
      !prev?.lastNotifiedAt ||
      now.getTime() - prev.lastNotifiedAt.getTime() > RETRY_NOTIFY_MS;

    const shouldNotify = isBad
      ? cooldownElapsed && (!wasBad || prev?.state !== nextState)
      : wasBad;

    await prisma.phoneLineHealth.upsert({
      where: { phoneNumberId: line.id },
      create: {
        phoneNumberId: line.id,
        state: nextState,
        failureReason: isBad ? (params.reason ?? null) : null,
        lastHealthyAt: nextState === "HEALTHY" ? now : null,
        lastFailureAt: isBad ? now : prev?.lastFailureAt ?? null,
        lastNotifiedAt: shouldNotify ? now : prev?.lastNotifiedAt ?? null,
      },
      update: {
        state: nextState,
        failureReason: isBad ? (params.reason ?? null) : null,
        lastHealthyAt: nextState === "HEALTHY" ? now : prev?.lastHealthyAt,
        lastFailureAt: isBad ? now : prev?.lastFailureAt,
        lastNotifiedAt: shouldNotify ? now : prev?.lastNotifiedAt,
      },
    });

    if (!shouldNotify) return false;

    const context = await loadLineContext(line);
    if (!context) return false;

    await notifyLineState({
      number: context.twilioNumber,
      customerNumber: context.customerNumber,
      orgName: context.org.name,
      agentName: context.agent?.name ?? null,
      state: nextState === "HEALTHY" ? "HEALTHY" : (nextState as "FAILING" | "STALE"),
      reason: params.reason,
    });
    return true;
  } catch (err) {
    logServerWarning("phone_health_record_failed", {
      error: err instanceof Error ? err.message : String(err),
      agentId: params.agentId ?? "unknown",
    });
    return false;
  }
}

/**
 * Daily sweep. Flags verified lines with no inbound recently as STALE, heals
 * lines that have recovered, and re-alerts lines still down past the cooldown.
 * Safe to run on every service instance — it is idempotent.
 */
export async function runPhoneHealthCheck(): Promise<{
  checked: number;
  alerted: number;
}> {
  const numbers = await prisma.twilioPhoneNumber.findMany({
    where: {
      isActive: true,
      forwardingVerifiedAt: { not: null },
    },
    select: {
      id: true,
      twilioNumber: true,
      orgId: true,
      agentId: true,
      forwardingVerifiedAt: true,
      customerNumber: true,
      health: true,
    },
  });

  let notified = 0;

  const cutoffDaysAgo = (days: number) =>
    new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  for (const number of numbers) {
    const since = cutoffDaysAgo(STALE_AFTER_DAYS);
    const hadPriorCall = Boolean(number.health?.lastHealthyAt);

    const sessionIds = number.agentId
      ? (
          await prisma.session.findMany({
            where: { orgId: number.orgId, agentId: number.agentId },
            select: { id: true },
          })
        ).map((s) => s.id)
      : [];

    const lastCall = sessionIds.length
      ? await prisma.callLog.findFirst({
          where: { sessionId: { in: sessionIds } },
          orderBy: { createdAt: "desc" },
          select: { createdAt: true },
        })
      : null;

    const recentFailure =
      sessionIds.length > 0
        ? await prisma.vapiCallMetadata.findFirst({
            where: {
              sessionId: { in: sessionIds },
              createdAt: { gte: cutoffDaysAgo(FAILURE_WINDOW_DAYS) },
            },
            orderBy: { createdAt: "desc" },
            select: { endedReason: true },
          })
        : null;

    let nextState: PhoneLineState = "UNKNOWN";

    if (recentFailure?.endedReason && isFailureReason(recentFailure.endedReason)) {
      nextState = "FAILING";
    } else if (lastCall && lastCall.createdAt >= since) {
      nextState = "HEALTHY";
    } else if (lastCall || hadPriorCall) {
      nextState = "STALE";
    }

    if (nextState === "UNKNOWN") continue;

    const didNotify = await recordLineHealth({
      orgId: number.orgId,
      agentId: number.agentId,
      phoneNumberId: number.id,
      state: nextState,
      reason: recentFailure?.endedReason ?? undefined,
    });
    if (didNotify) notified += 1;
  }

  return { checked: numbers.length, alerted: notified };
}