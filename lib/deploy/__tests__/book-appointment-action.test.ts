import { describe, expect, it } from "vitest";

import {
  isDepartmentAllowed,
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
    });
    expect(parsed.enabled).toBe(true);
    expect(parsed.whenToOffer).toBe("proactive");
    expect(parsed.departments).toEqual(["sales", "support"]);
    expect(parsed.notifyEmail).toBe("team@example.com");
  });

  it("resolves defaults when channel config is missing", () => {
    const resolved = resolveBookAppointmentAction([]);
    expect(resolved.enabled).toBe(false);
    expect(resolved.whenToOffer).toBe("intent_only");
    expect(resolved.departments).toContain("support");
    expect(resolved.departments).toContain("general");
    expect(resolved.notifyEmail).toBeNull();
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
});
