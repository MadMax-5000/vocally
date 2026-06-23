import { createHmac, randomBytes, timingSafeEqual } from "crypto";

const GRAPH_BASE = "https://graph.facebook.com";
const DEFAULT_GRAPH_VERSION = "v25.0";

function getGraphVersion(): string {
  return process.env.META_GRAPH_VERSION?.trim() || DEFAULT_GRAPH_VERSION;
}

function getAppId(): string {
  const v = process.env.META_APP_ID;
  if (!v) throw new Error("META_APP_ID is not configured");
  return v;
}

function getAppSecret(): string {
  const v = process.env.META_APP_SECRET;
  if (!v) throw new Error("META_APP_SECRET is not configured");
  return v;
}

export function getMetaOAuthRedirectUri(): string {
  if (process.env.META_OAUTH_REDIRECT_URI) {
    return process.env.META_OAUTH_REDIRECT_URI;
  }
  const base =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  return `${base.replace(/\/$/, "")}/api/oauth/meta/callback`;
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
  const version = getGraphVersion();
  const redirectUri = getMetaOAuthRedirectUri();
  const state = signMetaOAuthState({ agentId, orgId, nonce: randomBytes(16).toString("hex") });

  const params = new URLSearchParams({
    client_id: getAppId(),
    redirect_uri: redirectUri,
    state,
    response_type: "code",
    scope: [
      "pages_show_list",
      "pages_manage_metadata",
      "pages_messaging",
    ].join(","),
  });

  return `https://www.facebook.com/${version}/dialog/oauth?${params.toString()}`;
}

export async function exchangeCodeForUserAccessToken(code: string): Promise<string> {
  const version = getGraphVersion();
  const redirectUri = getMetaOAuthRedirectUri();

  const params = new URLSearchParams({
    client_id: getAppId(),
    client_secret: getAppSecret(),
    redirect_uri: redirectUri,
    code,
  });

  const res = await fetch(`${GRAPH_BASE}/${version}/oauth/access_token?${params.toString()}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Meta OAuth token exchange failed (${res.status}): ${text.slice(0, 240)}`);
  }

  const json = (await res.json()) as { access_token?: string };
  if (!json.access_token) throw new Error("Meta OAuth token exchange: missing access_token");
  return json.access_token;
}

