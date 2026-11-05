import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    agent: { findFirst: vi.fn() },
    session: { create: vi.fn() },
    message: { create: vi.fn() },
    hostawayConversation: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    hostawayMessageDedupe: { create: vi.fn(), deleteMany: vi.fn() },
    hostawayConnection: { update: vi.fn() },
  },
}));

vi.mock("@/lib/db/prisma", () => ({ prisma: prismaMock }));

vi.mock("@/lib/hostaway/auth", () => ({
  getHostawayAccessToken: vi.fn(),
}));

vi.mock("@/lib/hostaway/client", () => ({
  getHostawayConversation: vi.fn(),
  listHostawayConversationsByReservation: vi.fn(),
  listHostawayConversationMessages: vi.fn(),
  sendHostawayConversationMessage: vi.fn(),
  getHostawayListing: vi.fn(),
}));

vi.mock("@/lib/ai/process-message", () => ({
  processMessage: vi.fn(),
}));

vi.mock("@/lib/email/send", () => ({
  sendEmail: vi.fn(),
}));

import { Prisma, type HostawayConnection } from "@prisma/client";

import { processMessage } from "@/lib/ai/process-message";
import { prisma } from "@/lib/db/prisma";
import { sendEmail } from "@/lib/email/send";
import { getHostawayAccessToken } from "@/lib/hostaway/auth";
import {
  getHostawayConversation,
  getHostawayListing,
  listHostawayConversationMessages,
  sendHostawayConversationMessage,
} from "@/lib/hostaway/client";
import { handleHostawayInbound } from "@/lib/hostaway/inbound";
import { resetHostawaySendRateLimitForTests } from "@/lib/hostaway/rate-limit";

