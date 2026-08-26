import { getAppOrigin } from "@/lib/deploy/sms-config";
import { logServerWarning } from "@/lib/logger";
import { normalizeE164 } from "@/lib/telephony/e164";

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
  name?: string;
};

type VapiPhoneNumberResponse = {
  id: string;
  provider: string;
  number: string;
  name?: string;
};

/** Vapi server webhook for assistant-request / tool-calls / end-of-call. */
export function getVapiWebhookUrl(): string {
  return `${getAppOrigin()}/api/webhooks/vapi`;
}

/**
 * Create a BYO SIP trunk credential in Vapi for any provider.
 * Works with Telnyx, Plivo, DIDHub, didlogic, or any standard SIP provider.
 */
export async function createByoSipCredential(options: {
  name: string;
  sipServer: string;
  sipUsername: string;
  sipPassword: string;
}): Promise<string> {
  const res = await fetch(`${VAPI_BASE}/credential`, {
    method: "POST",
    headers: vapiHeaders(),
    body: JSON.stringify({
      provider: "byo-sip-trunk",
      name: options.name,
      gateways: [
        { ip: options.sipServer, inboundEnabled: true },
      ],
      outboundAuthenticationPlan: {
        authUsername: options.sipUsername,
        authPassword: options.sipPassword,
        sipRegisterPlan: {
          realm: options.sipServer,
        },
      },
      outboundLeadingPlusEnabled: true,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Vapi BYO SIP credential creation failed: ${res.status} ${text}`);
  }

  const data: VapiCredentialResponse = await res.json();
  logServerWarning("[Vapi SIP] Created BYO SIP credential", {
    name: options.name,
    credentialId: data.id,
    sipServer: options.sipServer,
  });
  return data.id;
}

/**
 * Import a BYO phone number into Vapi with a given credential.
 * The number must already be active on the SIP provider's side.
 */
export async function importByoPhoneNumber(
  number: string,
  credentialId: string,
): Promise<string> {
  const e164 = normalizeE164(number);
  const serverUrl = getVapiWebhookUrl();

  const res = await fetch(`${VAPI_BASE}/phone-number`, {
    method: "POST",
    headers: vapiHeaders(),
    body: JSON.stringify({
      provider: "byo-phone-number",
      name: `byo-${e164}`,
      number: e164,
      numberE164CheckEnabled: false,
      credentialId,
      server: { url: serverUrl },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Vapi BYO number import failed: ${res.status} ${text}`);
  }

  const data: VapiPhoneNumberResponse = await res.json();
  logServerWarning("[Vapi SIP] Imported BYO number", { number: e164, vapiId: data.id });
  return data.id;
}

/**
 * Delete a phone number from Vapi.
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
    logServerWarning("[Vapi] Failed to delete phone number", {
      vapiPhoneNumberId,
      error: text,
    });
  }
}

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
