import { WhatsappConnectionStatus } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import {
  isWhatsappSandboxMode,
  normalizeWhatsappSenderId,
} from "@/lib/deploy/whatsapp-config";
import { ensureOrgTwilioSubaccount } from "@/lib/twilio/subaccounts";
import {
  createWhatsappSender,
  mapTwilioSenderToConnectionStatus,
  pollWhatsappSenderOnline,
} from "@/lib/twilio/whatsapp-senders";

export type CompleteWhatsappConnectInput = {
  orgId: string;
  agentId: string;
  phoneNumber: string;
  wabaId?: string;
};

export type CompleteWhatsappConnectResult = {
  connectionId: string;
  status: WhatsappConnectionStatus;
  twilioNumber: string;
  twilioSenderSid: string | null;
  needsOtp: boolean;
};

async function enableWhatsappChannel(agentId: string): Promise<void> {
  await prisma.agentChannel.upsert({
    where: { agentId_channel: { agentId, channel: "WHATSAPP" } },
    create: { agentId, channel: "WHATSAPP", enabled: true },
    update: { enabled: true },
  });
}

/** Sandbox/dev path: map agent to platform sandbox number without Meta Embedded Signup. */
async function connectSandboxWhatsapp(
  input: CompleteWhatsappConnectInput,
): Promise<CompleteWhatsappConnectResult> {
  const sandboxRaw = process.env.TWILIO_WHATSAPP_NUMBER?.trim();
  if (!sandboxRaw) {
    throw new Error("TWILIO_WHATSAPP_NUMBER is not configured for sandbox mode");
  }

  const twilioNumber = normalizeWhatsappSenderId(sandboxRaw);
  const existing = await prisma.whatsappPhoneNumber.findUnique({ where: { twilioNumber } });

  if (existing && existing.orgId !== input.orgId) {
    throw new Error("Sandbox number is already registered to another organization.");
  }

  const row = existing
    ? await prisma.whatsappPhoneNumber.update({
        where: { id: existing.id },
        data: {
          orgId: input.orgId,
          agentId: input.agentId,
          isActive: true,
          status: "ONLINE",
          statusMessage: null,
        },
      })
    : await prisma.whatsappPhoneNumber.create({
        data: {
          orgId: input.orgId,
          agentId: input.agentId,
          twilioNumber,
          isActive: true,
          status: "ONLINE",
        },
      });

  await enableWhatsappChannel(input.agentId);

  return {
    connectionId: row.id,
    status: "ONLINE",
    twilioNumber: row.twilioNumber,
    twilioSenderSid: row.twilioSenderSid,
    needsOtp: false,
  };
}

