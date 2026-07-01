import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ResolvedCollectLeadsAction } from "@/lib/deploy/collect-leads-action";

const mockFindUnique = vi.fn();
const mockUpsert = vi.fn();
const mockUpdate = vi.fn();
const mockSessionFindFirst = vi.fn();
const mockAgentFindFirst = vi.fn();
const mockSendEmail = vi.fn();

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    agentLead: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      upsert: (...args: unknown[]) => mockUpsert(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    },
    session: {
      findFirst: (...args: unknown[]) => mockSessionFindFirst(...args),
    },
    agent: {
      findFirst: (...args: unknown[]) => mockAgentFindFirst(...args),
    },
  },
}));

vi.mock("@/lib/email/send", () => ({
  sendEmail: (...args: unknown[]) => mockSendEmail(...args),
}));

import { handleSaveLead } from "@/lib/ai/tools/handlers/save-lead";

const baseAction: ResolvedCollectLeadsAction = {
  enabled: true,
  whenToAsk: "intent_only",
  fields: {
    name: "optional",
    email: "required",
    phone: "off",
    company: "off",
    notes: "off",
  },
  consentText: "Consent text",
  notifyEmail: "team@company.com",
};

describe("handleSaveLead", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RESEND_API_KEY = "test-key";
    mockFindUnique.mockResolvedValue(null);
    mockSessionFindFirst.mockResolvedValue({ channel: "CHAT" });
    mockUpsert.mockResolvedValue({
      id: "lead-1",
      email: "a@example.com",
    });
    mockUpdate.mockResolvedValue({});
    mockAgentFindFirst.mockResolvedValue({ name: "Support Bot" });
    mockSendEmail.mockResolvedValue({ messageId: "msg-1" });
  });

  it("rejects when action disabled", async () => {
    const result = await handleSaveLead(
      { email: "a@example.com" },
      {
        orgId: "org-1",
        sessionId: "sess-1",
        agentId: "agent-1",
        collectLeads: { ...baseAction, enabled: false },
      },
    );
    expect(JSON.parse(result).error).toContain("not enabled");
  });

  it("upserts lead and reports missing required fields", async () => {
    const result = await handleSaveLead(
      { email: "a@example.com" },
      {
        orgId: "org-1",
        sessionId: "sess-1",
        agentId: "agent-1",
        channel: "CHAT",
        collectLeads: { ...baseAction, notifyEmail: null },
      },
    );

    const parsed = JSON.parse(result);
    expect(parsed.success).toBe(true);
    expect(parsed.leadId).toBe("lead-1");
    expect(parsed.savedFields).toContain("email");
    expect(mockUpsert).toHaveBeenCalled();
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("notifies when lead becomes complete", async () => {
    mockFindUnique.mockResolvedValue({
      id: "lead-1",
      email: null,
      name: null,
      phone: null,
      company: null,
      notes: null,
      notifiedAt: null,
    });

    const result = await handleSaveLead(
      { email: "complete@example.com" },
      {
        orgId: "org-1",
        sessionId: "sess-1",
        agentId: "agent-1",
        channel: "WHATSAPP",
        collectLeads: baseAction,
      },
    );

    const parsed = JSON.parse(result);
    expect(parsed.complete).toBe(true);

    await vi.waitFor(() => {
      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "team@company.com",
          subject: expect.stringContaining("Support Bot"),
        }),
      );
    });
    await vi.waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "lead-1" },
          data: { notifiedAt: expect.any(Date) },
        }),
      );
    });
  });

  it("does not notify on partial save", async () => {
    const partialAction: ResolvedCollectLeadsAction = {
      ...baseAction,
      fields: {
        name: "required",
        email: "required",
        phone: "off",
        company: "off",
        notes: "off",
      },
    };

    await handleSaveLead(
      { email: "partial@example.com" },
      {
        orgId: "org-1",
        sessionId: "sess-1",
        agentId: "agent-1",
        channel: "CHAT",
        collectLeads: partialAction,
      },
    );

    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("rejects when only off fields are provided", async () => {
    const result = await handleSaveLead(
      { phone: "+123" },
      {
        orgId: "org-1",
        sessionId: "sess-1",
        agentId: "agent-1",
        collectLeads: baseAction,
      },
    );
    expect(JSON.parse(result).error).toContain("at least one");
    expect(mockUpsert).not.toHaveBeenCalled();
  });
});
