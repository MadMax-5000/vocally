import { z } from "zod";

const FALLBACK_ORIGIN = "https://app.vocally.ai";

/** E.164 phone number (with leading +). */
export const e164PhoneSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/^whatsapp:/i, "").replace(/\s/g, ""))
  .refine((v) => /^\+[1-9]\d{6,14}$/.test(v), {
    message: "Enter a valid phone number in E.164 format (e.g. +14155238886)",
  });

export function normalizeWhatsappSenderId(phone: string): string {
  const trimmed = phone.trim();
  const withoutPrefix = trimmed.replace(/^whatsapp:/i, "").replace(/\s/g, "");
  const e164 = withoutPrefix.startsWith("+") ? withoutPrefix : `+${withoutPrefix}`;
  return `whatsapp:${e164}`;
}

export function formatWhatsappDisplay(twilioNumber: string): string {
  return twilioNumber.replace(/^whatsapp:/i, "");
}

export function maskPhoneForDisplay(phone: string): string {
  const display = formatWhatsappDisplay(phone);
  if (display.length <= 7) return display;
  return `${display.slice(0, 4)}···${display.slice(-3)}`;
}

/** Server-side public app origin for webhook URLs. */
export function getAppOrigin(): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (envUrl) return envUrl.replace(/\/$/, "");
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, "")}`;
  return FALLBACK_ORIGIN;
}

export function getWhatsappWebhookUrl(): string {
  return `${getAppOrigin()}/api/webhooks/twilio/message`;
}

export function isTwilioPlatformConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID?.trim() && process.env.TWILIO_AUTH_TOKEN?.trim(),
  );
}

export function isWhatsappEmbeddedSignupConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_META_APP_ID?.trim() &&
      process.env.NEXT_PUBLIC_META_EMBEDDED_SIGNUP_CONFIG_ID?.trim(),
  );
}

export function isWhatsappSandboxMode(): boolean {
  return process.env.WHATSAPP_SANDBOX_MODE === "true";
}

export function isWhatsappConnectAvailable(): boolean {
  return isWhatsappSandboxMode() || isWhatsappEmbeddedSignupConfigured();
}

export function getSuggestedWhatsappNumber(): string | null {
  const num = process.env.TWILIO_WHATSAPP_NUMBER?.trim();
  if (!num) return null;
  return formatWhatsappDisplay(
    num.startsWith("whatsapp:") ? num : `whatsapp:${num}`,
  );
}

export type WhatsAppReadinessInput = {
  channelEnabled: boolean;
  agentActive: boolean;
  agentPublic: boolean;
  mappingActive: boolean;
  platformConfigured: boolean;
};

export function isWhatsAppReady(input: WhatsAppReadinessInput): boolean {
  return (
    input.platformConfigured &&
    input.channelEnabled &&
    input.agentActive &&
    input.agentPublic &&
    input.mappingActive
  );
}

export function isLegacyWhatsappConnection(connection: {
  twilioSenderSid: string | null;
  status: string;
} | null): boolean {
  if (!connection) return false;
  return !connection.twilioSenderSid && connection.status === "PENDING";
}
