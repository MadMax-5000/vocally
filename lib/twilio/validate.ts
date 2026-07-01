import { validateRequest } from "twilio";
import twilio from "twilio";

import { getOrgTwilioCredentialsBySubaccountSid } from "@/lib/twilio/subaccounts";
import { getTwilioAuthToken } from "@/lib/twilio/env";

async function resolveAuthTokenForWebhook(
  bodyParams: Record<string, string>,
): Promise<string | null> {
  const accountSid = bodyParams.AccountSid;
  if (accountSid) {
    const subaccount = await getOrgTwilioCredentialsBySubaccountSid(accountSid);
    if (subaccount) return subaccount.authToken;
  }

  try {
    return getTwilioAuthToken();
  } catch {
    return process.env.TWILIO_AUTH_TOKEN?.trim() ?? null;
  }
}

export async function validateTwilioWebhook(params: {
  twilioSignature: string | null;
  url: string;
  bodyParams: Record<string, string>;
}): Promise<boolean> {
  const { twilioSignature, url, bodyParams } = params;
  if (!twilioSignature) return false;

  const authToken = await resolveAuthTokenForWebhook(bodyParams);
  if (!authToken) return false;

  try {
    return validateRequest(authToken, twilioSignature, url, bodyParams);
  } catch {
    return false;
  }
}

export function createTwilioClientForCredentials(params: {
  accountSid: string;
  authToken: string;
}): twilio.Twilio {
  return twilio(params.accountSid, params.authToken);
}
