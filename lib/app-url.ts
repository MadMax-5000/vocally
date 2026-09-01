import { BRAND_URL } from "@/lib/constants/brand";

function isProductionRuntime(): boolean {
  return process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";
}

export function isLocalhostUrl(url: string): boolean {
  try {
    const hostname = new URL(url).hostname;
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
  } catch {
    return /localhost|127\.0\.0\.1/i.test(url);
  }
}

function stripTrailingSlash(url: string): string {
  return url.replace(/\/$/, "");
}

function isUsablePublicUrl(url: string): boolean {
  if (!url) return false;
  if (isProductionRuntime() && isLocalhostUrl(url)) return false;
  return true;
}

/** Public app origin. Ignores localhost values in production. */
export function getAppOrigin(): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (envUrl && isUsablePublicUrl(envUrl)) {
    return stripTrailingSlash(envUrl);
  }
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const host = vercel.replace(/^https?:\/\//, "");
    if (!isLocalhostUrl(`https://${host}`)) {
      return `https://${host}`;
    }
  }
  return BRAND_URL;
}

/** Origin of the current request, falling back to getAppOrigin() in production if the host is localhost. */
export function getRequestOrigin(req: Request): string {
  const hostHeader = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const protoHeader = req.headers.get("x-forwarded-proto") ?? "https";
  if (hostHeader) {
    const host = hostHeader.split(",")[0]?.trim();
    const proto = protoHeader.split(",")[0]?.trim() || "https";
    if (host) {
      const origin = `${proto}://${host}`;
      if (isUsablePublicUrl(origin)) return origin;
    }
  }
  return getAppOrigin();
}

export function absoluteUrl(path: string, req: Request): URL {
  const origin = getRequestOrigin(req);
  return new URL(path, `${origin}/`);
}

/** Prefer an explicit URI unless it is localhost in production. */
export function resolveRedirectUri(explicit: string | undefined, fallbackPath: string): string {
  const trimmed = explicit?.trim();
  if (trimmed && isUsablePublicUrl(trimmed)) {
    return trimmed;
  }
  return `${getAppOrigin()}${fallbackPath.startsWith("/") ? fallbackPath : `/${fallbackPath}`}`;
}
