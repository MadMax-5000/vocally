import { getWhatsappWebhookUrl } from "@/lib/deploy/whatsapp-config";

export type TwilioWhatsappSenderStatus =
  | "CREATING"
  | "OFFLINE"
  | "ONLINE"
  | "VERIFYING"
  | "FAILED"
  | string;

export type TwilioWhatsappSender = {
  sid: string;
  sender_id: string;
  status: TwilioWhatsappSenderStatus;
  configuration?: { waba_id?: string };
  properties?: {
    quality_rating?: string;
    messaging_limit?: string;
  };
  status_message?: string;
};

type TwilioCredentials = {
  accountSid: string;
  authToken: string;
};

function twilioAuthHeader(creds: TwilioCredentials): string {
  return `Basic ${Buffer.from(`${creds.accountSid}:${creds.authToken}`).toString("base64")}`;
}

async function parseTwilioError(res: Response): Promise<string> {
  try {
    const json = (await res.json()) as { message?: string };
    return json.message ?? `Twilio API error (${res.status})`;
  } catch {
    return `Twilio API error (${res.status})`;
  }
}

export async function createWhatsappSender(params: {
  credentials: TwilioCredentials;
  senderId: string;
  wabaId?: string;
  profileName?: string;
}): Promise<TwilioWhatsappSender> {
  const { credentials, senderId, wabaId, profileName } = params;
  const body: Record<string, unknown> = {
    sender_id: senderId,
    webhook: {
      callback_method: "POST",
      callback_url: getWhatsappWebhookUrl(),
    },
  };

  if (wabaId) {
    body.configuration = { waba_id: wabaId };
  }

  if (profileName) {
    body.profile = { name: profileName };
  }

  const res = await fetch("https://messaging.twilio.com/v2/Channels/Senders", {
    method: "POST",
    headers: {
      Authorization: twilioAuthHeader(credentials),
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(await parseTwilioError(res));
  }

  return (await res.json()) as TwilioWhatsappSender;
}

export async function getWhatsappSender(params: {
  credentials: TwilioCredentials;
  senderSid: string;
}): Promise<TwilioWhatsappSender> {
  const { credentials, senderSid } = params;
  const res = await fetch(
    `https://messaging.twilio.com/v2/Channels/Senders/${encodeURIComponent(senderSid)}`,
    {
      method: "GET",
      headers: {
        Authorization: twilioAuthHeader(credentials),
        "Content-Type": "application/json; charset=utf-8",
      },
    },
  );

  if (!res.ok) {
    throw new Error(await parseTwilioError(res));
  }

  return (await res.json()) as TwilioWhatsappSender;
}

export async function verifyWhatsappSenderOtp(params: {
  credentials: TwilioCredentials;
  senderSid: string;
  verificationCode: string;
}): Promise<TwilioWhatsappSender> {
  const { credentials, senderSid, verificationCode } = params;
  const res = await fetch(
    `https://messaging.twilio.com/v2/Channels/Senders/${encodeURIComponent(senderSid)}`,
    {
      method: "POST",
      headers: {
        Authorization: twilioAuthHeader(credentials),
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({ configuration: { verification_code: verificationCode } }),
    },
  );

  if (!res.ok) {
    throw new Error(await parseTwilioError(res));
  }

  return (await res.json()) as TwilioWhatsappSender;
}

export async function pollWhatsappSenderOnline(params: {
  credentials: TwilioCredentials;
  senderSid: string;
  maxAttempts?: number;
  delayMs?: number;
}): Promise<TwilioWhatsappSender> {
  const { credentials, senderSid, maxAttempts = 12, delayMs = 5000 } = params;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const sender = await getWhatsappSender({ credentials, senderSid });
    if (sender.status === "ONLINE") return sender;
    if (sender.status === "FAILED") {
      throw new Error(sender.status_message ?? "WhatsApp sender registration failed");
    }
    if (attempt < maxAttempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  const last = await getWhatsappSender({ credentials, senderSid });
  return last;
}

export function mapTwilioSenderToConnectionStatus(
  twilioStatus: TwilioWhatsappSenderStatus,
): "CREATING" | "VERIFYING_OTP" | "ONLINE" | "FAILED" | "PENDING" {
  switch (twilioStatus) {
    case "ONLINE":
      return "ONLINE";
    case "VERIFYING":
      return "VERIFYING_OTP";
    case "FAILED":
      return "FAILED";
    case "CREATING":
    case "OFFLINE":
      return "CREATING";
    default:
      return "PENDING";
  }
}
