import { afterEach, describe, expect, it, vi } from "vitest";

import { mintHostawayAccessToken } from "../auth";
import { sendHostawayConversationMessage } from "../client";

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("mintHostawayAccessToken", () => {
  it("uses the OAuth2 client-credentials grant with the official fields", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        token_type: "Bearer",
        expires_in: 3600,
        access_token: "hostaway-token",
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await mintHostawayAccessToken("10450", "secret-key");

    expect(result.accessToken).toBe("hostaway-token");
    expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now());

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.hostaway.com/v1/accessTokens");
    expect(init.method).toBe("POST");
    const body = new URLSearchParams(String(init.body));
    expect(body.get("grant_type")).toBe("client_credentials");
    expect(body.get("client_id")).toBe("10450");
    expect(body.get("client_secret")).toBe("secret-key");
    expect(body.get("scope")).toBe("general");
  });

  it("surfaces a rejected credential response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(
          { status: "fail", message: "Invalid client" },
          { status: 401 },
        ),
      ),
    );

    await expect(mintHostawayAccessToken("10450", "bad")).rejects.toMatchObject({
      status: 401,
    });
  });
});

describe("sendHostawayConversationMessage", () => {
  it("sends into the channel thread, never by email", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        status: "success",
        result: { id: 400, body: "hello", communicationType: "channel" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const sent = await sendHostawayConversationMessage("token", "1406", "hello");

    expect(sent.id).toBe(400);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.hostaway.com/v1/conversations/1406/messages");
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual({
      body: "hello",
      communicationType: "channel",
    });
  });

  it("carries the Hostaway rate-limit retry timestamp", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(
          { status: "fail", message: "Too many requests" },
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              "X-RateLimit-Retry-After": "1700000000",
            },
          },
        ),
      ),
    );

    await expect(
      sendHostawayConversationMessage("token", "1406", "hello"),
    ).rejects.toMatchObject({ status: 429, retryAfter: 1700000000 });
  });
});
