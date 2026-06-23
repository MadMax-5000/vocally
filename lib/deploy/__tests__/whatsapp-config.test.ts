import { describe, expect, it } from "vitest";

import {
  formatWhatsappDisplay,
  normalizeWhatsappSenderId,
} from "@/lib/deploy/whatsapp-config";

describe("whatsapp-config", () => {
  it("normalizes E.164 to whatsapp sender id", () => {
    expect(normalizeWhatsappSenderId("+14155238886")).toBe("whatsapp:+14155238886");
    expect(normalizeWhatsappSenderId("whatsapp:+14155238886")).toBe(
      "whatsapp:+14155238886",
    );
    expect(normalizeWhatsappSenderId("  +212612345678  ")).toBe(
      "whatsapp:+212612345678",
    );
  });

  it("formats display without whatsapp prefix", () => {
    expect(formatWhatsappDisplay("whatsapp:+14155238886")).toBe("+14155238886");
  });
});
