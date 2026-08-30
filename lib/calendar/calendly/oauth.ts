import { decryptToken, encryptToken } from "@/lib/crypto/token-encryption";
import { newOAuthNonce, signOAuthState } from "@/lib/oauth/signed-state";

const CALENDLY_AUTH_BASE = "https://auth.calendly.com";
const CALENDLY_API_BASE = "https://api.calendly.com";

function getClientId(): string {
  const id = process.env.CALENDLY_CLIENT_ID;
  if (!id) throw new Error("CALENDLY_CLIENT_ID is not configured");
  return id;
}

function getClientSecret(): string {
  const secret = process.env.CALENDLY_CLIENT_SECRET;
  if (!secret) throw new Error("CALENDLY_CLIENT_SECRET is not configured");
  return secret;
}

export function getCalendlyOAuthRedirectUri(): string {
  if (process.env.CALENDLY_OAUTH_REDIRECT_URI) {
    return process.env.CALENDLY_OAUTH_REDIRECT_URI;
  }
  const base =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  return `${base.replace(/\/$/, "")}/api/oauth/calendly/callback`;
}

export function buildCalendlyAuthUrl(agentId: string, orgId: string): string {
  const state = signOAuthState({ agentId, orgId, nonce: newOAuthNonce() });
  const params = new URLSearchParams({
    client_id: getClientId(),
    response_type: "code",
    redirect_uri: getCalendlyOAuthRedirectUri(),
    state,
  });
  return `${CALENDLY_AUTH_BASE}/oauth/authorize?${params.toString()}`;
}

type CalendlyTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
};

async function postToken(body: Record<string, string>): Promise<CalendlyTokenResponse> {
  const res = await fetch(`${CALENDLY_AUTH_BASE}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body),
  });
  const json = (await res.json()) as CalendlyTokenResponse & { error?: string; error_description?: string };
  if (!res.ok) {
    throw new Error(json.error_description ?? json.error ?? "Calendly token request failed");
  }
  return json;
}

export async function exchangeCalendlyCode(code: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}> {
  const json = await postToken({
    grant_type: "authorization_code",
    client_id: getClientId(),
    client_secret: getClientSecret(),
    code,
    redirect_uri: getCalendlyOAuthRedirectUri(),
  });
  if (!json.access_token || !json.refresh_token) {
    throw new Error("Calendly did not return access and refresh tokens");
  }
  const expiresIn = typeof json.expires_in === "number" ? json.expires_in : 7200;
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    expiresAt: new Date(Date.now() + expiresIn * 1000),
  };
}

export async function refreshCalendlyAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}> {
  const json = await postToken({
    grant_type: "refresh_token",
    client_id: getClientId(),
    client_secret: getClientSecret(),
    refresh_token: refreshToken,
  });
  if (!json.access_token) {
    throw new Error("Calendly did not return an access token");
  }
  const expiresIn = typeof json.expires_in === "number" ? json.expires_in : 7200;
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token ?? refreshToken,
    expiresAt: new Date(Date.now() + expiresIn * 1000),
  };
}

export function encryptCalendlyToken(token: string): string {
  return encryptToken(token);
}

export function decryptCalendlyToken(encrypted: string): string {
  return decryptToken(encrypted);
}

export { CALENDLY_API_BASE };
