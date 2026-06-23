import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    messengerConnection: {
      findUnique: vi.fn(),
    },
    session: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    message: {
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/ai/process-message", () => ({
  processMessage: vi.fn(),
}));

vi.mock("@/lib/meta/send", () => ({
  sendMessengerText: vi.fn(),
}));

import { prisma } from "@/lib/db/prisma";
import { processMessage } from "@/lib/ai/process-message";
import { sendMessengerText } from "@/lib/meta/send";

describe("Messenger Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should ignore events when no connection exists", async () => {
    vi.mocked(prisma.messengerConnection.findUnique).mockResolvedValue(null as any);

    const { messengerService } = await import("../service");

    await messengerService.handleMessengerWebhookEvent({
      object: "page",
      entry: [
        {
          id: "page-1",
          messaging: [
            {
              sender: { id: "psid-1" },
              message: { text: "Hello" },
            },
          ],
        },
      ],
    });

    expect(prisma.messengerConnection.findUnique).toHaveBeenCalledWith({
      where: { pageId: "page-1" },
      include: {
        org: { select: { id: true } },
        agent: { select: { id: true, status: true, channels: { where: { channel: "MESSENGER" } } } },
      },
    });
    expect(sendMessengerText).not.toHaveBeenCalled();
  });

  it("should process inbound text and reply", async () => {
    vi.mocked(prisma.messengerConnection.findUnique).mockResolvedValue({
      pageId: "page-1",
      pageAccessTokenEnc: "enc-token",
      org: { id: "org-1" },
      agent: { id: "agent-1", status: "ACTIVE", channels: [{ enabled: true }] },
    } as any);

    vi.mocked(prisma.session.findFirst).mockResolvedValue(null as any);
    vi.mocked(prisma.session.create).mockResolvedValue({ id: "session-1" } as any);
    vi.mocked(prisma.message.create).mockResolvedValue({} as any);

    vi.mocked(processMessage).mockResolvedValue({
      botContent: "Hi there!",
      sessionId: "session-1",
    } as any);

    const { messengerService } = await import("../service");

    await messengerService.handleMessengerWebhookEvent({
      object: "page",
      entry: [
        {
          id: "page-1",
          messaging: [
            {
              sender: { id: "psid-1" },
              message: { text: "Hello" },
            },
          ],
        },
      ],
    });

    expect(prisma.session.create).toHaveBeenCalledWith({
      data: {
        orgId: "org-1",
        agentId: "agent-1",
        channel: "MESSENGER",
        status: "ACTIVE",
        customerId: "psid-1",
        language: "auto",
      },
    });

    expect(processMessage).toHaveBeenCalledWith({
      orgId: "org-1",
      agentId: "agent-1",
      sessionId: "session-1",
      message: "Hello",
    });

    expect(sendMessengerText).toHaveBeenCalledWith({
      pageId: "page-1",
      pageAccessTokenEnc: "enc-token",
      recipientPsid: "psid-1",
      text: "Hi there!",
    });
  });
});

