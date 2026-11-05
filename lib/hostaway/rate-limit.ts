/**
 * Hostaway allows 30 conversation message sends per minute per account.
 * This is a per-process guard; it prevents accidental bursts but is not a
 * distributed limiter when several app instances run.
 */
const WINDOW_MS = 60_000;
const MAX_SENDS_PER_WINDOW = 30;

const sendsByConnection = new Map<string, number[]>();

export function resetHostawaySendRateLimitForTests(): void {
  sendsByConnection.clear();
}

export function tryConsumeHostawaySendSlot(
  connectionId: string,
  now = Date.now(),
): boolean {
  const cutoff = now - WINDOW_MS;
  const recent = (sendsByConnection.get(connectionId) ?? []).filter(
    (ts) => ts > cutoff,
  );

  if (recent.length >= MAX_SENDS_PER_WINDOW) {
    sendsByConnection.set(connectionId, recent);
    return false;
  }

  recent.push(now);
  sendsByConnection.set(connectionId, recent);
  return true;
}
