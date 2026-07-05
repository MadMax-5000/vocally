import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ResolvedBookAppointmentAction } from "@/lib/deploy/book-appointment-action";

const mockCreate = vi.fn();
const mockAgentFindFirst = vi.fn();

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    appointment: {
      create: (...args: unknown[]) => mockCreate(...args),
    },
    agent: {
      findFirst: (...args: unknown[]) => mockAgentFindFirst(...args),
    },
  },
}));

vi.mock("@/lib/leads/notify-lead", () => ({
  notifyLeadCaptured: vi.fn(),
  formatAppointmentEmailLines: vi.fn(() => []),
}));

import { handleBookAppointment } from "@/lib/ai/tools/handlers";

const baseAction: ResolvedBookAppointmentAction = {
  enabled: true,
  whenToOffer: "intent_only",
  departments: ["sales", "support"],
  notifyEmail: null,
};

describe("handleBookAppointment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreate.mockResolvedValue({
      id: "appt-1",
      customerName: "Ahmed",
      customerEmail: null,
      department: "sales",
      time: "10:00",
      notes: null,
    });
  });

  it("rejects when action disabled", async () => {
    const result = await handleBookAppointment(
      {
        date: "2026-07-10",
        time: "10:00",
        department: "sales",
        customerName: "Ahmed",
      },
      {
        orgId: "org-1",
        sessionId: "sess-1",
        bookAppointment: { ...baseAction, enabled: false },
      },
    );
    expect(JSON.parse(result).error).toContain("not enabled");
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("rejects invalid department", async () => {
    const result = await handleBookAppointment(
      {
        date: "2026-07-10",
        time: "10:00",
        department: "billing",
        customerName: "Ahmed",
      },
      {
        orgId: "org-1",
        sessionId: "sess-1",
        bookAppointment: baseAction,
      },
    );
    const parsed = JSON.parse(result);
    expect(parsed.error).toContain("not available");
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("creates appointment when valid", async () => {
    const result = await handleBookAppointment(
      {
        date: "2026-07-10",
        time: "10:00",
        department: "sales",
        customerName: "Ahmed",
      },
      {
        orgId: "org-1",
        sessionId: "sess-1",
        bookAppointment: baseAction,
      },
    );
    const parsed = JSON.parse(result);
    expect(parsed.success).toBe(true);
    expect(mockCreate).toHaveBeenCalledOnce();
  });
});
