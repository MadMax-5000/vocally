import { describe, expect, it } from "vitest";

import {
  parseBookAppointmentActionConfig,
  resolveBookAppointmentAction,
} from "@/lib/deploy/book-appointment-action";

describe("book-appointment-action", () => {
  it("parses action config fields", () => {
    const parsed = parseBookAppointmentActionConfig({
      enabled: true,
      whenToOffer: "proactive",
      departments: ["Sales", "Support"],
      notifyEmail: "team@example.com",
      calendarProvider: "google",
      timezone: "Africa/Casablanca",
      durationMinutes: 45,
      workingHours: { days: [1, 2, 3], start: "09:00", end: "17:00" },
    });
    expect(parsed.enabled).toBe(true);
    expect(parsed.whenToOffer).toBe("proactive");
    expect(parsed.notifyEmail).toBe("team@example.com");
    expect(parsed.calendarProvider).toBe("google");
    expect(parsed.durationMinutes).toBe(45);
    expect(parsed.workingHours).toEqual({ days: [1, 2, 3], start: "09:00", end: "17:00" });
  });

  it("resolves defaults when channel config is missing", () => {
    const resolved = resolveBookAppointmentAction([]);
    expect(resolved.enabled).toBe(false);
    expect(resolved.whenToOffer).toBe("intent_only");
    expect(resolved.notifyEmail).toBeNull();
    expect(resolved.calendarProvider).toBe("none");
    expect(resolved.timezone).toBe("Africa/Casablanca");
    expect(resolved.durationMinutes).toBe(30);
  });

  it("resolves from WEB_CHAT channel config", () => {
    const resolved = resolveBookAppointmentAction([
      {
        channel: "WEB_CHAT",
        enabled: true,
        config: {
          actions: {
            bookAppointment: {
              enabled: true,
              departments: ["sales"],
              whenToOffer: "intent_only",
            },
          },
        },
      },
    ]);
    expect(resolved.enabled).toBe(true);
    expect(resolved.whenToOffer).toBe("intent_only");
  });
});
