import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { google } from "googleapis";

import { decryptToken, encryptToken } from "@/lib/crypto/token-encryption";

import { GMAIL_SCOPES } from "./constants";

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
  const state = signOAuthState({ agentId, orgId, nonce: randomBytes(16).toString("hex") });
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: GMAIL_SCOPES,
    state,
  });
}

type OAuthStatePayload = {
  agentId: string;
  orgId: string;
  nonce: string;
};

function stateSecret(): string {
  const key = process.env.TOKEN_ENCRYPTION_KEY;
  if (!key) throw new Error("TOKEN_ENCRYPTION_KEY is not configured");
  return key;
}

export function signOAuthState(payload: OAuthStatePayload): string {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", stateSecret()).update(data).digest("base64url");
  return `${data}.${sig}`;
}

export function verifyOAuthState(state: string): OAuthStatePayload | null {
  const dot = state.lastIndexOf(".");
  if (dot <= 0) return null;
  const data = state.slice(0, dot);
  const sig = state.slice(dot + 1);
  const expected = createHmac("sha256", stateSecret()).update(data).digest("base64url");
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(data, "base64url").toString("utf8")) as OAuthStatePayload;
    if (!parsed.agentId || !parsed.orgId || !parsed.nonce) return null;
    return parsed;
  } catch {
    return null;
  }
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
