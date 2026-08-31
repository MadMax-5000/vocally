import { describe, expect, it } from "vitest";

import { buildBookAppointmentPromptSection } from "@/lib/ai/prompts/book-appointment-prompt";
import type { ResolvedBookAppointmentAction } from "@/lib/deploy/book-appointment-action";

const baseAction: ResolvedBookAppointmentAction = {
  enabled: true,
  whenToOffer: "intent_only",
  departments: ["general", "cardiologie", "pediatrie"],
  notifyEmail: null,
  calendarProvider: "none",
  timezone: "Africa/Casablanca",
  durationMinutes: 30,
  slotIntervalMinutes: 30,
  workingHours: { days: [1, 2, 3, 4, 5], start: "09:00", end: "18:00" },
  maxDaysAhead: 14,
  eventTypeUri: null,
};

describe("buildBookAppointmentPromptSection", () => {
  it("tells the model to resolve relative dates and never ask for YYYY-MM-DD", () => {
    const section = buildBookAppointmentPromptSection(baseAction);

    expect(section).toContain("Available departments: general, cardiologie, pediatrie.");
    expect(section).toContain("Resolve relative and colloquial dates");
    expect(section).toContain("Never ask the customer to type a date as YYYY-MM-DD");
    expect(section).toContain("one short question at a time");
    expect(section).toContain("cardio → cardiologie");
    expect(section).toContain('never silently switch to "general"');
    expect(section).not.toContain("Ask for missing required details one or two at a time");
  });

  it("keeps live-calendar slot rules when a calendar is connected", () => {
    const section = buildBookAppointmentPromptSection({
      ...baseAction,
      calendarProvider: "google",
    });

    expect(section).toContain("list_available_slots");
    expect(section).toContain("Never invent a date or time.");
  });
});
