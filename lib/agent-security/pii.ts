const EMAIL_RE = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PHONE_RE = /(?<!\w)(?:\+?\d[\d\s().-]{7,}\d)(?!\w)/g;
const CARD_RE = /(?<!\d)(?:\d[ -]*?){13,19}(?!\d)/g;
const CIN_RE = /\b[A-Z]{1,2}\d{5,8}\b/gi;

export function redactPii(text: string): string {
  return text
    .replace(EMAIL_RE, "[email]")
    .replace(CARD_RE, "[card]")
    .replace(PHONE_RE, "[phone]")
    .replace(CIN_RE, "[id]");
}

export function maybeRedactPii(text: string, enabled: boolean): string {
  return enabled ? redactPii(text) : text;
}
