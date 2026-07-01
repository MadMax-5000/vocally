import { beforeEach, describe, expect, it, vi } from "vitest";

const mockAgentLeadFindMany = vi.fn();
const mockFormSubmissionFindMany = vi.fn();
const mockAgentFindMany = vi.fn();
const mockAgentLeadCount = vi.fn();
const mockFormSubmissionCount = vi.fn();

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    agentLead: {
      findMany: (...args: unknown[]) => mockAgentLeadFindMany(...args),
      count: (...args: unknown[]) => mockAgentLeadCount(...args),
    },
    formSubmission: {
      findMany: (...args: unknown[]) => mockFormSubmissionFindMany(...args),
      count: (...args: unknown[]) => mockFormSubmissionCount(...args),
    },
    agent: {
      findMany: (...args: unknown[]) => mockAgentFindMany(...args),
    },
  },
}));

import { listOrgLeadsFromDb } from "@/lib/leads/list-org-leads";

describe("listOrgLeadsFromDb", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAgentLeadCount.mockResolvedValue(1);
    mockFormSubmissionCount.mockResolvedValue(1);
    mockAgentFindMany.mockResolvedValue([
      {
        id: "agent-1",
        channels: [
          {
            config: {
              actions: {
                customForm: {
                  title: "Contact us",
                  fields: [
                    { id: "email", type: "email", label: "Email", required: true },
                    { id: "name", type: "text", label: "Name", required: false },
                  ],
                },
              },
            },
          },
        ],
      },
    ]);
  });

  it("merges collect leads and form submissions sorted by createdAt desc", async () => {
    mockAgentLeadFindMany.mockResolvedValue([
      {
        id: "lead-1",
        agentId: "agent-1",
        sessionId: "sess-1",
        name: "Ada",
        email: "ada@example.com",
        phone: null,
        company: null,
        notes: null,
        source: "CHAT",
        createdAt: new Date("2026-01-02T12:00:00Z"),
        agent: { name: "Support Bot" },
      },
    ]);
    mockFormSubmissionFindMany.mockResolvedValue([
      {
        id: "form-1",
        agentId: "agent-1",
        sessionId: "sess-2",
        values: { email: "bob@example.com", name: "Bob" },
        createdAt: new Date("2026-01-03T12:00:00Z"),
        agent: { name: "Support Bot" },
      },
    ]);

    const result = await listOrgLeadsFromDb("org-1", { limit: 10 });

    expect(result.total).toBe(2);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]?.captureType).toBe("custom_form");
    expect(result.rows[0]?.email).toBe("bob@example.com");
    expect(result.rows[1]?.captureType).toBe("collect_leads");
    expect(result.rows[1]?.name).toBe("Ada");
  });

  it("filters by captureType collect_leads only", async () => {
    mockAgentLeadFindMany.mockResolvedValue([]);
    mockFormSubmissionFindMany.mockResolvedValue([]);

    await listOrgLeadsFromDb("org-1", {
      captureType: "collect_leads",
      limit: 10,
    });

    expect(mockAgentLeadFindMany).toHaveBeenCalled();
    expect(mockFormSubmissionFindMany).not.toHaveBeenCalled();
    expect(mockFormSubmissionCount).not.toHaveBeenCalled();
  });

  it("maps form submission label from email field", async () => {
    mockAgentLeadFindMany.mockResolvedValue([]);
    mockFormSubmissionFindMany.mockResolvedValue([
      {
        id: "form-1",
        agentId: "agent-1",
        sessionId: null,
        values: { email: "test@example.com" },
        createdAt: new Date("2026-01-01T12:00:00Z"),
        agent: { name: "Bot" },
      },
    ]);

    const result = await listOrgLeadsFromDb("org-1", { limit: 10 });

    expect(result.rows[0]?.label).toBe("test@example.com");
    expect(result.rows[0]?.detail).toEqual({ Email: "test@example.com" });
  });
});
