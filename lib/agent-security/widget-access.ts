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
