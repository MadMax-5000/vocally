import { timingSafeEqual } from "crypto";

export function parseBasicAuthHeader(
  header: string | null,
): { login: string; password: string } | null {
  if (!header) return null;
  const [scheme, encoded] = header.split(" ");
  if (!scheme || scheme.toLowerCase() !== "basic" || !encoded) return null;

  let decoded: string;
  try {
    decoded = Buffer.from(encoded, "base64").toString("utf8");
  } catch {
    return null;
  }

  const separator = decoded.indexOf(":");
  if (separator < 0) return null;
  return {
    login: decoded.slice(0, separator),
    password: decoded.slice(separator + 1),
  };
}

function safeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

/**
 * Hostaway unified webhooks do not sign payloads; instead they send the
 * Login/Password configured on the webhook as HTTP Basic credentials.
 */
export function verifyHostawayWebhookAuth(
  header: string | null,
  expected: { login: string; password: string },
): boolean {
  const provided = parseBasicAuthHeader(header);
  if (!provided) return false;

  const loginOk = safeEqual(provided.login, expected.login);
  const passwordOk = safeEqual(provided.password, expected.password);
  return loginOk && passwordOk;
}
