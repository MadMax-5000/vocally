import { prisma } from "@/lib/db/prisma";
import { decryptToken, encryptToken } from "@/lib/crypto/token-encryption";
import { HostawayError, hostawayErrorFromResponse } from "./errors";
import { HOSTAWAY_API_BASE, type HostawayTokenResponse } from "./types";

/** Refresh a little before the documented expiry so calls never race the deadline. */
const TOKEN_REFRESH_SKEW_MS = 60 * 60 * 1000;
/** Hostaway requires waiting 1 second after minting before the token is usable. */
const TOKEN_ACTIVATION_DELAY_MS = 1_100;

export type HostawayConnectionAuthFields = {
  id: string;
  accountId: string;
  apiKeyEnc: string;
  accessTokenEnc: string | null;
  accessTokenExpiresAt: Date | null;
};

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function mintHostawayAccessToken(
  accountId: string,
  apiKey: string,
): Promise<{ accessToken: string; expiresAt: Date }> {
  const res = await fetch(`${HOSTAWAY_API_BASE}/accessTokens`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Cache-Control": "no-cache",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: accountId,
      client_secret: apiKey,
      scope: "general",
    }).toString(),
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

  const token = json as Partial<HostawayTokenResponse> | null;
  if (!token?.access_token) {
    throw new HostawayError("Hostaway did not return an access token", res.status);
  }

  const ttlSeconds = typeof token.expires_in === "number" ? token.expires_in : 0;
  return {
    accessToken: token.access_token,
    expiresAt: new Date(Date.now() + Math.max(ttlSeconds, 60) * 1000),
  };
}

function isUsableCachedToken(connection: HostawayConnectionAuthFields): boolean {
  if (!connection.accessTokenEnc || !connection.accessTokenExpiresAt) return false;
  return connection.accessTokenExpiresAt.getTime() - TOKEN_REFRESH_SKEW_MS > Date.now();
}

/**
 * Returns a usable bearer token for a connection, minting and persisting a new
 * one when the cached token is missing or close to expiry.
 */
export async function refreshHostawayAccessToken(
  connection: HostawayConnectionAuthFields,
): Promise<string> {
  const apiKey = decryptToken(connection.apiKeyEnc);
  const { accessToken, expiresAt } = await mintHostawayAccessToken(
    connection.accountId,
    apiKey,
  );

  await prisma.hostawayConnection.update({
    where: { id: connection.id },
    data: {
      accessTokenEnc: encryptToken(accessToken),
      accessTokenExpiresAt: expiresAt,
    },
  });

  await sleep(TOKEN_ACTIVATION_DELAY_MS);
  return accessToken;
}

export async function getHostawayAccessToken(
  connection: HostawayConnectionAuthFields,
): Promise<string> {
  if (isUsableCachedToken(connection) && connection.accessTokenEnc) {
    return decryptToken(connection.accessTokenEnc);
  }

  return refreshHostawayAccessToken(connection);
}

export async function revokeHostawayAccessToken(token: string): Promise<void> {
  const res = await fetch(
    `${HOSTAWAY_API_BASE}/accessTokens?token=${encodeURIComponent(token)}`,
    {
      method: "DELETE",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      cache: "no-store",
    },
  );

  if (!res.ok) {
    throw hostawayErrorFromResponse(res.status, await res.json().catch(() => null), res.headers);
  }
}
