import { validateRequest } from "twilio";

export function validateTwilioWebhook(params: {
  twilioSignature: string | null;
  url: string;
  bodyParams: Record<string, string>;
}): boolean {
  const { twilioSignature, url, bodyParams } = params;
  if (!twilioSignature) return false;

  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) {
    return false;
  }

  try {
    return validateRequest(authToken, twilioSignature, url, bodyParams);
  } catch {
    return false;
  }
}
