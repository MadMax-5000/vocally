import { createHmac } from "crypto";
import { describe, expect, it } from "vitest";

import {
  parseAssemblyAiWebhookEvent,
  verifyAssemblyAiSignature,
} from "@/lib/assemblyai/webhooks";

describe("verifyAssemblyAiSignature", () => {
  const secret = "a-long-random-signing-secret-at-least-32-chars";
  const body = '{"event":"call.connected"}';

  it("accepts a matching sha256 header", () => {
    const signature = `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
    expect(verifyAssemblyAiSignature(body, signature, secret)).toBe(true);
  });

  it("rejects a bad signature", () => {
    expect(verifyAssemblyAiSignature(body, "sha256=deadbeef", secret)).toBe(false);
  });

  it("rejects a missing header", () => {
    expect(verifyAssemblyAiSignature(body, null, secret)).toBe(false);
  });
});

describe("parseAssemblyAiWebhookEvent", () => {
  it("reads call.connected", () => {
    const event = parseAssemblyAiWebhookEvent({
      event_id: "e1",
      event: "call.connected",
      call: { call_id: "call_1", from_number: "+2126", to_number: "+2125" },
    });
    expect(event?.event).toBe("call.connected");
    expect(event?.call?.call_id).toBe("call_1");
  });

  it("returns null without an event type", () => {
    expect(parseAssemblyAiWebhookEvent({ call: { call_id: "x" } })).toBeNull();
  });
});
