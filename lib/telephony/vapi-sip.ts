import { logServerWarning } from "@/lib/logger";

const VAPI_BASE = "https://api.vapi.ai";

function getVapiKey(): string {
  const key = process.env.VAPI_API_KEY;
  if (!key) throw new Error("VAPI_API_KEY is not configured");
  return key;
}

function vapiHeaders() {
  return {
    Authorization: `Bearer ${getVapiKey()}`,
    "Content-Type": "application/json",
  };
}

// ── Types ──────────────────────────────────────────────────────────────────

type VapiCredentialResponse = {
  id: string;
  provider: string;
  name: string;
};

type VapiPhoneNumberResponse = {
  id: string;
  provider: string;
  number: string;
  name?: string;
};

// ── Telnyx SIP Trunk Credential ────────────────────────────────────────────

/**
 * Cached credential ID to avoid creating duplicates.
 * In production, store this in DB or env. For now, use env var as source of truth.
 */
export function getVapiTelnyxCredentialId(): string | null {
  return process.env.VAPI_TELNYX_CREDENTIAL_ID ?? null;
}

/**
 * Create a BYOC SIP trunk credential in Vapi for Telnyx.
 * Returns the credential ID. Only call this once during setup.
 *
 * Telnyx gateway IPs are static — these are the standard Telnyx SIP ingress points.
 * See: https://docs.vapi.ai/advanced/sip/telnyx
 */
export async function createTelnyxSipCredential(options: {
  name?: string;
  sipUsername: string;
  sipPassword: string;
}): Promise<string> {
  const res = await fetch(`${VAPI_BASE}/credential`, {
    method: "POST",
    headers: vapiHeaders(),
    body: JSON.stringify({
      provider: "byo-sip-trunk",
      name: options.name ?? "telnyx-prod",
      gateways: [
        { ip: "192.76.120.10", inboundEnabled: true },
        { ip: "64.16.250.10", inboundEnabled: true },
      ],
      outboundAuthenticationPlan: {
        authUsername: options.sipUsername,
        authPassword: options.sipPassword,
        sipRegisterPlan: {
          realm: "sip.telnyx.com",
        },
      },
      outboundLeadingPlusEnabled: true,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Vapi Telnyx credential creation failed: ${res.status} ${text}`);
  }

  const data: VapiCredentialResponse = await res.json();
  logServerWarning("[Vapi SIP] Created Telnyx credential", { credentialId: data.id });
  return data.id;
}

// ── BYO Phone Number ───────────────────────────────────────────────────────

/**
 * Import a Telnyx phone number into Vapi as a BYO phone number.
 *
 * @param number - The number in E.164 format (e.g. "+212522XXXXXX")
 * @param credentialId - The Vapi SIP trunk credential ID for Telnyx
 * @returns The Vapi phone number ID
 */
export async function importByoPhoneNumber(
  number: string,
  credentialId: string,
): Promise<string> {
  const res = await fetch(`${VAPI_BASE}/phone-number`, {
    method: "POST",
    headers: vapiHeaders(),
    body: JSON.stringify({
      provider: "byo-phone-number",
      name: `telnyx-${number}`,
      number,
      numberE164CheckEnabled: false,
      credentialId,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Vapi BYO number import failed: ${res.status} ${text}`);
  }

  const data: VapiPhoneNumberResponse = await res.json();
  logServerWarning("[Vapi SIP] Imported BYO number", { number, vapiId: data.id });
  return data.id;
}

/**
 * Delete a BYO phone number from Vapi.
 */
export async function deleteByoPhoneNumber(
  vapiPhoneNumberId: string,
): Promise<void> {
  const res = await fetch(`${VAPI_BASE}/phone-number/${vapiPhoneNumberId}`, {
    method: "DELETE",
    headers: vapiHeaders(),
  });

  if (!res.ok && res.status !== 404) {
    const text = await res.text();
    logServerWarning("[Vapi SIP] Failed to delete phone number", {
      vapiPhoneNumberId,
      error: text,
    });
  }
}

/**
 * Get a Vapi phone number by ID.
 */
export async function getVapiPhoneNumber(
  vapiPhoneNumberId: string,
): Promise<VapiPhoneNumberResponse | null> {
  const res = await fetch(`${VAPI_BASE}/phone-number/${vapiPhoneNumberId}`, {
    headers: vapiHeaders(),
  });

  if (res.status === 404) return null;
  if (!res.ok) return null;

  return res.json();
}
