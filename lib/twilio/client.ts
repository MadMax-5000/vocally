import twilio from "twilio";

import { prisma } from "@/lib/db/prisma";
import { getOrgTwilioCredentials } from "@/lib/twilio/subaccounts";
import { getTwilioAccountSid, getTwilioAuthToken, getTwilioSmsNumber } from "./env";
import { createTwilioClientForCredentials } from "./validate";

let parentClient: twilio.Twilio | null = null;

export function getTwilioClient(): twilio.Twilio {
  if (!parentClient) {
    parentClient = twilio(getTwilioAccountSid(), getTwilioAuthToken());
  }
  return parentClient;
}

async function resolveWhatsappSendCredentials(from: string): Promise<{
  client: twilio.Twilio;
  from: string;
}> {
  const mapping = await prisma.whatsappPhoneNumber.findUnique({
    where: { twilioNumber: from },
    select: { orgId: true, twilioNumber: true, twilioSenderSid: true },
  });

  if (mapping?.twilioSenderSid) {
    const subaccount = await getOrgTwilioCredentials(mapping.orgId);
    if (subaccount) {
      return {
        client: createTwilioClientForCredentials(subaccount),
        from: mapping.twilioNumber,
      };
    }
  }

  return {
    client: getTwilioClient(),
    from: from || getTwilioWhatsappNumber(),
  };
}

export async function sendWhatsAppMessage(params: {
  to: string;
  body: string;
  from?: string;
}): Promise<{ messageSid: string }> {
  const fromParam = params.from ?? getTwilioWhatsappNumber();
  const { client, from } = await resolveWhatsappSendCredentials(fromParam);

  const message = await client.messages.create({
    from,
    to: params.to.startsWith("whatsapp:") ? params.to : `whatsapp:${params.to}`,
    body: params.body,
  });

  return { messageSid: message.sid };
}

function getTwilioWhatsappNumber(): string {
  const num = process.env.TWILIO_WHATSAPP_NUMBER;
  if (!num) throw new Error("TWILIO_WHATSAPP_NUMBER is not configured");
  return num.startsWith("whatsapp:") ? num : `whatsapp:${num}`;
}

export async function sendSmsMessage(params: {
  to: string;
  body: string;
  from?: string;
}): Promise<{ messageSid: string }> {
  const twilioClient = getTwilioClient();
  const from = params.from ?? getTwilioSmsNumber();

  const message = await twilioClient.messages.create({
    from,
    to: params.to,
    body: params.body,
  });

  return { messageSid: message.sid };
}
