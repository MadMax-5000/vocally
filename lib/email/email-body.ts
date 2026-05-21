/** Plain-text content for inbound email automation (matches `lib/email/service` behavior). */
export function plainTextFromInboundParts(text?: string, html?: string): string {
  if (text !== undefined && text.trim().length > 0) {
    return text.trim();
  }
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
