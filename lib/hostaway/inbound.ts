import { Prisma, type HostawayConnection } from "@prisma/client";

import { processMessage } from "@/lib/ai/process-message";
import { DEFAULT_ESCALATION_CUSTOMER_MESSAGE } from "@/lib/deploy/escalation-action";
import { prisma } from "@/lib/db/prisma";
import { sendEmail } from "@/lib/email/send";
import { logServerError, logServerWarning } from "@/lib/logger";
import { getHostawayAccessToken, refreshHostawayAccessToken } from "./auth";
import { resolveHostawayChannel, type HostawayChannel } from "./channels";
import {
  getHostawayConversation,
  getHostawayListing,
  listHostawayConversationMessages,
  listHostawayConversationsByReservation,
  sendHostawayConversationMessage,
} from "./client";
import { buildHostawayAiContext, buildPropertyContext } from "./context";
import { HostawayError } from "./errors";
import { tryConsumeHostawaySendSlot } from "./rate-limit";
import type {
  HostawayConversation,
  HostawayConversationMessage,
} from "./types";
import { hostawayMessageKey, isHostawayMessageEvent, parseHostawayWebhook } from "./webhook-payload";

export type HostawayInboundResult = {
  status: "replied" | "escalated" | "ignored";
  reason: string;
};

const TERMINAL_SESSION_STATUSES = new Set(["RESOLVED", "ABANDONED"]);
const HUMAN_TAKEOVER_STATUSES = new Set(["HUMAN", "ESCALATED", "CLAIMED"]);
const DUPLICATE_OUTBOUND_WINDOW_MS = 5 * 60 * 1000;

function isIncoming(message: HostawayConversationMessage): boolean {
  const raw = message.isIncoming;
  return raw === 1 || raw === "1" || raw === true;
}

function messageTimestamp(message: HostawayConversationMessage): number {
  const raw = message.sentChannelDate ?? message.date ?? message.insertedOn;
  if (!raw) return 0;
  const parsed = Date.parse(raw.replace(" ", "T"));
  return Number.isFinite(parsed) ? parsed : 0;
}

function conversationReservation(conversation: HostawayConversation) {
  return conversation.Reservation ?? conversation.reservation ?? null;
}

function conversationChannel(conversation: HostawayConversation): HostawayChannel | null {
  const reservation = conversationReservation(conversation);
  return resolveHostawayChannel({
    channelId: reservation?.channelId,
    channelName: reservation?.channelName,
  });
}

async function resolveConversation(
  token: string,
  conversationId: string | null,
  reservationId: string | null,
): Promise<HostawayConversation | null> {
  if (conversationId) {
    try {
      return await getHostawayConversation(token, conversationId);
    } catch (err) {
      if (!(err instanceof HostawayError) || err.status !== 404) throw err;
    }
  }

  if (reservationId) {
    const conversations = await listHostawayConversationsByReservation(
      token,
      reservationId,
    );
    return conversations[0] ?? null;
  }

  return null;
}

function pickInboundMessage(
  messages: HostawayConversationMessage[],
  messageId: string | null,
): HostawayConversationMessage | null {
  if (messageId) {
    // Never fall back to an older message when the delivery names a specific one.
    return messages.find((m) => String(m.id) === messageId) ?? null;
  }

  const newestFirst = [...messages].sort(
    (a, b) => messageTimestamp(b) - messageTimestamp(a),
  );
  return newestFirst.find(isIncoming) ?? null;
}

