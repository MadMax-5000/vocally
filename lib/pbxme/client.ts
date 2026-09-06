import { logServerWarning } from "@/lib/logger";

// PBXme/PBX.IM API client. Moroccan DIDs available without KYC for
// local landlines. Auth via Login → account_token + session x-auth-token.

const PBXME_BASE = process.env.PBXME_API_BASE ?? "https://newsip.pbxme.com";

function getPbxmeCredentials() {
  const username = process.env.PBXME_USERNAME?.trim();
  const password = process.env.PBXME_PASSWORD?.trim();
  if (!username || !password) {
    throw new Error("PBXME_USERNAME and PBXME_PASSWORD must be set");
  }
  return { username, password };
}

/** Fixed initial Login header from PBXme Postman docs (optional but often required). */
function getInitialAuthToken(): string | null {
  const token =
    process.env.PBXME_X_AUTH_TOKEN?.trim() ||
    process.env.PBXME_AUTH_TOKEN?.trim() ||
    null;
  return token || null;
}

export function formatPbxmeNetworkError(err: unknown, context: string): Error {
  if (err instanceof TypeError && /fetch failed/i.test(err.message)) {
    const cause = (err as Error & { cause?: { code?: string; message?: string } }).cause;
    const detail = cause?.code ?? cause?.message ?? "network unreachable";
    return new Error(
      `${context}: cannot reach newsip.pbxme.com (${detail}). Check your internet/VPN, then retry.`,
    );
  }
  if (err instanceof Error) return err;
  return new Error(`${context}: ${String(err)}`);
}

// ── Types ──────────────────────────────────────────────────────────────────

export type PbxmeDid = {
  did_id: string;
  did_number: string;
  monthly_cost?: string;
  setup_fee?: string;
  status?: string;
};

type PbxmeLoginResponse = {
  id?: string | number;
  account_token?: string;
  "x-auth-token"?: string;
  x_auth_token?: string;
  balance?: string;
  status?: boolean;
  error?: string;
};

type SessionAuth = {
  accountId: string;
  accountToken: string;
  sessionAuthToken: string | null;
};

// ── Auth ───────────────────────────────────────────────────────────────────

let _cachedSession: SessionAuth | null = null;
let _tokenExpiresAt = 0;

