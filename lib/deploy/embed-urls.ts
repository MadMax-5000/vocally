"use client";

import { useMemo } from "react";
import { buildEmbedQueryParams } from "@/lib/deploy/web-chat-config";

export function useEmbedOrigin(): string {
  return useMemo(() => {
    if (typeof window === "undefined") return "https://app.vocally.ai";
    return window.location.origin;
  }, []);
}

export function buildWidgetEmbedUrl(
  origin: string,
  agentId: string,
  widgetToken: string | null | undefined,
  title: string,
  welcome: string,
): string {
  const qs = buildEmbedQueryParams(widgetToken, title, welcome);
  return `${origin}/widget/${agentId}?${qs}`;
}

export function buildHelpEmbedUrl(
  origin: string,
  agentId: string,
  widgetToken: string | null | undefined,
  title: string,
  welcome: string,
): string {
  const qs = buildEmbedQueryParams(widgetToken, title, welcome);
  return `${origin}/help/${agentId}?${qs}`;
}

export function buildPreviewUrl(
  origin: string,
  agentId: string,
  widgetToken: string | null | undefined,
  title: string,
  welcome: string,
  kind: "widget" | "help",
): string {
  return kind === "help"
    ? buildHelpEmbedUrl(origin, agentId, widgetToken, title, welcome)
    : buildWidgetEmbedUrl(origin, agentId, widgetToken, title, welcome);
}
