import { MAX_ALLOWED_HOSTNAMES } from "./constants";

const HOSTNAME_RE =
  /^(?:localhost|(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)(?:\.(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?))+|(?:\d{1,3}\.){3}\d{1,3})(?::\d{1,5})?$/;

export function normalizeHostname(raw: string): string | null {
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed) return null;

  let value = trimmed.replace(/^https?:\/\//, "");
  value = value.split("/")[0]?.split("?")[0]?.split("#")[0] ?? "";
  value = value.replace(/\.$/, "").replace(/^\[|\]$/g, "");
  if (!value) return null;

  try {
    const parsed = new URL(`http://${value}`);
    const hostname = parsed.hostname.replace(/^\[|\]$/g, "");
    const port = parsed.port;
    value = port ? `${hostname}:${port}` : hostname;
  } catch {
    return null;
  }

  if (!HOSTNAME_RE.test(value)) return null;
  return value;
}

export function parseHostnameList(raw: string): {
  hostnames: string[];
  error?: "invalid" | "tooMany";
} {
  const tokens = raw
    .split(/[\s,]+/)
    .map((part) => part.trim())
    .filter(Boolean);

  const hostnames: string[] = [];
  for (const token of tokens) {
    const normalized = normalizeHostname(token);
    if (!normalized) {
      return { hostnames: [], error: "invalid" };
    }
    if (!hostnames.includes(normalized)) {
      hostnames.push(normalized);
    }
  }

  if (hostnames.length > MAX_ALLOWED_HOSTNAMES) {
    return { hostnames: [], error: "tooMany" };
  }

  return { hostnames };
}

export function hostnameFromRequest(
  origin: string | null | undefined,
  referer: string | null | undefined,
): string | null {
  const candidate = origin?.trim() || referer?.trim() || "";
  if (!candidate) return null;

  try {
    const url = new URL(candidate);
    const hostname = url.hostname.toLowerCase();
    const port = url.port;
    const withPort = port ? `${hostname}:${port}` : hostname;
    return normalizeHostname(withPort);
  } catch {
    return normalizeHostname(candidate);
  }
}

export function isHostnameAllowed(
  hostname: string | null,
  allowlist: string[],
): boolean {
  if (allowlist.length === 0) return true;
  if (!hostname) return false;
  return allowlist.includes(hostname);
}
