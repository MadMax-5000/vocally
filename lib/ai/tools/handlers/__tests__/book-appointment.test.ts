import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ResolvedBookAppointmentAction } from "@/lib/deploy/book-appointment-action";
import { CalendarSlotTakenError } from "@/lib/calendar/types";

const mockCreate = vi.fn();
const mockAgentFindFirst = vi.fn();
const mockBookExternalSlot = vi.fn();

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

vi.mock("@/lib/calendar/service", async () => {
  const actual = await vi.importActual<typeof import("@/lib/calendar/service")>(
    "@/lib/calendar/service",
  );
  return {
    ...actual,
    bookExternalSlot: (...args: unknown[]) => mockBookExternalSlot(...args),
  };
});

import { handleBookAppointment } from "@/lib/ai/tools/handlers";

const baseAction: ResolvedBookAppointmentAction = {
  enabled: true,
  whenToOffer: "intent_only",
  departments: ["sales", "support"],
  notifyEmail: null,
  calendarProvider: "none",
  timezone: "Africa/Casablanca",
  durationMinutes: 30,
  slotIntervalMinutes: 30,
  workingHours: { days: [1, 2, 3, 4, 5], start: "09:00", end: "18:00" },
  maxDaysAhead: 14,
  eventTypeUri: null,
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
    expect(mockBookExternalSlot).not.toHaveBeenCalled();
  });

  it("refuses a taken calendar slot and does not write Anselio", async () => {
    mockBookExternalSlot.mockRejectedValue(new CalendarSlotTakenError());
    const result = await handleBookAppointment(
      {
        date: "2026-07-10",
        time: "10:00",
        department: "sales",
        customerName: "Ahmed",
        customerEmail: "ahmed@example.com",
      },
      {
        orgId: "org-1",
        sessionId: "sess-1",
        bookAppointment: {
          ...baseAction,
          calendarProvider: "google",
        },
        calendarConnection: {
          id: "cal-1",
          orgId: "org-1",
          agentId: "agent-1",
          provider: "GOOGLE",
          refreshTokenEnc: "enc",
          accessTokenEnc: null,
          tokenExpiresAt: null,
          accountEmail: "clinic@example.com",
          calendarId: "primary",
          externalUserUri: null,
          externalOrgUri: null,
        },
      },
    );
    const parsed = JSON.parse(result);
    expect(parsed.error).toContain("no longer available");
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("creates the calendar event then the Anselio row", async () => {
    mockBookExternalSlot.mockResolvedValue({ eventId: "evt-1" });
    const result = await handleBookAppointment(
      {
        date: "2026-07-10",
        time: "10:00",
        department: "sales",
        customerName: "Ahmed",
        customerEmail: "ahmed@example.com",
      },
      {
        orgId: "org-1",
        sessionId: "sess-1",
        bookAppointment: {
          ...baseAction,
          calendarProvider: "google",
        },
        calendarConnection: {
          id: "cal-1",
          orgId: "org-1",
          agentId: "agent-1",
          provider: "GOOGLE",
          refreshTokenEnc: "enc",
          accessTokenEnc: null,
          tokenExpiresAt: null,
          accountEmail: "clinic@example.com",
          calendarId: "primary",
          externalUserUri: null,
          externalOrgUri: null,
        },
      },
    );
    const parsed = JSON.parse(result);
    expect(parsed.success).toBe(true);
    expect(mockBookExternalSlot).toHaveBeenCalledOnce();
    expect(mockCreate).toHaveBeenCalledOnce();
    expect(mockCreate.mock.calls[0][0].data.externalEventId).toBe("evt-1");
    expect(mockCreate.mock.calls[0][0].data.externalProvider).toBe("GOOGLE");
  });
});
