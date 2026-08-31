import { describe, expect, it } from "vitest";

import {
  isDepartmentAllowed,
  parseBookAppointmentActionConfig,
  resolveBookAppointmentAction,
  resolveDepartmentMatch,
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
    expect(parsed.departments).toEqual(["sales", "support"]);
    expect(parsed.notifyEmail).toBe("team@example.com");
    expect(parsed.calendarProvider).toBe("google");
    expect(parsed.durationMinutes).toBe(45);
    expect(parsed.workingHours).toEqual({ days: [1, 2, 3], start: "09:00", end: "17:00" });
  });

  it("resolves defaults when channel config is missing", () => {
    const resolved = resolveBookAppointmentAction([]);
    expect(resolved.enabled).toBe(false);
    expect(resolved.whenToOffer).toBe("intent_only");
    expect(resolved.departments).toContain("support");
    expect(resolved.departments).toContain("general");
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
    expect(resolved.departments).toEqual(["sales"]);
    expect(isDepartmentAllowed(resolved, "sales")).toBe(true);
    expect(isDepartmentAllowed(resolved, "billing")).toBe(false);
  });

  it("uses healthcare departments when agent type is HEALTHCARE_MEDICAL and departments were never set", () => {
    const resolved = resolveBookAppointmentAction([], {
      agentType: "HEALTHCARE_MEDICAL",
    });
    expect(resolved.departments).toContain("cardiologie");
    expect(resolved.departments).toContain("pediatrie");
    expect(resolved.departments).not.toContain("sales");
    expect(resolved.departments).not.toContain("billing");
  });

  it("keeps explicitly configured departments for healthcare agents", () => {
    const resolved = resolveBookAppointmentAction(
      [
        {
          channel: "WEB_CHAT",
          enabled: true,
          config: {
            actions: {
              bookAppointment: {
                enabled: true,
                departments: ["sales"],
              },
            },
          },
        },
      ],
      { agentType: "HEALTHCARE_MEDICAL" },
    );
    expect(resolved.departments).toEqual(["sales"]);
  });
});

describe("resolveDepartmentMatch", () => {
  const action = {
    departments: ["general", "cardiologie", "pediatrie", "gynecologie"],
  };

  it("returns the canonical name for an exact match", () => {
    expect(resolveDepartmentMatch(action, "Cardiologie")).toBe("cardiologie");
  });

  it("maps colloquial prefixes like cardio to cardiologie", () => {
    expect(resolveDepartmentMatch(action, "cardio")).toBe("cardiologie");
    expect(resolveDepartmentMatch(action, "ped")).toBe("pediatrie");
  });

  it("does not match very short or unknown input", () => {
    expect(resolveDepartmentMatch(action, "g")).toBeNull();
    expect(resolveDepartmentMatch(action, "billing")).toBeNull();
  });
});
