import { locales, defaultLocale, type Locale } from "@/i18n/config";
import type { Channel } from "@prisma/client";

export const ZERNIO_SOCIAL_CHANNELS = ["INSTAGRAM", "MESSENGER", "WHATSAPP"] as const;
export type ZernioSocialChannel = (typeof ZERNIO_SOCIAL_CHANNELS)[number];

const PLATFORM_TO_CHANNEL: Record<string, ZernioSocialChannel> = {
  instagram: "INSTAGRAM",
  facebook: "MESSENGER",
  messenger: "MESSENGER",
  whatsapp: "WHATSAPP",
};

const CHANNEL_TO_SLUG: Record<ZernioSocialChannel, string> = {
  INSTAGRAM: "instagram",
  MESSENGER: "messenger",
  WHATSAPP: "whatsapp",
};

export function isZernioSocialChannel(value: string): value is ZernioSocialChannel {
  return (ZERNIO_SOCIAL_CHANNELS as readonly string[]).includes(value);
}

export function normalizeZernioChannel(value: string | null | undefined): ZernioSocialChannel | null {
  if (!value) return null;
  const key = value.trim().toLowerCase();
  if (key in PLATFORM_TO_CHANNEL) return PLATFORM_TO_CHANNEL[key];
  const upper = value.trim().toUpperCase();
  return isZernioSocialChannel(upper) ? upper : null;
}

export function zernioDeploySlug(channel: ZernioSocialChannel): string {
  return CHANNEL_TO_SLUG[channel];
}

export function resolveCallbackLocale(
  queryLocale: string | null | undefined,
  cookieLocale: Locale,
): Locale {
  if (queryLocale && locales.includes(queryLocale as Locale)) {
    return queryLocale as Locale;
  }
  if (locales.includes(cookieLocale)) return cookieLocale;
  return defaultLocale;
}

export function socialDeployPath(
  locale: Locale,
  agentId: string,
  slug: string,
  error?: string,
): string {
  const path = `/${locale}/dashboard/agents/${agentId}/deploy/${slug}`;
  if (!error) return path;
  return `${path}?error=${encodeURIComponent(error)}`;
}

export function agentsListPath(locale: Locale, error?: string): string {
  const path = `/${locale}/dashboard/agents`;
  if (!error) return path;
  return `${path}?error=${encodeURIComponent(error)}`;
}

export function agentDetailPath(locale: Locale, agentId: string, error?: string): string {
  const path = `/${locale}/dashboard/agents/${agentId}`;
  if (!error) return path;
  return `${path}?error=${encodeURIComponent(error)}`;
}

export function toPrismaChannel(channel: ZernioSocialChannel): Channel {
  return channel;
}