export async function completeWhatsappConnect(
  input: CompleteWhatsappConnectInput,
): Promise<CompleteWhatsappConnectResult> {
  const agent = await prisma.agent.findFirst({
    where: { id: input.agentId, orgId: input.orgId },
    select: { id: true, name: true },
  });
  if (!agent) throw new Error("Agent not found");

  if (isWhatsappSandboxMode()) {
    return connectSandboxWhatsapp(input);
  }

  if (!input.wabaId) {
    throw new Error("WhatsApp Business Account verification is required. Complete Meta signup.");
  }

  const twilioNumber = normalizeWhatsappSenderId(input.phoneNumber);
  const existingGlobal = await prisma.whatsappPhoneNumber.findUnique({
    where: { twilioNumber },
  });
  if (existingGlobal && existingGlobal.orgId !== input.orgId) {
    throw new Error("This number is already registered to another organization.");
  }

  const credentials = await ensureOrgTwilioSubaccount(input.orgId);

  const existingOrgWaba = await prisma.whatsappPhoneNumber.findFirst({
    where: { orgId: input.orgId, wabaId: { not: null } },
    select: { wabaId: true },
  });
  const wabaIdForRegistration = existingOrgWaba?.wabaId ?? input.wabaId;

  let connection = existingGlobal
    ? await prisma.whatsappPhoneNumber.update({
        where: { id: existingGlobal.id },
        data: {
          orgId: input.orgId,
          agentId: input.agentId,
          wabaId: wabaIdForRegistration,
          status: "CREATING",
          statusMessage: null,
          isActive: true,
        },
      })
    : await prisma.whatsappPhoneNumber.create({
        data: {
          orgId: input.orgId,
          agentId: input.agentId,
          twilioNumber,
          wabaId: wabaIdForRegistration,
          status: "CREATING",
          isActive: true,
        },
      });

  try {
    let senderSid = connection.twilioSenderSid;

    if (!senderSid) {
      const created = await createWhatsappSender({
        credentials,
        senderId: twilioNumber,
        wabaId: existingOrgWaba ? undefined : wabaIdForRegistration,
        profileName: agent.name,
      });
      senderSid = created.sid;

      connection = await prisma.whatsappPhoneNumber.update({
        where: { id: connection.id },
        data: {
          twilioSenderSid: senderSid,
          status: mapTwilioSenderToConnectionStatus(created.status),
          statusMessage: created.status_message ?? null,
        },
      });
    }

    if (connection.status === "VERIFYING_OTP") {
      await enableWhatsappChannel(input.agentId);
      return {
        connectionId: connection.id,
        status: "VERIFYING_OTP",
        twilioNumber: connection.twilioNumber,
        twilioSenderSid: senderSid,
        needsOtp: true,
      };
    }

    const polled = await pollWhatsappSenderOnline({
      credentials,
      senderSid,
      maxAttempts: 6,
      delayMs: 5000,
    });

    const finalStatus = mapTwilioSenderToConnectionStatus(polled.status);

    connection = await prisma.whatsappPhoneNumber.update({
      where: { id: connection.id },
      data: {
        status: finalStatus,
        statusMessage:
          finalStatus === "FAILED"
            ? (polled.status_message ?? "Registration failed")
            : null,
        qualityRating: polled.properties?.quality_rating ?? null,
        messagingLimit: polled.properties?.messaging_limit ?? null,
      },
    });

    await enableWhatsappChannel(input.agentId);

    return {
      connectionId: connection.id,
      status: connection.status,
      twilioNumber: connection.twilioNumber,
      twilioSenderSid: connection.twilioSenderSid,
      needsOtp: connection.status === "VERIFYING_OTP",
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "WhatsApp connection failed";
    await prisma.whatsappPhoneNumber.update({
      where: { id: connection.id },
      data: { status: "FAILED", statusMessage: message },
    });
    throw err;
  }
}

export async function verifyWhatsappOtpForAgent(params: {
  orgId: string;
  agentId: string;
  verificationCode: string;
}): Promise<CompleteWhatsappConnectResult> {
  const connection = await prisma.whatsappPhoneNumber.findFirst({
    where: { orgId: params.orgId, agentId: params.agentId, isActive: true },
  });
  if (!connection?.twilioSenderSid) {
    throw new Error("No WhatsApp connection awaiting verification");
  }

  const credentials = await ensureOrgTwilioSubaccount(params.orgId);
  const { verifyWhatsappSenderOtp } = await import("@/lib/twilio/whatsapp-senders");

  const verified = await verifyWhatsappSenderOtp({
    credentials,
    senderSid: connection.twilioSenderSid,
    verificationCode: params.verificationCode,
  });

  const polled = await pollWhatsappSenderOnline({
    credentials,
    senderSid: connection.twilioSenderSid,
    maxAttempts: 6,
    delayMs: 5000,
  });

  const status = mapTwilioSenderToConnectionStatus(polled.status ?? verified.status);

  const updated = await prisma.whatsappPhoneNumber.update({
    where: { id: connection.id },
    data: {
      status,
      statusMessage: status === "FAILED" ? (polled.status_message ?? "Verification failed") : null,
      qualityRating: polled.properties?.quality_rating ?? null,
      messagingLimit: polled.properties?.messaging_limit ?? null,
    },
  });

  return {
    connectionId: updated.id,
    status: updated.status,
    twilioNumber: updated.twilioNumber,
    twilioSenderSid: updated.twilioSenderSid,
    needsOtp: updated.status === "VERIFYING_OTP",
  };
}

export async function disconnectWhatsappForAgent(params: {
  orgId: string;
  agentId: string;
}): Promise<void> {
  await prisma.whatsappPhoneNumber.deleteMany({
    where: { orgId: params.orgId, agentId: params.agentId },
  });

  await prisma.agentChannel.updateMany({
    where: { agentId: params.agentId, channel: "WHATSAPP" },
    data: { enabled: false },
  });
}

export async function refreshWhatsappConnectionStatus(params: {
  orgId: string;
  agentId: string;
}): Promise<CompleteWhatsappConnectResult | null> {
  const connection = await prisma.whatsappPhoneNumber.findFirst({
    where: { orgId: params.orgId, agentId: params.agentId, isActive: true },
  });
  if (!connection) return null;

  if (!connection.twilioSenderSid || connection.status === "ONLINE") {
    return {
      connectionId: connection.id,
      status: connection.status,
      twilioNumber: connection.twilioNumber,
      twilioSenderSid: connection.twilioSenderSid,
      needsOtp: connection.status === "VERIFYING_OTP",
    };
  }

  const credentials = await ensureOrgTwilioSubaccount(params.orgId);
  const { getWhatsappSender } = await import("@/lib/twilio/whatsapp-senders");
  const sender = await getWhatsappSender({
    credentials,
    senderSid: connection.twilioSenderSid,
  });

  const status = mapTwilioSenderToConnectionStatus(sender.status);
  const updated = await prisma.whatsappPhoneNumber.update({
    where: { id: connection.id },
    data: {
      status,
      statusMessage: status === "FAILED" ? (sender.status_message ?? null) : null,
      qualityRating: sender.properties?.quality_rating ?? null,
      messagingLimit: sender.properties?.messaging_limit ?? null,
    },
  });

  return {
    connectionId: updated.id,
    status: updated.status,
    twilioNumber: updated.twilioNumber,
    twilioSenderSid: updated.twilioSenderSid,
    needsOtp: updated.status === "VERIFYING_OTP",
  };
}
