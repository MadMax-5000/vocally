import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    emailAddress: {
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

vi.mock("@/lib/email/send", () => ({
  sendEmail: vi.fn(),
}));

vi.mock("@/lib/ai/process-message", () => ({
  processMessage: vi.fn(),
}));

import { prisma } from "@/lib/db/prisma";
import { sendEmail } from "@/lib/email/send";
import { processMessage } from "@/lib/ai/process-message";

const mockSession = (id: string) =>
  ({
    id,
    createdAt: new Date(),
    orgId: "org-1",
    channel: "EMAIL",
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

const mockEmailMapping = (overrides: Record<string, unknown> = {}) =>
  ({
    id: "ea-1",
    orgId: "org-1",
    agentId: "agent-1",
    email: "support@test.anselio.com",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    org: { id: "org-1" },
    ...overrides,
  }) as any;

describe("Email Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return null when no email mapping exists", async () => {
    vi.mocked(prisma.emailAddress.findUnique).mockResolvedValue(null);

    const { emailService } = await import("../service");

    const result = await emailService.resolveOrganization("support@test.anselio.com");
    expect(result).toBeNull();
  });

  it("should resolve to orgId when mapping exists", async () => {
    vi.mocked(prisma.emailAddress.findUnique).mockResolvedValue(mockEmailMapping());

    const { emailService } = await import("../service");

    const result = await emailService.resolveOrganization("support@test.anselio.com");
    expect(result).toEqual({
      sessionId: "",
      orgId: "org-1",
      agentId: "agent-1",
      isNew: true,
    });
  });

  it("should return null for inactive mapping", async () => {
    vi.mocked(prisma.emailAddress.findUnique).mockResolvedValue(mockEmailMapping({ isActive: false }));

    const { emailService } = await import("../service");

    const result = await emailService.resolveOrganization("support@test.anselio.com");
    expect(result).toBeNull();
  });

  it("should find existing active session", async () => {
    vi.mocked(prisma.session.findFirst).mockResolvedValue(mockSession("session-1"));

    const { emailService } = await import("../service");

    const result = await emailService.findActiveSession("org-1", "customer@example.com");
    expect(result).toBe("session-1");
    expect(prisma.session.findFirst).toHaveBeenCalledWith({
      where: {
        orgId: "org-1",
        customerId: "customer@example.com",
        channel: "EMAIL",
        status: { in: ["ACTIVE", "WAITING", "BOT"] },
      },
      select: { id: true },
      orderBy: { createdAt: "desc" },
    });
  });

  it("should return null when no active session exists", async () => {
    vi.mocked(prisma.session.findFirst).mockResolvedValue(null);

    const { emailService } = await import("../service");

    const result = await emailService.findActiveSession("org-1", "customer@example.com");
    expect(result).toBeNull();
  });

  it("should handle inbound email end-to-end", async () => {
    vi.mocked(prisma.emailAddress.findUnique).mockResolvedValue(mockEmailMapping());
    vi.mocked(prisma.session.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.session.create).mockResolvedValue(mockSession("session-new-1"));
    vi.mocked(prisma.message.create).mockResolvedValue({} as any);
    vi.mocked(prisma.agent.findFirst).mockResolvedValue({
      id: "agent-1",
      orgId: "org-1",
    } as any);
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
      botContent: "Thanks for your message! Let me check your order status.",
      sessionId: "session-new-1",
    });
    vi.mocked(sendEmail).mockResolvedValue({ messageId: "email-1" });

    const { emailService } = await import("../service");

    await emailService.handleInboundEmail({
      subject: "Order status",
      from: "customer@example.com",
      to: ["support@test.anselio.com"],
      text: "Where is my order?",
    });

    expect(prisma.emailAddress.findUnique).toHaveBeenCalledWith({
      where: { email: "support@test.anselio.com" },
      include: { org: { select: { id: true } } },
    });
    expect(prisma.session.create).toHaveBeenCalled();
    expect(prisma.message.create).toHaveBeenCalledTimes(2);
    expect(processMessage).toHaveBeenCalledWith({
      orgId: "org-1",
      agentId: "agent-1",
      sessionId: "session-new-1",
      message: "Where is my order?",
      channel: "EMAIL",
    });
    expect(sendEmail).toHaveBeenCalledWith({
      from: "support@test.anselio.com",
      to: "customer@example.com",
      subject: "Re: Order status",
      body: "Thanks for your message! Let me check your order status.",
    });
  });
});
