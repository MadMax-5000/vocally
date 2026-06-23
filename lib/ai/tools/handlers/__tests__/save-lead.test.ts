import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ResolvedCollectLeadsAction } from "@/lib/deploy/collect-leads-action";

const mockFindUnique = vi.fn();
const mockUpsert = vi.fn();
const mockSessionFindFirst = vi.fn();

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    agentLead: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      upsert: (...args: unknown[]) => mockUpsert(...args),
    },
    session: {
      findFirst: (...args: unknown[]) => mockSessionFindFirst(...args),
    },
    agent: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock("@/lib/email/send", () => ({
  sendEmail: vi.fn(),
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
  notifyEmail: null,
};

describe("handleSaveLead", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindUnique.mockResolvedValue(null);
    mockSessionFindFirst.mockResolvedValue({ channel: "CHAT" });
    mockUpsert.mockResolvedValue({
      id: "lead-1",
      email: "a@example.com",
    });
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
        collectLeads: baseAction,
      },
    );

    const parsed = JSON.parse(result);
    expect(parsed.success).toBe(true);
    expect(parsed.leadId).toBe("lead-1");
    expect(parsed.savedFields).toContain("email");
    expect(mockUpsert).toHaveBeenCalled();
  });

  it("rejects off fields", async () => {
    const result = await handleSaveLead(
      { phone: "+123" },
      {
        orgId: "org-1",
        sessionId: "sess-1",
        agentId: "agent-1",
        collectLeads: baseAction,
      },
    );
    expect(JSON.parse(result).error).toContain("phone");
  });
});
