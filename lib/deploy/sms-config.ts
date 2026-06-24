import { z } from "zod";

const FALLBACK_ORIGIN = "https://app.vocally.ai";

export const e164PhoneSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/\s/g, ""))
  .refine((v) => /^\+[1-9]\d{6,14}$/.test(v), {
    message: "Enter a valid phone number in E.164 format (e.g. +14155238886)",
  });

export function getAppOrigin(): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (envUrl) return envUrl.replace(/\/$/, "");
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, "")}`;
  return FALLBACK_ORIGIN;
}

export function getSmsWebhookUrl(): string {
  return `${getAppOrigin()}/api/webhooks/twilio/sms`;
}

export function isTwilioPlatformConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID?.trim() && process.env.TWILIO_AUTH_TOKEN?.trim(),
  );
}

export function getSuggestedSmsNumber(): string | null {
  return process.env.TWILIO_SMS_NUMBER?.trim() ?? null;
}

export type SmsReadinessInput = {
  channelEnabled: boolean;
  agentActive: boolean;
  agentPublic: boolean;
  mappingActive: boolean;
  platformConfigured: boolean;
};

export function isSmsReady(input: SmsReadinessInput): boolean {
  return (
    input.platformConfigured &&
    input.channelEnabled &&
    input.agentActive &&
    input.agentPublic &&
    input.mappingActive
  );
}
