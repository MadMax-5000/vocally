import { describe, expect, it } from "vitest";

import { EscalationTrigger } from "@/lib/ai/escalation-service";
import {
  DEFAULT_ESCALATION_CUSTOMER_MESSAGE,
  parseEscalationActionConfig,
  resolveEscalationAction,
  resolveEscalationTriggers,
  resolveCustomerEscalationMessage,
} from "@/lib/deploy/escalation-action";

describe("escalation-action", () => {
  it("parses action config fields", () => {
    const parsed = parseEscalationActionConfig({
      enabled: true,
      triggers: {
        userRequested: true,
        negativeSentiment: false,
        aiFailure: true,
        unsupportedRequest: false,
      },
      customerMessage: "Please hold.",
      createTicketOnEscalate: true,
      allowCreateTicketTool: false,
      ticketPriority: "HIGH",
      requireEmailForTicket: true,
    });
    expect(parsed.enabled).toBe(true);
    expect(parsed.triggers?.negativeSentiment).toBe(false);
    expect(parsed.customerMessage).toBe("Please hold.");
    expect(parsed.createTicketOnEscalate).toBe(true);
    expect(parsed.ticketPriority).toBe("HIGH");
    expect(parsed.requireEmailForTicket).toBe(true);
  });

  it("resolves defaults when channel config is missing", () => {
    const resolved = resolveEscalationAction([]);
    expect(resolved.enabled).toBe(false);
    expect(resolved.customerMessage).toBe(DEFAULT_ESCALATION_CUSTOMER_MESSAGE);
    expect(resolved.createTicketOnEscalate).toBe(false);
    expect(resolved.ticketPriority).toBe("MEDIUM");
  });

  it("maps trigger flags to EscalationTrigger list", () => {
    const enabled = resolveEscalationTriggers({
      userRequested: true,
      negativeSentiment: false,
      aiFailure: false,
      unsupportedRequest: true,
    });
    expect(enabled).toEqual([
      EscalationTrigger.USER_REQUESTED,
      EscalationTrigger.UNSUPPORTED_REQUEST,
    ]);
  });

  it("resolves customer message with fallback", () => {
    expect(resolveCustomerEscalationMessage({ customerMessage: "  " })).toBe(
      DEFAULT_ESCALATION_CUSTOMER_MESSAGE,
    );
    expect(resolveCustomerEscalationMessage({ customerMessage: "Hold on" })).toBe(
      "Hold on",
    );
  });
});
