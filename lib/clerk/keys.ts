const PUBLISHABLE_KEY_RE = /^pk_(test|live)_([A-Za-z0-9+/=_-]+)$/;
const SECRET_KEY_RE = /^sk_(test|live)_[A-Za-z0-9+/=_-]+$/;

function decodeBase64(payload: string): string | null {
  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    if (typeof globalThis.atob === "function") {
      return globalThis.atob(padded);
    }
    const NodeBuffer = (
      globalThis as {
        Buffer?: { from(data: string, encoding: string): { toString(encoding: string): string } };
      }
    ).Buffer;
    if (NodeBuffer) {
      return NodeBuffer.from(padded, "base64").toString("utf8");
    }
    return null;
  } catch {
    return null;
  }
}

function looksLikeHostname(value: string): boolean {
  return /^(?:[a-z0-9-]+\.)+[a-z]{2,}$/i.test(value);
}

/** True when the Clerk Frontend API host is the docs placeholder, which does not resolve in DNS. */
export function isPlaceholderClerkFrontendApi(frontendApi: string): boolean {
  const host = frontendApi
    .trim()
    .replace(/^https?:\/\//, "")
    .split("/")[0]
    ?.split(":")[0]
    ?.toLowerCase();
  if (!host) return true;
  return host === "example.com" || host.endsWith(".example.com");
}

/** Decode the Frontend API hostname encoded in a Clerk publishable key, if present. */
export function decodeClerkFrontendApi(publishableKey: string): string | null {
  const match = publishableKey.trim().match(PUBLISHABLE_KEY_RE);
  if (!match) return null;
  const decoded = decodeBase64(match[2]);
  if (!decoded) return null;
  const frontendApi = decoded.endsWith("$") ? decoded.slice(0, -1) : decoded;
  if (!frontendApi || !looksLikeHostname(frontendApi)) return null;
  return frontendApi;
}

export function isUsableClerkPublishableKey(key: string | undefined | null): boolean {
  const trimmed = key?.trim() ?? "";
  if (!PUBLISHABLE_KEY_RE.test(trimmed)) return false;
  if (/example/i.test(trimmed)) return false;
  const frontendApi = decodeClerkFrontendApi(trimmed);
  if (frontendApi && isPlaceholderClerkFrontendApi(frontendApi)) return false;
  return true;
}

export function isUsableClerkSecretKey(key: string | undefined | null): boolean {
  const trimmed = key?.trim() ?? "";
  if (!SECRET_KEY_RE.test(trimmed)) return false;
  if (/example/i.test(trimmed)) return false;
  return true;
}

type ClerkKeyEnv = {
  publishableKey?: string | null;
  secretKey?: string | null;
  /** Default: true on the server, false in the browser (the secret is never bundled). */
  requireSecret?: boolean;
};

/**
 * Clerk is safe to boot only when keys are present and not the clerk.example.com
 * placeholders. Placeholder keys make middleware redirect localhost to a hostname
 * that does not exist (`dev-browser-missing` handshake).
 */
export function isClerkConfigured(env: ClerkKeyEnv = {}): boolean {
  const publishableKey = env.publishableKey ?? process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const secretKey = env.secretKey ?? process.env.CLERK_SECRET_KEY;
  const requireSecret = env.requireSecret ?? typeof window === "undefined";

  if (!isUsableClerkPublishableKey(publishableKey)) return false;
  if (requireSecret && !isUsableClerkSecretKey(secretKey)) return false;
  return true;
}
