import { google } from "googleapis";

import { decryptToken, encryptToken } from "@/lib/crypto/token-encryption";
import { newOAuthNonce, signOAuthState } from "@/lib/oauth/signed-state";

import { GMAIL_SCOPES } from "./constants";

export { signOAuthState, verifyOAuthState } from "@/lib/oauth/signed-state";

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

export function getOAuthRedirectUri(): string {
  if (process.env.GOOGLE_OAUTH_REDIRECT_URI) {
    return process.env.GOOGLE_OAUTH_REDIRECT_URI;
  }
  const base =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  return `${base.replace(/\/$/, "")}/api/oauth/google/callback`;
}

export function createOAuth2Client(refreshToken?: string) {
  const client = new google.auth.OAuth2(getClientId(), getClientSecret(), getOAuthRedirectUri());
  if (refreshToken) {
    client.setCredentials({ refresh_token: refreshToken });
  }
  return client;
}

export function buildGoogleAuthUrl(agentId: string, orgId: string): string {
  const client = createOAuth2Client();
  const state = signOAuthState({ agentId, orgId, nonce: newOAuthNonce() });
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: GMAIL_SCOPES,
    state,
  });
}

export async function exchangeCodeForTokens(code: string): Promise<{
  refreshToken: string;
  accessToken: string;
}> {
  const client = createOAuth2Client();
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

export function encryptRefreshToken(refreshToken: string): string {
  return encryptToken(refreshToken);
}

export function decryptRefreshToken(encrypted: string): string {
  return decryptToken(encrypted);
}

export async function revokeGoogleToken(refreshToken: string): Promise<void> {
  const client = createOAuth2Client(refreshToken);
  try {
    await client.revokeCredentials();
  } catch {
    /* best-effort */
  }
}

export function getPubSubTopic(): string {
  const topic = process.env.GOOGLE_PUBSUB_TOPIC;
  if (!topic) throw new Error("GOOGLE_PUBSUB_TOPIC is not configured");
  return topic;
}
