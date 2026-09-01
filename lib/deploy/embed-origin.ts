"use client";

import { useMemo } from "react";

import { getAppOrigin, isLocalhostUrl } from "@/lib/app-url";

/** Public app origin for embed URLs and copy fields. */
export function resolveEmbedOrigin(): string {
  if (typeof window !== "undefined") {
    const origin = window.location.origin;
    if (!isLocalhostUrl(origin)) {
      return origin;
    }
  }
  return getAppOrigin();
}

export function useEmbedOrigin(): string {
  return useMemo(() => resolveEmbedOrigin(), []);
}
