import { HostawayError, hostawayErrorFromResponse } from "./errors";
import { sleep } from "./auth";
import {
  HOSTAWAY_API_BASE,
  type HostawayConversation,
  type HostawayConversationMessage,
  type HostawayEnvelope,
  type HostawayListing,
  type HostawayWebhook,
} from "./types";

async function hostawayRequest<T>(
  token: string,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${HOSTAWAY_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Cache-Control": "no-cache",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
    },
    cache: "no-store",
  });

  const text = await res.text();
  let json: unknown = null;
  try {
    json = JSON.parse(text) as unknown;
  } catch {
    json = null;
  }

  if (!res.ok) {
    throw hostawayErrorFromResponse(res.status, json, res.headers);
  }

  const payload = json as HostawayEnvelope<T> & Record<string, unknown>;
  if (!payload || typeof payload !== "object") {
    throw new HostawayError("Hostaway returned an empty response", res.status);
  }
  if (payload.status === "fail") {
    throw new HostawayError(
      payload.message ?? "Hostaway returned an unsuccessful response",
      res.status,
      "fail",
    );
  }

  // Most endpoints use the standard { status, result } envelope, but a few
  // documented write endpoints return the created object directly.
  if ("result" in payload) return payload.result;
  return payload as unknown as T;
}

function idPath(value: string | number): string {
  return encodeURIComponent(String(value));
}

export async function getHostawayConversation(
  token: string,
  conversationId: string | number,
): Promise<HostawayConversation> {
  return hostawayRequest<HostawayConversation>(
    token,
    `/conversations/${idPath(conversationId)}?includeResources=1`,
  );
}

export async function listHostawayConversationsByReservation(
  token: string,
  reservationId: string | number,
): Promise<HostawayConversation[]> {
  const result = await hostawayRequest<HostawayConversation[] | null>(
    token,
    `/conversations?reservationId=${idPath(reservationId)}&includeResources=1`,
  );
  return Array.isArray(result) ? result : [];
}

export async function listHostawayConversationMessages(
  token: string,
  conversationId: string | number,
  limit = 30,
): Promise<HostawayConversationMessage[]> {
  const result = await hostawayRequest<HostawayConversationMessage[] | null>(
    token,
    `/conversations/${idPath(conversationId)}/messages?limit=${limit}&includeScheduledMessages=1`,
  );
  return Array.isArray(result) ? result : [];
}

/**
 * Sends a reply into the original Airbnb / Booking.com guest thread.
 * `communicationType: "channel"` is required so Hostaway does not fall back to email.
 */
export async function sendHostawayConversationMessage(
  token: string,
  conversationId: string | number,
  body: string,
): Promise<HostawayConversationMessage> {
  return hostawayRequest<HostawayConversationMessage>(
    token,
    `/conversations/${idPath(conversationId)}/messages`,
    {
      method: "POST",
      body: JSON.stringify({ body, communicationType: "channel" }),
    },
  );
}

export async function getHostawayListing(
  token: string,
  listingId: string | number,
): Promise<HostawayListing> {
  return hostawayRequest<HostawayListing>(
    token,
    `/listings/${idPath(listingId)}?includeResources=1`,
  );
}

export async function createHostawayWebhook(
  token: string,
  input: {
    url: string;
    login: string;
    password: string;
    alertingEmailAddress?: string;
  },
): Promise<HostawayWebhook> {
  return hostawayRequest<HostawayWebhook>(token, "/webhooks/unifiedWebhooks", {
    method: "POST",
    body: JSON.stringify({
      isEnabled: 1,
      url: input.url,
      login: input.login,
      password: input.password,
      alertingEmailAddress: input.alertingEmailAddress?.trim() || null,
    }),
  });
}

export async function deleteHostawayWebhook(
  token: string,
  webhookId: string | number,
): Promise<void> {
  await hostawayRequest<unknown>(
    token,
    `/webhooks/unifiedWebhooks/${idPath(webhookId)}`,
    { method: "DELETE" },
  );
}

export async function listHostawayWebhooks(token: string): Promise<HostawayWebhook[]> {
  const result = await hostawayRequest<HostawayWebhook[] | null>(
    token,
    "/webhooks/unifiedWebhooks",
  );
  return Array.isArray(result) ? result : [];
}

/**
 * Validates Account ID + API key by minting a token and making one authenticated
 * call. Hostaway only activates new tokens after 1 second.
 */
export async function verifyHostawayCredentials(input: {
  accountId: string;
  apiKey: string;
}): Promise<{ accessToken: string; expiresAt: Date }> {
  const { mintHostawayAccessToken } = await import("./auth");
  const minted = await mintHostawayAccessToken(input.accountId, input.apiKey);
  await sleep(1_100);

  await hostawayRequest<HostawayListing[] | null>(
    minted.accessToken,
    "/listings?limit=1",
  );

  return minted;
}
