const hitsByKey = new Map<string, number[]>();
const WINDOW_MS = 60_000;

export function resetChatRateLimitForTests(): void {
  hitsByKey.clear();
}

export function consumeChatRateLimit(
  key: string,
  limitPerMinute: number,
  now = Date.now(),
): boolean {
  if (limitPerMinute <= 0) return true;

  const cutoff = now - WINDOW_MS;
  const prior = hitsByKey.get(key) ?? [];
  const recent = prior.filter((ts) => ts > cutoff);

  if (recent.length >= limitPerMinute) {
    hitsByKey.set(key, recent);
    return false;
  }

  recent.push(now);
  hitsByKey.set(key, recent);
  return true;
}

export function clientIpFromHeaders(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip")?.trim() || "unknown";
}