const CONNECTION: HostawayConnection = {
  id: "conn-1",
  orgId: "org-1",
  agentId: "agent-1",
  accountId: "10450",
  apiKeyEnc: "enc-key",
  accessTokenEnc: null,
  accessTokenExpiresAt: null,
  webhookId: "2",
  webhookLogin: "anselio_user",
  webhookPasswordEnc: "enc-password",
  webhookRegisteredAt: new Date(),
  autoReplyEnabled: true,
  escalationEmail: null,
  lastConnectedAt: new Date(),
  lastError: null,
  lastErrorAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const CONVERSATION = {
  id: 1406,
  listingMapId: 40160,
  reservationId: 2,
  Reservation: {
    id: 2,
    listingMapId: 40160,
    listingName: "Casa Atlas",
    channelId: 2018,
    channelName: "airbnb",
    reservationId: "res-1",
    hostawayReservationId: 2,
    guestName: "Sarah",
    arrivalDate: "2026-11-08",
    departureDate: "2026-11-10",
    nights: 2,
    numberOfGuests: 2,
    status: "new",
  },
};

const INBOUND_MESSAGE = {
  id: 326,
  conversationId: 1406,
  body: "Can we check in early?",
  isIncoming: 1,
};

const PAYLOAD = {
  id: 9,
  accountId: 10450,
  object: "conversationMessage",
  objectId: 326,
  event: "message.received",
  data: { conversationId: 1406, messageId: 326, reservationId: 2 },
};

describe("handleHostawayInbound", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetHostawaySendRateLimitForTests();

    vi.mocked(prisma.agent.findFirst).mockResolvedValue({
      id: "agent-1",
      orgId: "org-1",
      status: "ACTIVE",
      channels: [{ enabled: true }],
    } as never);
    vi.mocked(getHostawayAccessToken).mockResolvedValue("hostaway-token");
    vi.mocked(getHostawayConversation).mockResolvedValue(CONVERSATION as never);
    vi.mocked(listHostawayConversationMessages).mockResolvedValue([
      INBOUND_MESSAGE,
    ] as never);
    vi.mocked(getHostawayListing).mockResolvedValue({
      id: 40160,
      name: "Casa Atlas",
      houseRules: "No parties",
      checkInTimeStart: 15,
      checkOutTime: 11,
    } as never);
    vi.mocked(prisma.hostawayMessageDedupe.create).mockResolvedValue({} as never);
    vi.mocked(prisma.hostawayMessageDedupe.deleteMany).mockResolvedValue({
      count: 0,
    } as never);
    vi.mocked(prisma.hostawayConversation.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.hostawayConversation.create).mockResolvedValue({} as never);
    vi.mocked(prisma.hostawayConversation.update).mockResolvedValue({} as never);
    vi.mocked(prisma.session.create).mockResolvedValue({ id: "session-1" } as never);
    vi.mocked(prisma.message.create).mockResolvedValue({} as never);
    vi.mocked(processMessage).mockResolvedValue({
      botContent: "Early check-in is subject to availability.",
      sessionId: "session-1",
    });
    vi.mocked(sendHostawayConversationMessage).mockResolvedValue({
      id: 400,
    } as never);
    vi.mocked(sendEmail).mockResolvedValue({ messageId: "email-1" });
  });

  it("ignores our own outgoing messages", async () => {
    vi.mocked(listHostawayConversationMessages).mockResolvedValue([
      { ...INBOUND_MESSAGE, isIncoming: 0 },
    ] as never);

    const result = await handleHostawayInbound({
      connection: CONNECTION,
      payload: PAYLOAD,
    });

    expect(result).toEqual({ status: "ignored", reason: "outgoing_message" });
    expect(prisma.hostawayMessageDedupe.create).not.toHaveBeenCalled();
    expect(processMessage).not.toHaveBeenCalled();
    expect(sendHostawayConversationMessage).not.toHaveBeenCalled();
  });

  it("runs the existing AI pipeline and replies inside the channel thread", async () => {
    vi.mocked(prisma.hostawayConversation.findUnique).mockResolvedValueOnce({
      id: "map-1",
      sessionId: "session-1",
      propertyContext: "Property: Casa Atlas",
      session: { id: "session-1", status: "ACTIVE" },
    } as never);

    const result = await handleHostawayInbound({
      connection: CONNECTION,
      payload: PAYLOAD,
    });

    expect(result.status).toBe("replied");
    expect(processMessage).toHaveBeenCalledTimes(1);

    const call = vi.mocked(processMessage).mock.calls[0][0];
    expect(call.channel).toBe("HOSTAWAY");
    expect(call.message).toBe("Can we check in early?");
    expect(call.extraContext).toContain("Airbnb");
    expect(call.extraContext).toContain("Casa Atlas");

    expect(sendHostawayConversationMessage).toHaveBeenCalledWith(
      "hostaway-token",
      "1406",
      "Early check-in is subject to availability.",
    );
    expect(prisma.message.create).toHaveBeenCalledTimes(2);
  });

  it("never auto-replies during human takeover", async () => {
    vi.mocked(prisma.hostawayConversation.findUnique).mockResolvedValueOnce({
      id: "map-1",
      sessionId: "session-1",
      propertyContext: null,
      session: { id: "session-1", status: "HUMAN" },
    } as never);

    const result = await handleHostawayInbound({
      connection: CONNECTION,
      payload: PAYLOAD,
    });

    expect(result).toEqual({ status: "ignored", reason: "human_takeover" });
    expect(processMessage).not.toHaveBeenCalled();
    expect(sendHostawayConversationMessage).not.toHaveBeenCalled();
    expect(prisma.message.create).toHaveBeenCalledTimes(1);
  });

  it("dedupes webhook retries", async () => {
    vi.mocked(prisma.hostawayMessageDedupe.create).mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint", {
        code: "P2002",
        clientVersion: "test",
      }),
    );

    const result = await handleHostawayInbound({
      connection: CONNECTION,
      payload: PAYLOAD,
    });

    expect(result).toEqual({ status: "ignored", reason: "duplicate_message" });
    expect(processMessage).not.toHaveBeenCalled();
    expect(sendHostawayConversationMessage).not.toHaveBeenCalled();
  });

  it("stores messages without replying when automatic replies are off", async () => {
    const result = await handleHostawayInbound({
      connection: { ...CONNECTION, autoReplyEnabled: false },
      payload: PAYLOAD,
    });

    expect(result).toEqual({ status: "ignored", reason: "auto_reply_disabled" });
    expect(processMessage).not.toHaveBeenCalled();
    expect(sendHostawayConversationMessage).not.toHaveBeenCalled();
    expect(prisma.message.create).toHaveBeenCalledTimes(1);
  });

  it("sends a handoff message and notifies the property team on escalation", async () => {
    vi.mocked(processMessage).mockResolvedValue({
      botContent: "I cannot help with that.",
      sessionId: "session-1",
      escalation: {
        shouldEscalate: true,
        reason: "Customer requested a human",
      },
      customerFacingMessage: "Connecting you to the property team.",
    });

    const result = await handleHostawayInbound({
      connection: { ...CONNECTION, escalationEmail: "team@property.com" },
      payload: PAYLOAD,
    });

    expect(result.status).toBe("escalated");
    expect(sendHostawayConversationMessage).toHaveBeenCalledWith(
      "hostaway-token",
      "1406",
      "Connecting you to the property team.",
    );
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "team@property.com" }),
    );
  });
});
