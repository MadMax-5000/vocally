import { describe, expect, it } from "vitest";

import {
  hostawayMessageKey,
  isHostawayMessageEvent,
  parseHostawayWebhook,
} from "../webhook-payload";
import { parseBasicAuthHeader, verifyHostawayWebhookAuth } from "../webhook-auth";

function basic(login: string, password: string): string {
  return `Basic ${Buffer.from(`${login}:${password}`).toString("base64")}`;
}

describe("parseHostawayWebhook", () => {
  it("extracts the documented unified webhook identifiers", () => {
    const parsed = parseHostawayWebhook({
      id: 2,
      accountId: 10450,
      object: "conversationMessage",
      objectId: 326,
      event: "message.received",
      data: { conversationId: 1406, messageId: 326, reservationId: 2 },
    });

    expect(parsed.event).toBe("message.received");
    expect(parsed.objectType).toBe("conversationMessage");
    expect(parsed.conversationId).toBe("1406");
    expect(parsed.messageId).toBe("326");
    expect(parsed.reservationId).toBe("2");
    expect(parsed.accountId).toBe("10450");
    expect(isHostawayMessageEvent(parsed)).toBe(true);
  });

  it("accepts nested conversation and message objects", () => {
    const parsed = parseHostawayWebhook({
      event: "message.received",
      conversation: { id: 1406 },
      message: { id: 987, body: "Hello", isIncoming: 1 },
    });

    expect(parsed.conversationId).toBe("1406");
    expect(parsed.messageId).toBe("987");
    expect(parsed.inlineBody).toBe("Hello");
    expect(parsed.inlineIsIncoming).toBe(true);
    expect(isHostawayMessageEvent(parsed)).toBe(true);
  });

  it("rejects outgoing and non-message events", () => {
    expect(
      isHostawayMessageEvent(
        parseHostawayWebhook({ event: "message.sent", object: "conversationMessage" }),
      ),
    ).toBe(false);
    expect(
      isHostawayMessageEvent(
        parseHostawayWebhook({ event: "reservation.created", object: "reservation" }),
      ),
    ).toBe(false);
    expect(
      isHostawayMessageEvent(
        parseHostawayWebhook({
          event: "message.updated",
          object: "conversationMessage",
        }),
      ),
    ).toBe(false);
  });

  it("treats a conversationMessage event without a name as a message", () => {
    const parsed = parseHostawayWebhook({ object: "conversationMessage", objectId: 3 });
    expect(isHostawayMessageEvent(parsed)).toBe(true);
  });
});

describe("hostawayMessageKey", () => {
  it("scopes message IDs by account", () => {
    const parsed = parseHostawayWebhook({
      accountId: 10450,
      objectId: 326,
      object: "conversationMessage",
    });
    expect(hostawayMessageKey(parsed, "1406", "fallback")).toBe("10450:326");
  });

  it("uses a conversation fallback when no message ID is present", () => {
    const parsed = parseHostawayWebhook({ accountId: 10450 });
    expect(hostawayMessageKey(parsed, "1406", "hash")).toBe("10450:1406:hash");
  });
});

describe("Hostaway webhook Basic auth", () => {
  it("parses and verifies the configured credentials", () => {
    const header = basic("anselio_user", "s3cret");
    expect(parseBasicAuthHeader(header)).toEqual({
      login: "anselio_user",
      password: "s3cret",
    });
    expect(
      verifyHostawayWebhookAuth(header, {
        login: "anselio_user",
        password: "s3cret",
      }),
    ).toBe(true);
  });

  it("rejects wrong credentials and malformed headers", () => {
    const expected = { login: "anselio_user", password: "s3cret" };
    expect(verifyHostawayWebhookAuth(basic("anselio_user", "wrong"), expected)).toBe(
      false,
    );
    expect(verifyHostawayWebhookAuth(basic("other", "s3cret"), expected)).toBe(false);
    expect(verifyHostawayWebhookAuth("Bearer token", expected)).toBe(false);
    expect(verifyHostawayWebhookAuth(null, expected)).toBe(false);
    expect(parseBasicAuthHeader("Basic not-base64")).toBeNull();
  });
});
