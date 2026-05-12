import twilio from "twilio";
import { getTwilioAccountSid, getTwilioAuthToken } from "./env";

let client: twilio.Twilio | null = null;

export function getTwilioClient(): twilio.Twilio {
  if (!client) {
    client = twilio(getTwilioAccountSid(), getTwilioAuthToken());
  }
  return client;
}

export async function sendWhatsAppMessage(params: {
  to: string;
  body: string;
  from?: string;
}): Promise<{ messageSid: string }> {
  const twilioClient = getTwilioClient();
  const from = params.from ?? getTwilioWhatsappNumber();

  const message = await twilioClient.messages.create({
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
