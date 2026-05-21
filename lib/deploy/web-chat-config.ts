import type { AgentChannel, AgentChannelType } from "@prisma/client";

import type { DeployCatalogEntry } from "@/lib/constants/deploy-catalog";

export type WebChatChannelConfig = {
  helpPage?: { enabled?: boolean };
  integrations?: Record<string, { enabled?: boolean }>;
};

export function parseWebChatConfig(config: unknown): WebChatChannelConfig {
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    return {};
  }
  const raw = config as Record<string, unknown>;

  const result: WebChatChannelConfig = {};

  const helpPage = raw.helpPage;
  if (helpPage && typeof helpPage === "object" && !Array.isArray(helpPage)) {
    const hp = helpPage as Record<string, unknown>;
    result.helpPage = {
      enabled: typeof hp.enabled === "boolean" ? hp.enabled : undefined,
    };
  }

  const integrations = raw.integrations;
  if (
    integrations &&
    typeof integrations === "object" &&
    !Array.isArray(integrations)
  ) {
    const parsed: Record<string, { enabled?: boolean }> = {};
    for (const [key, value] of Object.entries(integrations)) {
      if (value && typeof value === "object" && !Array.isArray(value)) {
        const v = value as Record<string, unknown>;
        parsed[key] = {
          enabled: typeof v.enabled === "boolean" ? v.enabled : undefined,
        };
      }
    }
    result.integrations = parsed;
  }

  return result;
}

export function getWebChatChannel(
  channels: Pick<AgentChannel, "channel" | "enabled" | "config">[],
) {
  return channels.find((c) => c.channel === "WEB_CHAT");
}

export function getAgentChannel(
  channels: Pick<AgentChannel, "channel" | "enabled" | "config">[],
  channelType: AgentChannelType,
) {
  return channels.find((c) => c.channel === channelType);
}

/** Defaults to enabled when channel row is missing. */
export function isWebChatEnabled(
  channels: Pick<AgentChannel, "channel" | "enabled" | "config">[],
): boolean {
  const row = getWebChatChannel(channels);
  if (!row) return true;
  return row.enabled;
}

/** Defaults to enabled when not explicitly disabled in config. */
export function isHelpPageEnabled(
  channels: Pick<AgentChannel, "channel" | "enabled" | "config">[],
): boolean {
  const row = getWebChatChannel(channels);
  if (!row) return true;
  const parsed = parseWebChatConfig(row.config);
  return parsed.helpPage?.enabled !== false;
}

/** Integration / config-only deployments default to off until enabled. */
export function isIntegrationDeploymentEnabled(
  channels: Pick<AgentChannel, "channel" | "enabled" | "config">[],
  entry: Pick<DeployCatalogEntry, "id" | "channelType">,
): boolean {
  if (entry.channelType) {
    const row = getAgentChannel(channels, entry.channelType);
    return row?.enabled ?? false;
  }

  const webChat = getWebChatChannel(channels);
  if (!webChat) return false;
  const parsed = parseWebChatConfig(webChat.config);
  return parsed.integrations?.[entry.id]?.enabled ?? false;
}

export function buildEmbedQueryParams(
  widgetToken: string | null | undefined,
  title: string,
  welcome: string,
): string {
  const params = new URLSearchParams();
  if (widgetToken) params.set("token", widgetToken);
  params.set("title", title);
  params.set("welcome", welcome);
  return params.toString();
}
