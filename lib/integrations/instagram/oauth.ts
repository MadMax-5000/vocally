import { createHmac, randomBytes, timingSafeEqual } from "crypto";

import { decryptToken, encryptToken } from "@/lib/crypto/token-encryption";

import { META_GRAPH_VERSION, META_IG_SCOPES } from "./constants";

function getMetaAppId(): string {
  const id = process.env.META_APP_ID;
  if (!id) throw new Error("META_APP_ID is not configured");
  return id;
}

function getMetaAppSecret(): string {
  const secret = process.env.META_APP_SECRET;
  if (!secret) throw new Error("META_APP_SECRET is not configured");
  return secret;
}

export function getMetaOAuthRedirectUri(): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  return `${base.replace(/\/$/, "")}/api/integrations/instagram/oauth/callback`;
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

export function signMetaOAuthState(payload: OAuthStatePayload): string {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", stateSecret()).update(data).digest("base64url");
  return `${data}.${sig}`;
}

export function verifyMetaOAuthState(state: string): OAuthStatePayload | null {
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

export function buildMetaAuthUrl(agentId: string, orgId: string): string {
  const state = signMetaOAuthState({ agentId, orgId, nonce: randomBytes(16).toString("hex") });
  const u = new URL(`https://www.facebook.com/${META_GRAPH_VERSION}/dialog/oauth`);
  u.searchParams.set("client_id", getMetaAppId());
  u.searchParams.set("redirect_uri", getMetaOAuthRedirectUri());
  u.searchParams.set("state", state);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("scope", META_IG_SCOPES.join(","));
  return u.toString();
}

export async function exchangeCodeForUserAccessToken(code: string): Promise<string> {
  const u = new URL(`https://graph.facebook.com/${META_GRAPH_VERSION}/oauth/access_token`);
  u.searchParams.set("client_id", getMetaAppId());
  u.searchParams.set("client_secret", getMetaAppSecret());
  u.searchParams.set("redirect_uri", getMetaOAuthRedirectUri());
  u.searchParams.set("code", code);

  const res = await fetch(u.toString(), { method: "GET" });
  const json: unknown = await res.json();
  if (!res.ok) {
    const msg = typeof json === "object" && json && "error" in json ? JSON.stringify(json) : "";
    throw new Error(`Meta token exchange failed${msg ? `: ${msg}` : ""}`);
  }
  if (
    typeof json !== "object" ||
    !json ||
    !("access_token" in json) ||
    typeof (json as { access_token?: unknown }).access_token !== "string"
  ) {
    throw new Error("Meta token exchange returned invalid response");
  }
  return (json as { access_token: string }).access_token;
}

export function encryptPageAccessToken(pageAccessToken: string): string {
  return encryptToken(pageAccessToken);
}

export function decryptPageAccessToken(encrypted: string): string {
  return decryptToken(encrypted);
}

