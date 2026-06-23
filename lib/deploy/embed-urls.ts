import { buildEmbedQueryParams } from "@/lib/deploy/web-chat-config";

export { useEmbedOrigin } from "@/lib/deploy/embed-origin";

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

export function buildHelpPageUrl(origin: string, agentId: string): string {
  return `${origin}/help/${agentId}`;
}

export function buildHelpEmbedUrl(
  origin: string,
  agentId: string,
  widgetToken: string | null | undefined,
  title?: string,
  welcome?: string,
): string {
  if (title !== undefined || welcome !== undefined) {
    const qs = buildEmbedQueryParams(widgetToken, title ?? "", welcome ?? "");
    return `${origin}/help/${agentId}?${qs}`;
  }
  const params = new URLSearchParams();
  if (widgetToken) params.set("token", widgetToken);
  const qs = params.toString();
  return `${origin}/help/${agentId}${qs ? `?${qs}` : ""}`;
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