async function readConversationWithTokenRetry(
  connection: HostawayConnection,
  conversationId: string | null,
  reservationId: string | null,
): Promise<{
  token: string;
  conversation: HostawayConversation;
  messages: HostawayConversationMessage[];
}> {
  const read = async (token: string) => {
    const conversation = await resolveConversation(
      token,
      conversationId,
      reservationId,
    );
    if (!conversation) {
      throw new HostawayError("Hostaway conversation not found for webhook", 404);
    }

    const messages = await listHostawayConversationMessages(
      token,
      conversation.id,
      100,
    );
    return { conversation, messages };
  };

  const token = await getHostawayAccessToken(connection);
  try {
    const data = await read(token);
    return { token, ...data };
  } catch (err) {
    if (
      err instanceof HostawayError &&
      (err.status === 401 || err.status === 403)
    ) {
      const freshToken = await refreshHostawayAccessToken(connection);
      const data = await read(freshToken);
      return { token: freshToken, ...data };
    }
    throw err;
  }
}

function hasRecentIdenticalOutbound(
  messages: HostawayConversationMessage[],
  body: string,
): boolean {
  const cutoff = Date.now() - DUPLICATE_OUTBOUND_WINDOW_MS;
  const normalized = body.trim();
  return messages.some((message) => {
    if (isIncoming(message)) return false;
    if ((message.body ?? "").trim() !== normalized) return false;
    const ts = messageTimestamp(message);
    return ts > 0 && ts >= cutoff;
  });
}

async function notifyPropertyTeam(input: {
  connection: HostawayConnection;
  channel: HostawayChannel;
  conversation: HostawayConversation;
  reason: string;
  guestMessage: string;
}): Promise<void> {
  const to = input.connection.escalationEmail?.trim();
  if (!to) return;

  const reservation = conversationReservation(input.conversation);
  const property =
    reservation?.listingName ??
    (typeof input.conversation.listingMapId === "string"
      ? `listing ${input.conversation.listingMapId}`
      : `listing ${String(input.conversation.listingMapId ?? "unknown")}`);

  try {
    await sendEmail({
      to,
      subject: `Hostaway escalation — ${input.channel === "airbnb" ? "Airbnb" : "Booking.com"} guest needs your team`,
      body: [
        "An Anselio AI agent escalated a guest conversation.",
        "",
        `Property: ${property}`,
        `Reservation: ${reservation?.confirmationCode ?? reservation?.reservationId ?? "unknown"}`,
        `Guest: ${reservation?.guestName ?? "unknown"}`,
        `Reason: ${input.reason}`,
        "",
        "Latest guest message:",
        input.guestMessage.slice(0, 1_500),
        "",
        "Open the Anselio dashboard to review the full conversation and reply.",
      ].join("\n"),
    });
  } catch (err) {
    logServerWarning("hostaway_escalation_email_failed", {
      error: err instanceof Error ? err.message.slice(0, 120) : "unknown",
    });
  }
}

/**
 * Handles one verified Hostaway unified webhook delivery using Anselio's
 * existing session, AI, escalation, and messaging layers.
 */
type HostawaySessionMapping = {
  id: string;
  sessionId: string;
  propertyContext: string | null;
  session: { id: string; status: string };
};

async function openHostawaySession(input: {
  connection: HostawayConnection;
  conversationId: string;
  conversation: HostawayConversation;
  reservation: ReturnType<typeof conversationReservation>;
  channel: HostawayChannel;
  parsedReservationId: string | null;
  text: string;
}): Promise<{
  sessionId: string;
  mapping: HostawaySessionMapping | null;
}> {
  const {
    connection,
    conversationId,
    conversation,
    reservation,
    channel,
    parsedReservationId,
    text,
  } = input;

  const mapping = await prisma.hostawayConversation.findUnique({
    where: {
      connectionId_conversationId: {
        connectionId: connection.id,
        conversationId,
      },
    },
    include: { session: { select: { id: true, status: true } } },
  });

  let sessionId: string;
  if (mapping && !TERMINAL_SESSION_STATUSES.has(mapping.session.status)) {
    sessionId = mapping.sessionId;
  } else {
    const created = await prisma.session.create({
      data: {
        orgId: connection.orgId,
        agentId: connection.agentId,
        channel: "HOSTAWAY",
        status: "ACTIVE",
        customerId: `hostaway:${conversationId}`,
        language: "auto",
      },
      select: { id: true },
    });
    sessionId = created.id;
  }

  const mappingData = {
    reservationId: reservation?.reservationId ?? parsedReservationId ?? null,
    listingMapId: conversation.listingMapId
      ? String(conversation.listingMapId)
      : reservation?.listingMapId
        ? String(reservation.listingMapId)
        : null,
    guestName: reservation?.guestName ?? conversation.recipientName ?? null,
    channelName: channel,
    lastInboundAt: new Date(),
  };

  if (mapping && mapping.sessionId === sessionId) {
    await prisma.hostawayConversation.update({
      where: { id: mapping.id },
      data: mappingData,
    });
  } else if (mapping) {
    await prisma.hostawayConversation.update({
      where: { id: mapping.id },
      data: { ...mappingData, sessionId },
    });
  } else {
    await prisma.hostawayConversation.create({
      data: {
        connectionId: connection.id,
        conversationId,
        sessionId,
        ...mappingData,
      },
    });
  }

  await prisma.message.create({
    data: { sessionId, role: "USER", content: text },
  });

  return { sessionId, mapping: mapping ?? null };
}

