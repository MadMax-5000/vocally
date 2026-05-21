/**
 * Server-side diagnostics. Do not pass message content, names, phones, or other PII in `context`.
 */

/** Non-PII server error breadcrumbs (prefer over console.error). */
export function logServerError(
  event: string,
  context: Record<string, string | number | boolean | undefined>,
): void {
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console -- dev-only structured diagnostics (no user text)
    console.error(JSON.stringify({ level: "error", event, ...context, ts: new Date().toISOString() }));
  }
  void import("@sentry/nextjs")
    .then((Sentry) => {
      Sentry.captureMessage(event, {
        level: "error",
        tags: { subsystem: "server" },
        extra: context,
      });
    })
    .catch(() => {
      /* Sentry optional */
    });
}

export function logServerWarning(
  event: string,
  context: Record<string, string | number | boolean | undefined>,
): void {
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console -- dev-only structured diagnostics (no user text)
    console.warn(JSON.stringify({ level: "warn", event, ...context, ts: new Date().toISOString() }));
  }
  void import("@sentry/nextjs")
    .then((Sentry) => {
      Sentry.captureMessage(event, {
        level: "warning",
        tags: { subsystem: "server" },
        extra: context,
      });
    })
    .catch(() => {
      /* Sentry optional */
    });
}
