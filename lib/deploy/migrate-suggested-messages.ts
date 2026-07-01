import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { parseWebChatConfig, type WebChatChannelConfig } from "@/lib/deploy/web-chat-config";

const MAX_STARTERS = 20;

function parseLegacyStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is string => typeof v === "string")
    .map((s) => s.trim())
    .filter(Boolean);
}

function dedupeStarters(items: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of items) {
    const key = item.trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(key);
    if (result.length >= MAX_STARTERS) break;
  }
  return result;
}

/** Read legacy deploy lists from raw channel config JSON. */
export function collectLegacyStaticStarters(rawConfig: unknown): string[] {
  if (!rawConfig || typeof rawConfig !== "object" || Array.isArray(rawConfig)) {
    return [];
  }

  const raw = rawConfig as Record<string, unknown>;
  const widgetRaw = raw.widget;
  const helpRaw = raw.helpPage;
  const widgetList =
    widgetRaw && typeof widgetRaw === "object" && !Array.isArray(widgetRaw)
      ? parseLegacyStringArray((widgetRaw as Record<string, unknown>).suggestedMessages)
      : [];
  const helpList =
    helpRaw && typeof helpRaw === "object" && !Array.isArray(helpRaw)
      ? parseLegacyStringArray((helpRaw as Record<string, unknown>).suggestedMessages)
      : [];

  return dedupeStarters([...widgetList, ...helpList]);
}

function readLegacyKeepShowing(rawConfig: unknown): boolean {
  if (!rawConfig || typeof rawConfig !== "object" || Array.isArray(rawConfig)) {
    return false;
  }

  const raw = rawConfig as Record<string, unknown>;
  const widgetRaw = raw.widget;
  const helpRaw = raw.helpPage;
  const widgetKeep =
    widgetRaw &&
    typeof widgetRaw === "object" &&
    !Array.isArray(widgetRaw) &&
    (widgetRaw as Record<string, unknown>).keepShowingSuggested === true;
  const helpKeep =
    helpRaw &&
    typeof helpRaw === "object" &&
    !Array.isArray(helpRaw) &&
    (helpRaw as Record<string, unknown>).keepShowingSuggested === true;

  return Boolean(widgetKeep || helpKeep);
}

export function migrateLegacySuggestedMessagesConfig(
  config: unknown,
): { config: WebChatChannelConfig; migrated: boolean } {
  const parsed = parseWebChatConfig(config);
  const currentAction = parsed.actions?.suggestedMessages ?? {};
  const existingStarters = currentAction.staticStarters ?? [];

  if (existingStarters.length > 0) {
    return { config: parsed, migrated: false };
  }

  const legacyStarters = collectLegacyStaticStarters(config);
  const legacyKeepShowing = readLegacyKeepShowing(config);

  if (legacyStarters.length === 0 && !legacyKeepShowing) {
    return { config: parsed, migrated: false };
  }

  const nextAction = { ...currentAction };

  if (legacyStarters.length > 0) {
    nextAction.staticStarters = legacyStarters;
  }

  if (
    legacyKeepShowing &&
    typeof nextAction.keepShowingAfterFirst !== "boolean"
  ) {
    nextAction.keepShowingAfterFirst = true;
  }

  const nextConfig: WebChatChannelConfig = {
    ...parsed,
    actions: {
      ...(parsed.actions ?? {}),
      suggestedMessages: nextAction,
    },
  };

  return { config: nextConfig, migrated: true };
}

function channelConfigToJson(config: WebChatChannelConfig): Prisma.InputJsonValue {
  return config as unknown as Prisma.InputJsonValue;
}

/** One-time migration: copy legacy deploy lists into actions.suggestedMessages. */
export async function ensureSuggestedMessagesMigrated(
  agentId: string,
): Promise<boolean> {
  const row = await prisma.agentChannel.findUnique({
    where: {
      agentId_channel: { agentId, channel: "WEB_CHAT" },
    },
    select: { config: true },
  });

  if (!row) return false;

  const { config: migratedConfig, migrated } = migrateLegacySuggestedMessagesConfig(
    row.config,
  );

  if (!migrated) return false;

  await prisma.agentChannel.update({
    where: {
      agentId_channel: { agentId, channel: "WEB_CHAT" },
    },
    data: { config: channelConfigToJson(migratedConfig) },
  });

  return true;
}
