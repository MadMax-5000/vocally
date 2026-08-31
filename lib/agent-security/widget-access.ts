import {
  isProductAssistantAgent,
  PRODUCT_ASSISTANT_DEFAULT_RATE_LIMIT,
} from "@/lib/ai/product-assistant-agent";
import {
  ORIGIN_NOT_ALLOWED_ERROR,
  RATE_LIMIT_EXCEEDED_ERROR,
} from "./constants";
import { hostnameFromRequest, isHostnameAllowed } from "./hostnames";
import { clientIpFromHeaders, consumeChatRateLimit } from "./rate-limit";

export type WidgetAccessDenial = {
  status: 403 | 429;
  error: string;
};

export function isWidgetTokenRequired(
  agentId: string,
  isOwnerPreview: boolean,
): boolean {
  if (isOwnerPreview) return false;
  return !isProductAssistantAgent(agentId);
}

export function resolveWidgetChatRateLimit(
  agentId: string,
  configured: number | null | undefined,
): number | null | undefined {
  if (isProductAssistantAgent(agentId) && (configured == null || configured <= 0)) {
    return PRODUCT_ASSISTANT_DEFAULT_RATE_LIMIT;
  }
  return configured;
}

export function denyIfOriginNotAllowed(
  headers: Headers,
  allowedHostnames: string[],
): WidgetAccessDenial | null {
  if (allowedHostnames.length === 0) return null;

  const hostname = hostnameFromRequest(
    headers.get("origin"),
    headers.get("referer"),
  );

  if (!isHostnameAllowed(hostname, allowedHostnames)) {
    return { status: 403, error: ORIGIN_NOT_ALLOWED_ERROR };
  }

  return null;
}

export function denyIfChatRateLimited(
  headers: Headers,
  agentId: string,
  limitPerMinute: number | null | undefined,
): WidgetAccessDenial | null {
  if (limitPerMinute == null || limitPerMinute <= 0) return null;

  const ip = clientIpFromHeaders(headers);
  const allowed = consumeChatRateLimit(`${agentId}:${ip}`, limitPerMinute);
  if (!allowed) {
    return { status: 429, error: RATE_LIMIT_EXCEEDED_ERROR };
  }
  return null;
}
