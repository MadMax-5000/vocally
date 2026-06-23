import { describe, it, expect } from "vitest";
import crypto from "crypto";

import { verifyMetaWebhookSignature } from "../webhook-signature";

describe("verifyMetaWebhookSignature", () => {
  it("should validate correct signatures", () => {
    const appSecret = "secret";
    const rawBody = Buffer.from('{"hello":"world"}', "utf8");
    const expected =
      "sha256=" + crypto.createHmac("sha256", appSecret).update(rawBody).digest("hex");

    expect(
      verifyMetaWebhookSignature({
        appSecret,
        rawBody,
        signatureHeader: expected,
      }),
    ).toBe(true);
  });

  it("should reject incorrect signatures", () => {
    const appSecret = "secret";
    const rawBody = Buffer.from("x", "utf8");

    expect(
      verifyMetaWebhookSignature({
        appSecret,
        rawBody,
        signatureHeader: "sha256=deadbeef",
      }),
    ).toBe(false);
  });
});

