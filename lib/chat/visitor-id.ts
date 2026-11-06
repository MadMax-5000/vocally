const VISITOR_KEY_PREFIX = "anselio:visitor:";

function randomVisitorId(): string {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
  } catch {
    // Fall through to the timestamp-based ID.
  }

  return `v-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

/**
 * Stable, anonymous per-agent visitor key used to scope conversation history.
 * Stored in localStorage so it survives reloads; if storage is unavailable the
 * current session still works, it just will not be listed after a reload.
 */
export function getOrCreateVisitorId(agentId: string): string {
  const key = `${VISITOR_KEY_PREFIX}${agentId}`;

  try {
    const existing = window.localStorage.getItem(key);
    if (existing) return existing;

    const created = randomVisitorId();
    window.localStorage.setItem(key, created);
    return created;
  } catch {
    return randomVisitorId();
  }
}
