import { describe, expect, it } from "vitest";

import {
  isWithinBusinessHours,
  parseWhatsappChannelConfig,
} from "@/lib/deploy/whatsapp-channel-config";
import {
  isLegacyWhatsappConnection,
  isWhatsappConnectAvailable,
  isWhatsappSandboxMode,
} from "@/lib/deploy/whatsapp-config";
import { mapTwilioSenderToConnectionStatus } from "@/lib/twilio/whatsapp-senders";

describe("whatsapp-config helpers", () => {
  it("detects legacy connections without sender SID", () => {
    expect(isLegacyWhatsappConnection({ twilioSenderSid: null, status: "PENDING" })).toBe(true);
    expect(isLegacyWhatsappConnection({ twilioSenderSid: "XE123", status: "ONLINE" })).toBe(false);
  });

  it("detects sandbox mode from env", () => {
    const prev = process.env.WHATSAPP_SANDBOX_MODE;
    process.env.WHATSAPP_SANDBOX_MODE = "true";
    expect(isWhatsappSandboxMode()).toBe(true);
    process.env.WHATSAPP_SANDBOX_MODE = prev;
  });
});

describe("whatsapp-channel-config", () => {
  it("parses partial config with defaults", () => {
    const config = parseWhatsappChannelConfig({ welcomeMessage: "Hi" });
    expect(config.welcomeMessage).toBe("Hi");
    expect(config.timezone).toBe("Africa/Casablanca");
  });

  it("returns true for business hours when disabled", () => {
    const config = parseWhatsappChannelConfig({ businessHoursEnabled: false });
    expect(isWithinBusinessHours(config)).toBe(true);
  });
});

describe("mapTwilioSenderToConnectionStatus", () => {
  it("maps Twilio statuses to connection statuses", () => {
    expect(mapTwilioSenderToConnectionStatus("ONLINE")).toBe("ONLINE");
    expect(mapTwilioSenderToConnectionStatus("VERIFYING")).toBe("VERIFYING_OTP");
    expect(mapTwilioSenderToConnectionStatus("CREATING")).toBe("CREATING");
  });
});

describe("isWhatsappConnectAvailable", () => {
  it("is a boolean", () => {
    expect(typeof isWhatsappConnectAvailable()).toBe("boolean");
  });
});
