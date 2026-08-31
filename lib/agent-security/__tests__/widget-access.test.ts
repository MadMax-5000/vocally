import { describe, expect, it } from "vitest";

import { ORIGIN_NOT_ALLOWED_ERROR } from "@/lib/agent-security/constants";
import {
  denyIfOriginNotAllowed,
  isWidgetTokenRequired,
  resolveWidgetChatRateLimit,
} from "@/lib/agent-security/widget-access";
import { PRODUCT_ASSISTANT_DEFAULT_RATE_LIMIT } from "@/lib/ai/product-assistant-agent";

describe("denyIfOriginNotAllowed", () => {
  it("allows any origin when the allowlist is empty", () => {
    const headers = new Headers({ origin: "https://other.com" });
    expect(denyIfOriginNotAllowed(headers, [])).toBeNull();
  });

  it("rejects a missing or unknown origin when allowlisted", () => {
    const allowed = ["shop.example.com"];
    expect(denyIfOriginNotAllowed(new Headers(), allowed)).toEqual({
      status: 403,
      error: ORIGIN_NOT_ALLOWED_ERROR,
    });
    expect(
      denyIfOriginNotAllowed(
        new Headers({ origin: "https://evil.com" }),
        allowed,
      ),
    ).toEqual({
      status: 403,
      error: ORIGIN_NOT_ALLOWED_ERROR,
    });
    expect(
      denyIfOriginNotAllowed(
        new Headers({ origin: "https://shop.example.com" }),
        allowed,
      ),
    ).toBeNull();
  });
});

describe("isWidgetTokenRequired", () => {
  it("does not require a token for owner preview", () => {
    expect(isWidgetTokenRequired("agent_1", true)).toBe(false);
  });

  it("requires a token for tenant agents when the product-assistant id is unset", () => {
    expect(isWidgetTokenRequired("agent_1", false)).toBe(true);
  });
});

describe("resolveWidgetChatRateLimit", () => {
  it("keeps the configured limit for tenant agents", () => {
    expect(resolveWidgetChatRateLimit("agent_1", 12)).toBe(12);
    expect(resolveWidgetChatRateLimit("agent_1", null)).toBeNull();
  });

  it("exposes the default product-assistant rate constant", () => {
    expect(PRODUCT_ASSISTANT_DEFAULT_RATE_LIMIT).toBe(20);
  });
});
