import { logServerWarning } from "@/lib/logger";

const TELNYX_BASE = "https://api.telnyx.com/v2";

function getTelnyxApiKey(): string {
  const key = process.env.TELNYX_API_KEY;
  if (!key) throw new Error("TELNYX_API_KEY is not configured");
  return key;
}

function telnyxHeaders() {
  return {
    Authorization: `Bearer ${getTelnyxApiKey()}`,
    "Content-Type": "application/json",
  };
}

// ── Types ──────────────────────────────────────────────────────────────────

export type TelnyxPhoneNumber = {
  phone_number: string;
  id: string;
  country_code: string;
  number_type: string;
  status: string;
  capabilities: { voice: boolean; sms: boolean };
};

type TelnyxListResponse<T> = {
  data: T;
  meta?: { total_results?: number };
};

type TelnyxOrderResponse = {
  data: {
    id: string;
    phone_numbers: Array<{ phone_number: string; id: string }>;
  };
};

// ── Number Search ──────────────────────────────────────────────────────────

/**
 * Search available Moroccan phone numbers from Telnyx inventory.
 */
export async function searchAvailableNumbers(options?: {
  areaCode?: string;
  limit?: number;
}): Promise<TelnyxPhoneNumber[]> {
  const params = new URLSearchParams({
    "filter[country_code]": "MA",
  });
  if (options?.areaCode) params.set("filter[national_destination_code]", options.areaCode);
  if (options?.limit) params.set("page[size]", String(options.limit));

  const res = await fetch(`${TELNYX_BASE}/available_phone_numbers?${params}`, {
    headers: telnyxHeaders(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Telnyx number search failed: ${res.status} ${text}`);
  }

  const body: TelnyxListResponse<TelnyxPhoneNumber[]> = await res.json();
  return body.data ?? [];
}

/**
 * Order (purchase) a Moroccan phone number from Telnyx.
 * Returns the purchased number details.
 */
export async function orderNumber(
  phoneNumber: string,
): Promise<{ phoneNumber: string; orderId: string }> {
  const res = await fetch(`${TELNYX_BASE}/number_orders`, {
    method: "POST",
    headers: telnyxHeaders(),
    body: JSON.stringify({
      phone_numbers: [{ phone_number: phoneNumber }],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Telnyx number order failed: ${res.status} ${text}`);
  }

  const body: TelnyxOrderResponse = await res.json();
  const ordered = body.data.phone_numbers?.[0];

  logServerWarning("[Telnyx] Ordered number", {
    phoneNumber,
    orderId: body.data.id,
  });

  return {
    phoneNumber: ordered?.phone_number ?? phoneNumber,
    orderId: body.data.id,
  };
}

/**
 * Search and order a Moroccan number in one step.
 * Searches for available numbers, picks the first one, and orders it.
 */
export async function searchAndOrderNumber(options?: {
  areaCode?: string;
}): Promise<{ phoneNumber: string; orderId: string }> {
  const available = await searchAvailableNumbers({ areaCode: options?.areaCode, limit: 1 });
  if (available.length === 0) {
    throw new Error("No Moroccan phone numbers available in Telnyx inventory");
  }
  return orderNumber(available[0].phone_number);
}

/**
 * Release (deprovision) a phone number from Telnyx.
 */
export async function releaseNumber(phoneNumberId: string): Promise<void> {
  const res = await fetch(`${TELNYX_BASE}/phone_numbers/${phoneNumberId}`, {
    method: "DELETE",
    headers: telnyxHeaders(),
  });

  if (!res.ok && res.status !== 404) {
    const text = await res.text();
    throw new Error(`Telnyx number release failed: ${res.status} ${text}`);
  }

  logServerWarning("[Telnyx] Released number", { phoneNumberId });
}

/**
 * Get phone number details by E.164 number.
 */
export async function getPhoneNumber(
  phoneNumber: string,
): Promise<TelnyxPhoneNumber | null> {
  const params = new URLSearchParams({ "filter[phone_number]": phoneNumber });
  const res = await fetch(`${TELNYX_BASE}/phone_numbers?${params}`, {
    headers: telnyxHeaders(),
  });

  if (!res.ok) return null;

  const body: TelnyxListResponse<TelnyxPhoneNumber[]> = await res.json();
  return body.data?.[0] ?? null;
}
