"use client";

import { useMemo } from "react";

const FALLBACK_ORIGIN = "https://app.vocally.ai";

/** Public app origin for embed URLs and copy fields (prefers NEXT_PUBLIC_APP_URL). */
export function resolveEmbedOrigin(): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (envUrl) {
    return envUrl.replace(/\/$/, "");
  }
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return FALLBACK_ORIGIN;
}

export function useEmbedOrigin(): string {
  return useMemo(() => resolveEmbedOrigin(), []);
}
