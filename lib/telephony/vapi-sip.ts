import { getAppOrigin } from "@/lib/app-url";
import { logServerWarning } from "@/lib/logger";
import { normalizeE164 } from "@/lib/telephony/e164";

const VAPI_BASE = "https://api.vapi.ai";

export const VAPI_SIP_HOST = "sip.vapi.ai";

const IPV4_RE =
  /^(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/;

/** Host for a Vapi BYO SIP gateway (`ip` field). Strips `sip:` and port. */
export function sipGatewayHost(sipServer: string): string {
  return sipServer
    .trim()
    .replace(/^sip:/i, "")
    .split("/")[0]
    ?.split(":")[0]
    ?.trim() ?? "";
}

/**
 * Hostname cartes SIP (VoIPSense) must register outbound — Vapi 400s if
 * `inboundEnabled` is true on a non-IPv4 `ip`. IPv4 hops can accept inbound.
 */
export function vapiSipGateway(sipServer: string): {
  ip: string;
  inboundEnabled: boolean;
} {
  const ip = sipGatewayHost(sipServer);
  if (!ip) {
    throw new Error("SIP server is required");
  }
  return { ip, inboundEnabled: IPV4_RE.test(ip) };
}

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
  number?: string;
  sipUri?: string;
  name?: string;
};

/** Vapi server webhook for assistant-request / tool-calls / end-of-call. */
export function getVapiWebhookUrl(): string {
  return `${getAppOrigin()}/api/webhooks/vapi`;
}

export function vapiNativeSipUsername(agentId: string): string {
  return `anselio-${agentId.trim()}`;
}

export function vapiNativeSipUri(agentId: string): string {
  return `sip:${vapiNativeSipUsername(agentId)}@${VAPI_SIP_HOST}`;
}

export function isVapiNativeSipUri(value: string): boolean {
  return /^sip:anselio-[^@\s]+@sip\.vapi\.ai$/i.test(value.trim());
}

/** Agent id encoded in sip:anselio-{agentId}@sip.vapi.ai (or the username alone). */
export function parseVapiNativeSipAgentId(value: string): string | null {
  const trimmed = value.trim();
  const match = trimmed.match(/^(?:sip:)?anselio-([a-z0-9]+)(?:@sip\.vapi\.ai)?$/i);
  return match?.[1] ?? null;
}

export function vapiDialedIdentities(call: {
  phoneNumber?: { number?: string; sipUri?: string };
}): string[] {
  const raw = [call.phoneNumber?.number, call.phoneNumber?.sipUri];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of raw) {
    const trimmed = value?.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    out.push(trimmed);
  }
  return out;
}

/**
 * Inbound-only Vapi SIP number. A GoIP or SIPTRUNK hop INVITEs this URI;
 * Vapi then hits assistant-request. No PSTN DID.
 */
export async function createNativeSipPhoneNumber(
  sipUri: string,
  name: string,
): Promise<string> {
  const serverUrl = getVapiWebhookUrl();
  const res = await fetch(`${VAPI_BASE}/phone-number`, {
    method: "POST",
    headers: vapiHeaders(),
    body: JSON.stringify({
      provider: "vapi",
      name,
      sipUri,
      server: { url: serverUrl },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Vapi native SIP number creation failed: ${res.status} ${text}`);
  }

  const data: VapiPhoneNumberResponse = await res.json();
  logServerWarning("[Vapi SIP] Created native SIP number", {
    sipUri,
    vapiId: data.id,
  });
  return data.id;
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
  const gateway = vapiSipGateway(options.sipServer);

  const res = await fetch(`${VAPI_BASE}/credential`, {
    method: "POST",
    headers: vapiHeaders(),
    body: JSON.stringify({
      provider: "byo-sip-trunk",
      name: options.name,
      gateways: [gateway],
      outboundAuthenticationPlan: {
        authUsername: options.sipUsername,
        authPassword: options.sipPassword,
        sipRegisterPlan: {
          realm: gateway.ip,
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
