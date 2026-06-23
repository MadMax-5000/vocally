import { describe, expect, it } from "vitest";

import {
  parseCollectLeadsActionConfig,
  resolveCollectLeadsAction,
  getRequiredLeadFields,
} from "@/lib/deploy/collect-leads-action";

describe("collect-leads-action", () => {
  it("parses action config fields", () => {
    const parsed = parseCollectLeadsActionConfig({
      enabled: true,
      whenToAsk: "proactive",
      fields: { email: "required", name: "optional", company: "off" },
      consentText: "Custom consent",
      notifyEmail: "team@example.com",
    });
    expect(parsed.enabled).toBe(true);
    expect(parsed.whenToAsk).toBe("proactive");
    expect(parsed.fields?.email).toBe("required");
    expect(parsed.consentText).toBe("Custom consent");
    expect(parsed.notifyEmail).toBe("team@example.com");
  });

  it("resolves defaults when channel config is missing", () => {
    const resolved = resolveCollectLeadsAction([]);
    expect(resolved.enabled).toBe(false);
    expect(resolved.whenToAsk).toBe("intent_only");
    expect(resolved.fields.email).toBe("required");
    expect(resolved.fields.company).toBe("off");
    expect(resolved.consentText.length).toBeGreaterThan(0);
    expect(resolved.notifyEmail).toBeNull();
  });

  it("resolves from WEB_CHAT channel config", () => {
    const resolved = resolveCollectLeadsAction([
      {
        channel: "WEB_CHAT",
        enabled: true,
        config: {
          actions: {
            collectLeads: {
              enabled: true,
              whenToAsk: "intent_only",
              fields: { phone: "required" },
            },
          },
        },
      },
    ]);
    expect(resolved.enabled).toBe(true);
    expect(resolved.fields.phone).toBe("required");
    expect(getRequiredLeadFields(resolved)).toContain("phone");
  });
});
