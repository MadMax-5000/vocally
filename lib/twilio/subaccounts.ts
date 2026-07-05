import twilio from "twilio";

import { BRAND_NAME } from "@/lib/constants/brand";
import { encryptToken } from "@/lib/crypto/token-encryption";
import { prisma } from "@/lib/db/prisma";
import { getTwilioAccountSid, getTwilioAuthToken } from "@/lib/twilio/env";

export type TwilioSubaccountCredentials = {
  accountSid: string;
  authToken: string;
};

export async function getOrgTwilioCredentials(
  orgId: string,
): Promise<TwilioSubaccountCredentials | null> {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { twilioSubaccountSid: true, twilioSubaccountAuthTokenEnc: true },
  });
  if (!org?.twilioSubaccountSid || !org.twilioSubaccountAuthTokenEnc) {
    return null;
  }
  const { decryptToken } = await import("@/lib/crypto/token-encryption");
  return {
    accountSid: org.twilioSubaccountSid,
    authToken: decryptToken(org.twilioSubaccountAuthTokenEnc),
  };
}

export async function getOrgTwilioCredentialsBySubaccountSid(
  subaccountSid: string,
): Promise<(TwilioSubaccountCredentials & { orgId: string }) | null> {
  const org = await prisma.organization.findFirst({
    where: { twilioSubaccountSid: subaccountSid },
    select: {
      id: true,
      twilioSubaccountSid: true,
      twilioSubaccountAuthTokenEnc: true,
    },
  });
  if (!org?.twilioSubaccountSid || !org.twilioSubaccountAuthTokenEnc) {
    return null;
  }
  const { decryptToken } = await import("@/lib/crypto/token-encryption");
  return {
    orgId: org.id,
    accountSid: org.twilioSubaccountSid,
    authToken: decryptToken(org.twilioSubaccountAuthTokenEnc),
  };
}

/** Creates a Twilio subaccount for the org if missing; returns subaccount credentials. */
export async function ensureOrgTwilioSubaccount(
  orgId: string,
): Promise<TwilioSubaccountCredentials> {
  const existing = await getOrgTwilioCredentials(orgId);
  if (existing) return existing;

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { id: true, name: true },
  });
  if (!org) throw new Error("Organization not found");

  const parentSid = getTwilioAccountSid();
  const parentToken = getTwilioAuthToken();
  const client = twilio(parentSid, parentToken);

  const account = await client.api.v2010.accounts.create({
    friendlyName: `${BRAND_NAME} — ${org.name}`.slice(0, 64),
  });

  if (!account.sid || !account.authToken) {
    throw new Error("Twilio subaccount creation did not return credentials");
  }

  await prisma.organization.update({
    where: { id: orgId },
    data: {
      twilioSubaccountSid: account.sid,
      twilioSubaccountAuthTokenEnc: encryptToken(account.authToken),
    },
  });

  return { accountSid: account.sid, authToken: account.authToken };
}
