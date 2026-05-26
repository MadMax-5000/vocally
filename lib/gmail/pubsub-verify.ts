import { OAuth2Client } from "google-auth-library";

function getPushAudience(): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  return `${base.replace(/\/$/, "")}/api/webhooks/gmail/push`;
}

/**
 * Verifies the OIDC JWT on Pub/Sub push requests.
 * @see https://cloud.google.com/pubsub/docs/push#authentication
 */
export async function verifyPubSubPushToken(
  authorizationHeader: string | null,
): Promise<boolean> {
  if (!authorizationHeader?.startsWith("Bearer ")) {
    return false;
  }
  const token = authorizationHeader.slice(7);

  if (process.env.NODE_ENV !== "production" && process.env.GMAIL_PUBSUB_SKIP_VERIFY === "true") {
    return true;
  }

  try {
    const client = new OAuth2Client();
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: getPushAudience(),
    });
    const payload = ticket.getPayload();
    if (!payload?.email_verified) return false;
    const issuer = payload.iss;
    return issuer === "https://accounts.google.com" || issuer === "accounts.google.com";
  } catch {
    return false;
  }
}
