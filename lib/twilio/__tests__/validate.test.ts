import { describe, it, expect, vi, beforeEach } from "vitest";

describe("validateTwilioWebhook", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it("returns false when signature header is missing", async () => {
    const { validateTwilioWebhook } = await import("../validate");
    const result = await validateTwilioWebhook({
      twilioSignature: null,
      url: "https://example.com/api/webhooks/twilio/message",
      bodyParams: {},
    });
    expect(result).toBe(false);
  }, 15000);

  it("returns false when auth token is not configured", async () => {
    vi.stubEnv("TWILIO_AUTH_TOKEN", "");
    const { validateTwilioWebhook } = await import("../validate");
    const result = await validateTwilioWebhook({
      twilioSignature: "some-signature",
      url: "https://example.com/api/webhooks/twilio/message",
      bodyParams: { Body: "hello" },
    });
    expect(result).toBe(false);
  });

  it("delegates to twilio validateRequest and returns its result", async () => {
    vi.stubEnv("TWILIO_AUTH_TOKEN", "test-token");

    const { validateTwilioWebhook } = await import("../validate");

    const result = await validateTwilioWebhook({
      twilioSignature: "invalid-signature",
      url: "https://example.com/api/webhooks/twilio/message",
      bodyParams: { Body: "hello", From: "whatsapp:+1234567890" },
    });

    expect(result).toBe(false);
  });
});
