import { google } from "googleapis";

import { decryptToken, encryptToken } from "@/lib/crypto/token-encryption";
import { newOAuthNonce, signOAuthState } from "@/lib/oauth/signed-state";

import { GOOGLE_CALENDAR_SCOPES } from "./constants";

function getClientId(): string {
  const id = process.env.GOOGLE_CLIENT_ID;
  if (!id) throw new Error("GOOGLE_CLIENT_ID is not configured");
  return id;
}

function getClientSecret(): string {
  const secret = process.env.GOOGLE_CLIENT_SECRET;
  if (!secret) throw new Error("GOOGLE_CLIENT_SECRET is not configured");
  return secret;
}

export function getGoogleCalendarOAuthRedirectUri(): string {
  if (process.env.GOOGLE_CALENDAR_OAUTH_REDIRECT_URI) {
    return process.env.GOOGLE_CALENDAR_OAUTH_REDIRECT_URI;
  }
  const base =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  return `${base.replace(/\/$/, "")}/api/oauth/google-calendar/callback`;
}

export function createGoogleCalendarOAuthClient(refreshToken?: string) {
  const client = new google.auth.OAuth2(
    getClientId(),
    getClientSecret(),
    getGoogleCalendarOAuthRedirectUri(),
  );
  if (refreshToken) {
    client.setCredentials({ refresh_token: refreshToken });
  }
  return client;
}

export function buildGoogleCalendarAuthUrl(agentId: string, orgId: string): string {
  const client = createGoogleCalendarOAuthClient();
  const state = signOAuthState({ agentId, orgId, nonce: newOAuthNonce() });
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [...GOOGLE_CALENDAR_SCOPES],
    state,
  });
}

export async function exchangeGoogleCalendarCode(code: string): Promise<{
  refreshToken: string;
  accessToken: string;
}> {
  const client = createGoogleCalendarOAuthClient();
  const { tokens } = await client.getToken(code);
  if (!tokens.refresh_token) {
    throw new Error(
      "No refresh token returned. Revoke app access in Google Account settings and connect again.",
    );
  }
  if (!tokens.access_token) {
    throw new Error("No access token returned from Google");
  }
  return {
    refreshToken: tokens.refresh_token,
    accessToken: tokens.access_token,
  };
}

export function encryptCalendarToken(token: string): string {
  return encryptToken(token);
}

export function decryptCalendarToken(encrypted: string): string {
  return decryptToken(encrypted);
}

export async function revokeGoogleCalendarToken(refreshToken: string): Promise<void> {
  const client = createGoogleCalendarOAuthClient(refreshToken);
  try {
    await client.revokeCredentials();
  } catch {
    /* best-effort */
  }
}
