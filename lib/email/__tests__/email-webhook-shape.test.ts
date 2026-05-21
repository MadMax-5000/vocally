import { describe, it, expect } from "vitest";

import { plainTextFromInboundParts } from "../email-body";
import { resendEmailReceivedSchema } from "../resend-webhook";

describe("plainTextFromInboundParts", () => {
  it("prefers text when non-empty", () => {
    expect(plainTextFromInboundParts("hello", "<p>x</p>")).toBe("hello");
  });

  it("falls back to stripped html", () => {
    expect(plainTextFromInboundParts("", "<p>a &nbsp; <b>b</b></p>")).toBe("a b");
  });

  it("returns empty when nothing usable", () => {
    expect(plainTextFromInboundParts("", "")).toBe("");
  });
});

describe("resendEmailReceivedSchema", () => {
  it("accepts documented envelope", () => {
    const parsed = resendEmailReceivedSchema.safeParse({
      type: "email.received",
      data: {
        email_id: "56761188-7520-42d8-8898-ff6fc54ce618",
        from: "cust@example.com",
        to: ["support@test.com"],
        subject: "Hi",
        message_id: "<abc>",
      },
    });
    expect(parsed.success).toBe(true);
  });
});
