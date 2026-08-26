import { logServerWarning } from "@/lib/logger";

// ponytail: PBXme/PBX.IM API client. Moroccan DIDs available without KYC for
// local landlines. Auth via account_token from login.

const PBXME_BASE = process.env.PBXME_API_BASE ?? "https://newsip.pbxme.com";

function getPbxmeCredentials() {
  const username = process.env.PBXME_USERNAME;
  const password = process.env.PBXME_PASSWORD;
  if (!username || !password) {
    throw new Error("PBXME_USERNAME and PBXME_PASSWORD must be set");
  }
  return { username, password };
}

// ── Types ──────────────────────────────────────────────────────────────────

export type PbxmeDid = {
  did_id: string;
  did_number: string;
  monthly_cost?: string;
  setup_fee?: string;
  status?: string;
};

export type PbxmeLoginResponse = {
  account_token: string;
  balance?: string;
};

// ── Auth ───────────────────────────────────────────────────────────────────

let _cachedToken: string | null = null;
let _tokenExpiresAt = 0;

export async function login(): Promise<string> {
  if (_cachedToken && Date.now() < _tokenExpiresAt) return _cachedToken;

  const { username, password } = getPbxmeCredentials();
  const res = await fetch(`${PBXME_BASE}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ username, password }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PBXme login failed: ${res.status} ${text}`);
  }

  const data: PbxmeLoginResponse = await res.json();
  if (!data.account_token) {
    throw new Error("PBXme login returned no token");
  }

  _cachedToken = data.account_token;
  // Cache for 50 minutes (tokens typically last 1 hour)
  _tokenExpiresAt = Date.now() + 50 * 60 * 1000;

  logServerWarning("[PBXme] Login successful", { balance: data.balance });
  return _cachedToken;
}

async function apiPost<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const token = await login();
  const body = new URLSearchParams({ token, ...params });

  const res = await fetch(`${PBXME_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PBXme API error (${path}): ${res.status} ${text}`);
  }

  return res.json();
}

// ── DID Operations ─────────────────────────────────────────────────────────

/**
 * Search available Moroccan numbers.
 * country="MA" for Morocco.
 */
export async function searchAvailableDids(country: string = "MA"): Promise<PbxmeDid[]> {
  const data = await apiPost<{ dids: PbxmeDid[] }>("/api/did/available", {
    country,
  });
  return data.dids ?? [];
}

/**
 * Purchase/assign a DID by its did_id.
 */
export async function assignDid(didId: string): Promise<{ success: boolean; did_id: string }> {
  const data = await apiPost<{ success: boolean; did_id: string }>("/api/did/assign", {
    did_id: didId,
  });

  if (!data.success) {
    throw new Error("PBXme DID assignment failed");
  }

  return data;
}

/**
 * Set call forwarding for a DID.
 * type: "sip" for SIP URI forwarding, "pstn" for phone number
 */
export async function forwardDid(
  didId: string,
  destination: string,
  type: "sip" | "pstn" | "extension" = "sip",
): Promise<void> {
  await apiPost("/api/did/forward", {
    did_id: didId,
    destination,
    type,
  });
}

/**
 * List all purchased DIDs.
 */
export async function listDids(): Promise<PbxmeDid[]> {
  const data = await apiPost<{ dids: PbxmeDid[] }>("/api/did/list");
  return data.dids ?? [];
}

/**
 * Release (delete) a DID.
 */
export async function releaseDid(didId: string): Promise<void> {
  await apiPost("/api/did/release", { did_id: didId });
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
    throw new Error("No Moroccan DID numbers available on PBXme");
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
