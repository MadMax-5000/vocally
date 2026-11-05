export class HostawayError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    /** Unix timestamp (seconds) from X-RateLimit-Retry-After, when present. */
    public retryAfter?: number,
  ) {
    super(message);
    this.name = "HostawayError";
  }
}

export function hostawayErrorFromResponse(
  status: number,
  body: unknown,
  headers?: Headers,
): HostawayError {
  const parsed =
    body && typeof body === "object" ? (body as Record<string, unknown>) : null;
  const message =
    typeof parsed?.message === "string"
      ? parsed.message
      : typeof parsed?.result === "string"
        ? parsed.result
        : `Hostaway API error (${status})`;
  const retryHeader = headers?.get("x-ratelimit-retry-after");
  const retryAfter = retryHeader ? Number.parseInt(retryHeader, 10) : undefined;

  return new HostawayError(
    message,
    status,
    typeof parsed?.status === "string" ? parsed.status : undefined,
    Number.isFinite(retryAfter) ? retryAfter : undefined,
  );
}

export function isHostawayAuthError(err: unknown): boolean {
  return err instanceof HostawayError && (err.status === 401 || err.status === 403);
}