export async function handleHostawayInbound(input: {
  connection: HostawayConnection;
  payload: unknown;
}): Promise<HostawayInboundResult> {
  const { connection, payload } = input;
  const parsed = parseHostawayWebhook(payload);

  if (!isHostawayMessageEvent(parsed)) {
    return { status: "ignored", reason: "event_not_supported" };
  }

  if (parsed.accountId && parsed.accountId !== connection.accountId) {
    return { status: "ignored", reason: "account_mismatch" };
  }

  const agent = await prisma.agent.findFirst({
    where: { id: connection.agentId, orgId: connection.orgId },
    select: {
      id: true,
      orgId: true,
      status: true,
      channels: {
        where: { channel: "HOSTAWAY" },
        select: { enabled: true },
      },
    },
  });

  if (!agent) return { status: "ignored", reason: "agent_not_found" };
  if (agent.status !== "ACTIVE") {
    return { status: "ignored", reason: "agent_inactive" };
  }
  if (!agent.channels[0]?.enabled) {
    return { status: "ignored", reason: "channel_disabled" };
  }

  const { token, conversation, messages } = await readConversationWithTokenRetry(
    connection,
    parsed.conversationId,
    parsed.reservationId,
  );

  const conversationId = String(conversation.id);
  const inbound = pickInboundMessage(messages, parsed.messageId);

  if (inbound ? !isIncoming(inbound) : parsed.inlineIsIncoming === false) {
    return { status: "ignored", reason: "outgoing_message" };
  }

  const text = (inbound?.body ?? parsed.inlineBody ?? "").trim();
  if (!text) return { status: "ignored", reason: "no_text_content" };

  const channel = conversationChannel(conversation);
  if (!channel) {
    return { status: "ignored", reason: "unsupported_channel" };
  }

  const messageKey = hostawayMessageKey(
    parsed,
    conversationId,
    `${text.length}:${messageTimestamp(inbound ?? { id: "inline" })}`,
  );

  try {
    await prisma.hostawayMessageDedupe.create({ data: { messageKey } });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { status: "ignored", reason: "duplicate_message" };
    }
    throw err;
  }

  const reservation = conversationReservation(conversation);

  let opened: Awaited<ReturnType<typeof openHostawaySession>>;
  try {
    opened = await openHostawaySession({
      connection,
      conversationId,
      conversation,
      reservation,
      channel,
      parsedReservationId: parsed.reservationId,
      text,
    });
  } catch (err) {
    // Let Hostaway retry without treating the delivery as already processed.
    await prisma.hostawayMessageDedupe
      .deleteMany({ where: { messageKey } })
      .catch(() => undefined);
    throw err;
  }

  const { sessionId, mapping } = opened;

  if (HUMAN_TAKEOVER_STATUSES.has(mapping?.session.status ?? "")) {
    return { status: "ignored", reason: "human_takeover" };
  }

  if (!connection.autoReplyEnabled) {
    return { status: "ignored", reason: "auto_reply_disabled" };
  }

  if (!tryConsumeHostawaySendSlot(connection.id)) {
    await prisma.hostawayMessageDedupe.deleteMany({ where: { messageKey } });
    throw new HostawayError("Hostaway conversation send rate limit reached", 429);
  }

  const listingId = conversation.listingMapId ?? reservation?.listingMapId ?? null;
  const existingPropertyContext =
    mapping?.propertyContext ??
    (
      await prisma.hostawayConversation.findUnique({
        where: { sessionId },
        select: { propertyContext: true },
      })
    )?.propertyContext ??
    null;

  let propertyContext = existingPropertyContext;
  if (!propertyContext && listingId) {
    try {
      const listing = await getHostawayListing(token, listingId);
      propertyContext = buildPropertyContext(listing);
      if (propertyContext) {
        await prisma.hostawayConversation.update({
          where: { sessionId },
          data: { propertyContext },
        });
      }
    } catch (err) {
      logServerWarning("hostaway_listing_context_failed", {
        status: err instanceof HostawayError ? err.status ?? 0 : 0,
      });
    }
  }

  const extraContext = buildHostawayAiContext({
    channel,
    reservation: reservation
      ? { ...reservation, listingName: reservation.listingName }
      : null,
    propertyContext,
  });

  let result: Awaited<ReturnType<typeof processMessage>>;
  try {
    result = await processMessage({
      orgId: connection.orgId,
      agentId: connection.agentId,
      sessionId,
      message: text,
      channel: "HOSTAWAY",
      extraContext,
    });
  } catch (err) {
    await prisma.hostawayMessageDedupe.deleteMany({ where: { messageKey } });
    throw err;
  }

  const escalated = Boolean(result.escalation?.shouldEscalate);
  const reply = escalated
    ? (result.customerFacingMessage?.trim() || DEFAULT_ESCALATION_CUSTOMER_MESSAGE)
    : result.botContent.trim();

  if (!reply) {
    logServerWarning("hostaway_empty_reply_skipped", { sessionId });
    return {
      status: escalated ? "escalated" : "ignored",
      reason: "empty_reply",
    };
  }

  if (hasRecentIdenticalOutbound(messages, reply)) {
    logServerWarning("hostaway_duplicate_outbound_suppressed", { sessionId });
    return { status: "ignored", reason: "duplicate_outbound" };
  }

  try {
    await sendHostawayConversationMessage(token, conversationId, reply);
  } catch (err) {
    if (
      err instanceof HostawayError &&
      (err.status === 401 || err.status === 403)
    ) {
      try {
        const freshToken = await refreshHostawayAccessToken(connection);
        await sendHostawayConversationMessage(freshToken, conversationId, reply);
      } catch (retryErr) {
        await prisma.hostawayMessageDedupe.deleteMany({ where: { messageKey } });
        logServerError("hostaway_send_failed", {
          status: retryErr instanceof HostawayError ? retryErr.status ?? 0 : 0,
        });
        throw retryErr;
      }
    } else {
      await prisma.hostawayMessageDedupe.deleteMany({ where: { messageKey } });
      logServerError("hostaway_send_failed", {
        status: err instanceof HostawayError ? err.status ?? 0 : 0,
      });
      throw err;
    }
  }

  await prisma.message.create({
    data: { sessionId, role: "BOT", content: reply },
  });
  await prisma.hostawayConversation.update({
    where: { sessionId },
    data: { lastOutboundAt: new Date() },
  });

  if (escalated) {
    await notifyPropertyTeam({
      connection,
      channel,
      conversation,
      reason: result.escalation?.reason ?? "Escalated by AI",
      guestMessage: text,
    });
    return { status: "escalated", reason: "escalated" };
  }

  return { status: "replied", reason: "replied" };
}
