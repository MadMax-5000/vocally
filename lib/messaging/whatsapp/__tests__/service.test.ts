import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    whatsappPhoneNumber: {
      findUnique: vi.fn(),
    },
    session: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    message: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    agent: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}));

vi.mock("@/lib/twilio/client", () => ({
  sendWhatsAppMessage: vi.fn(),
}));

vi.mock("@/lib/ai/process-message", () => ({
  processMessage: vi.fn(),
}));

import { prisma } from "@/lib/db/prisma";
import { sendWhatsAppMessage } from "@/lib/twilio/client";
import { processMessage } from "@/lib/ai/process-message";

const mockSession = (id: string) =>
  ({
    id,
    createdAt: new Date(),
    orgId: "org-1",
    channel: "CHAT",
    language: "auto",
    status: "ACTIVE",
    customerId: null,
    agentId: null,
    summary: null,
    sentiment: null,
    resolvedByAI: false,
    startedAt: new Date(),
    endedAt: null,
    callLog: null,
  }) as any;

const mockNumberMapping = (overrides: Record<string, unknown> = {}) =>
  ({
    id: "wpn-1",
    orgId: "org-1",
    agentId: "agent-1",
    twilioNumber: "whatsapp:+14155238886",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    org: { id: "org-1" },
    ...overrides,
  }) as any;

describe("WhatsApp Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return null when no number mapping exists", async () => {
    vi.mocked(prisma.whatsappPhoneNumber.findUnique).mockResolvedValue(null);

    const { whatsAppService } = await import("../service");

    const result = await whatsAppService.resolveOrganization("whatsapp:+14155238886");
    expect(result).toBeNull();
  });

  it("should resolve to orgId when mapping exists", async () => {
    vi.mocked(prisma.whatsappPhoneNumber.findUnique).mockResolvedValue(mockNumberMapping());

    const { whatsAppService } = await import("../service");

    const result = await whatsAppService.resolveOrganization("whatsapp:+14155238886");
    expect(result).toEqual({
      sessionId: "",
      orgId: "org-1",
      agentId: "agent-1",
      isNew: true,
    });
  });

  it("should return null for inactive mapping", async () => {
    vi.mocked(prisma.whatsappPhoneNumber.findUnique).mockResolvedValue(mockNumberMapping({ isActive: false }));

    const { whatsAppService } = await import("../service");

    const result = await whatsAppService.resolveOrganization("whatsapp:+14155238886");
    expect(result).toBeNull();
  });

  it("should find existing active session", async () => {
    vi.mocked(prisma.session.findFirst).mockResolvedValue(mockSession("session-1"));

    const { whatsAppService } = await import("../service");

    const result = await whatsAppService.findActiveSession("org-1", "+1234567890");
    expect(result).toBe("session-1");
    expect(prisma.session.findFirst).toHaveBeenCalledWith({
      where: {
        orgId: "org-1",
        customerId: "+1234567890",
        channel: "WHATSAPP",
        status: { in: ["ACTIVE", "WAITING", "BOT"] },
      },
      select: { id: true },
      orderBy: { createdAt: "desc" },
    });
  });

  it("should return null when no active session exists", async () => {
    vi.mocked(prisma.session.findFirst).mockResolvedValue(null);

    const { whatsAppService } = await import("../service");

    const result = await whatsAppService.findActiveSession("org-1", "+1234567890");
    expect(result).toBeNull();
  });

  it("should handle inbound message end-to-end", async () => {
    vi.mocked(prisma.whatsappPhoneNumber.findUnique).mockResolvedValue(mockNumberMapping());
    vi.mocked(prisma.session.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.session.create).mockResolvedValue(mockSession("session-new-1"));
    vi.mocked(prisma.message.create).mockResolvedValue({} as any);
    vi.mocked(prisma.agent.findUnique).mockResolvedValue({
      id: "agent-1",
      orgId: "org-1",
      name: "Test Agent",
      org: { name: "Test Org" },
      instructions: null,
      creativity: "BALANCED",
      llmModel: "openai/gpt-4.1-mini",
      knowledgeDocs: [],
    } as any);
    vi.mocked(processMessage).mockResolvedValue({
      botContent: "Hello! How can I help you?",
      sessionId: "session-new-1",
    });
    vi.mocked(sendWhatsAppMessage).mockResolvedValue({ messageSid: "SM-test" });

    const { whatsAppService } = await import("../service");

    await whatsAppService.handleInboundMessage({
      MessageSid: "SM-test",
      From: "whatsapp:+1234567890",
      To: "whatsapp:+14155238886",
      Body: "Hello",
      ProfileName: "Test User",
    });

    expect(prisma.whatsappPhoneNumber.findUnique).toHaveBeenCalledWith({
      where: { twilioNumber: "whatsapp:+14155238886" },
      include: { org: { select: { id: true } } },
    });
    expect(prisma.session.create).toHaveBeenCalled();
    expect(prisma.message.create).toHaveBeenCalledTimes(2);
    expect(processMessage).toHaveBeenCalledWith({
      orgId: "org-1",
      agentId: "agent-1",
      sessionId: "session-new-1",
      message: "Hello",
    });
    expect(sendWhatsAppMessage).toHaveBeenCalledWith({
      to: "whatsapp:+1234567890",
      from: "whatsapp:+14155238886",
      body: "Hello! How can I help you?",
    });
  });
});
