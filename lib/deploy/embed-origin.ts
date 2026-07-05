"use client";

import { useMemo } from "react";

import { BRAND_URL } from "@/lib/constants/brand";

const FALLBACK_ORIGIN = BRAND_URL;

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