async function parseJsonSafe(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

export async function login(): Promise<SessionAuth> {
  if (_cachedSession && Date.now() < _tokenExpiresAt) return _cachedSession;

  const { username, password } = getPbxmeCredentials();
  const initialToken = getInitialAuthToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (initialToken) {
    headers["x-auth-token"] = initialToken;
  }

  let res: Response;
  try {
    res = await fetch(`${PBXME_BASE}/api/login/`, {
      method: "POST",
      headers,
      body: JSON.stringify({ username, password }),
    });
  } catch (err) {
    throw formatPbxmeNetworkError(err, "PBXme login");
  }

  const payload = (await parseJsonSafe(res)) as PbxmeLoginResponse | string | null;

  if (!res.ok) {
    const apiError =
      payload && typeof payload === "object" && typeof payload.error === "string"
        ? payload.error
        : typeof payload === "string"
          ? payload.slice(0, 200)
          : res.statusText;

    if (res.status === 403 || /authentication token/i.test(apiError)) {
      throw new Error(
        "PBXme login rejected (auth token / IP). In the PBXme portal: (1) whitelist this machine's public IP under My Account → IP Settings, (2) set PBXME_X_AUTH_TOKEN to the fixed Login x-auth-token from their Postman/API docs, then restart the app.",
      );
    }

    throw new Error(`PBXme login failed: ${res.status} ${apiError}`);
  }

  if (!payload || typeof payload !== "object" || !payload.account_token) {
    throw new Error("PBXme login returned no account_token");
  }

  const sessionAuthToken =
    payload["x-auth-token"] ?? payload.x_auth_token ?? initialToken ?? null;

  _cachedSession = {
    accountId: String(payload.id ?? username),
    accountToken: payload.account_token,
    sessionAuthToken,
  };
  _tokenExpiresAt = Date.now() + 50 * 60 * 1000;

  logServerWarning("[PBXme] Login successful", {
    balance: payload.balance,
    hasSessionToken: Boolean(sessionAuthToken),
  });
  return _cachedSession;
}

async function apiPost<T>(
  path: string,
  params: Record<string, string> = {},
): Promise<T> {
  const session = await login();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (session.sessionAuthToken) {
    headers["x-auth-token"] = session.sessionAuthToken;
  }

  const body = {
    id: session.accountId,
    token: session.accountToken,
    ...params,
  };

  let res: Response;
  try {
    res = await fetch(`${PBXME_BASE}${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
  } catch (err) {
    throw formatPbxmeNetworkError(err, `PBXme ${path}`);
  }

  const payload = await parseJsonSafe(res);

  if (isPbxmeRateLimited(res.status, payload)) {
    throw new Error(
      "PBXme API hourly rate limit reached. Wait about an hour, then retry Get Moroccan Number.",
    );
  }

  if (!res.ok) {
    const text =
      typeof payload === "string"
        ? payload.slice(0, 300)
        : JSON.stringify(payload).slice(0, 300);
    throw new Error(`PBXme API error (${path}): ${res.status} ${text}`);
  }

  return payload as T;
}

// ── DID Operations ─────────────────────────────────────────────────────────

/**
 * Morocco numeric country_id on newsip.pbxme.com.
 * Override with PBXME_MOROCCO_COUNTRY_ID if needed.
 */
const MOROCCO_COUNTRY_ID = process.env.PBXME_MOROCCO_COUNTRY_ID?.trim() || "212";

type PbxmeDidRaw = {
  id?: string | number;
  did_id?: string | number;
  number?: string;
  did_number?: string;
  monthlycost?: string;
  monthly_cost?: string;
  setup?: string;
  setup_fee?: string;
  status?: string;
  type?: string;
  city?: string;
  province?: string;
  country_id?: string;
};

type PbxmeListPayload = {
  dids?: PbxmeDidRaw[];
  data?: PbxmeDidRaw[] | { dids?: PbxmeDidRaw[] };
  result?: PbxmeDidRaw[];
  status?: boolean;
  error?: string;
  response_code?: number;
  [key: string]: unknown;
};

function isPbxmeRateLimited(status: number, payload: unknown): boolean {
  if (status === 429) return true;
  if (!payload || typeof payload !== "object") return false;
  const error = (payload as { error?: unknown }).error;
  return typeof error === "string" && /rate limit|per Hour limit/i.test(error);
}

function normalizeDidNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return raw;
  return digits.startsWith("00") ? `+${digits.slice(2)}` : `+${digits}`;
}

function mapDidRaw(row: PbxmeDidRaw): (PbxmeDid & { type?: string }) | null {
  const id = row.did_id ?? row.id;
  const number = row.did_number ?? row.number;
  if (id == null || !number) return null;
  return {
    did_id: String(id),
    did_number: normalizeDidNumber(String(number)),
    monthly_cost: row.monthly_cost ?? row.monthlycost,
    setup_fee: row.setup_fee ?? row.setup,
    status: row.status,
    type: row.type,
  };
}

/** PBXme returns available DIDs as {"0":{...},"1":{...}} plus optional status/error. */
function parseDidList(payload: PbxmeListPayload): PbxmeDid[] {
  if (payload.error && /DID list is empty|No Records Found/i.test(payload.error)) {
    return [];
  }

  const collected: PbxmeDidRaw[] = [];

  if (Array.isArray(payload.dids)) collected.push(...payload.dids);
  if (Array.isArray(payload.result)) collected.push(...payload.result);
  if (Array.isArray(payload.data)) collected.push(...payload.data);
  if (
    payload.data &&
    typeof payload.data === "object" &&
    !Array.isArray(payload.data) &&
    Array.isArray(payload.data.dids)
  ) {
    collected.push(...payload.data.dids);
  }

  for (const [key, value] of Object.entries(payload)) {
    if (!/^\d+$/.test(key)) continue;
    if (value && typeof value === "object") {
      collected.push(value as PbxmeDidRaw);
    }
  }

  const mapped = collected
    .map(mapDidRaw)
    .filter((d): d is PbxmeDid & { type?: string } => d != null);

  // Prefer real inbound DIDs over Caller-ID-only inventory when both exist.
  const inbound = mapped.filter((d) => !/caller\s*id/i.test(d.type ?? ""));
  const preferred = inbound.length > 0 ? inbound : mapped;

  return preferred.map(({ type: _type, ...did }) => did);
}

/**
 * Search available Moroccan numbers.
 */
export async function searchAvailableDids(_country: string = "MA"): Promise<PbxmeDid[]> {
  const data = await apiPost<PbxmeListPayload>("/customer/did_crud/", {
    action: "available_list",
    parent_id: "0",
    country_id: MOROCCO_COUNTRY_ID,
  });

  return parseDidList(data);
}

/**
 * Purchase/assign a DID by its did_id.
 */
export async function assignDid(didId: string): Promise<{ success: boolean; did_id: string }> {
  const session = await login();
  const data = await apiPost<{
    success?: boolean;
    status?: boolean;
    did_id?: string;
    error?: string;
  }>("/customer/did_management/", {
    action: "assign",
    did_id: didId,
    accountid: session.accountId,
    reseller_id: "0",
  });

  if (data.success === false || data.status === false) {
    throw new Error(data.error ?? "PBXme DID assignment failed");
  }

  return { success: true, did_id: data.did_id ?? didId };
}

/**
 * Set call forwarding for a DID.
 * type: "sip" for SIP URI forwarding, "pstn" for phone number
 *
 * PBXme's documented forward example uses call_type=2 + trunk IP.
 * For SIP URIs we pass the destination in call_type_value (best-effort).
 */
export async function forwardDid(
  didId: string,
  destination: string,
  type: "sip" | "pstn" | "extension" = "sip",
): Promise<void> {
  // call_type: 2 is the documented trunk/IP example; SIP URI in call_type_value.
  await apiPost("/customer/did_management/", {
    action: "forward",
    did_id: didId,
    call_type: type === "pstn" ? "1" : "2",
    call_type_value: destination,
    always: "5",
    user_busy: "5",
    user_not_registered: "5",
    no_answer: "5",
    extensions: "",
    call_type_vm_flag: "",
    always_destination: "",
    always_vm_flag: "",
    user_busy_destination: "",
    user_busy_vm_flag: "",
    user_not_registered_destination: "",
    user_not_registered_vm_flag: "",
    no_answer_destination: "",
    no_answer_vm_flag: "",
  });
}

/**
 * List all purchased DIDs.
 */
export async function listDids(): Promise<PbxmeDid[]> {
  const data = await apiPost<PbxmeListPayload>("/customer/did_crud/", {
    action: "purchase_list",
  });

  return parseDidList(data);
}

/**
 * Release (delete) a DID.
 */
export async function releaseDid(didId: string): Promise<void> {
  const session = await login();
  await apiPost("/customer/did_management/", {
    action: "release",
    did_id: didId,
    accountid: session.accountId,
  });
}

// ── Moroccan DID Provisioning ──────────────────────────────────────────────

/**
 * Provision a Moroccan number end-to-end:
 * 1. Search available DIDs
 * 2. Assign the first available one
 * 3. Return the did_id and number
 */
export async function provisionMoroccanDid(): Promise<{
  didId: string;
  number: string;
}> {
  const available = await searchAvailableDids("MA");
  if (available.length === 0) {
    throw new Error(
      `No Moroccan DID numbers available on PBXme (country_id=${MOROCCO_COUNTRY_ID}). Check inventory in the PBXme portal or set PBXME_MOROCCO_COUNTRY_ID.`,
    );
  }

  const did = available[0];
  logServerWarning("[PBXme] Provisioning Moroccan DID", {
    didId: did.did_id,
    number: did.did_number,
    monthlyCost: did.monthly_cost,
  });

  const result = await assignDid(did.did_id);

  logServerWarning("[PBXme] Moroccan DID provisioned", {
    didId: result.did_id,
    number: did.did_number,
  });

  return {
    didId: result.did_id,
    number: did.did_number,
  };
}
