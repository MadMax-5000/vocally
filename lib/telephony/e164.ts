/**
 * Normalize a phone number to E.164 (+digits only).
 * Strips spaces, dashes, parentheses, and a leading 00 international prefix.
 * Moroccan national numbers (0XXXXXXXXX) are mapped to +212XXXXXXXXX.
 */
export function normalizeE164(raw: string): string {
  let value = raw.trim().replace(/[\s\-().]/g, "");
  if (value.startsWith("00")) {
    value = `+${value.slice(2)}`;
  }
  // Moroccan national: 0 + 9 digits (mobile 06/07, landline 05, etc.)
  if (/^0\d{9}$/.test(value)) {
    return `+212${value.slice(1)}`;
  }
  if (!value.startsWith("+") && /^\d{7,15}$/.test(value)) {
    value = `+${value}`;
  }
  return value;
}

/**
 * Normalize then validate as Moroccan E.164 (+212 + 9 national digits).
 * Accepts +212…, 00212…, 212…, and national 0XXXXXXXXX.
 */
export function normalizeMoroccanPhone(raw: string): string {
  return normalizeE164(raw);
}

/** Moroccan mobile/landline in E.164: +212 + 9 national digits. */
export function isMoroccanE164(number: string): boolean {
  return /^\+212\d{9}$/.test(normalizeE164(number));
}

/**
 * Format a Moroccan E.164 number for USSD forwarding destinations.
 * Returns national digits (0 + 9) without `+`, e.g. +212612345678 → 0612345678.
 */
export function toMoroccanUssdDestination(e164: string): string {
  const normalized = normalizeE164(e164);
  if (!/^\+212\d{9}$/.test(normalized)) {
    // Best-effort: strip + for non-MA numbers so USSD never includes `+`
    return normalized.replace(/^\+/, "");
  }
  return `0${normalized.slice(4)}`;
}
