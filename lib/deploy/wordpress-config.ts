import type { AgentChannel } from "@prisma/client";

import { buildWidgetEmbedUrl } from "@/lib/deploy/embed-urls";
import { isIntegrationDeploymentEnabled } from "@/lib/deploy/web-chat-config";

const WORDPRESS_DEPLOYMENT = { id: "wordpress" as const, channelType: undefined };

export function isWordPressDeploymentEnabled(
  channels: Pick<AgentChannel, "channel" | "enabled" | "config">[],
): boolean {
  return isIntegrationDeploymentEnabled(channels, WORDPRESS_DEPLOYMENT);
}

export type WordPressPluginDefaults = {
  appUrl: string;
  agentId: string;
  widgetToken: string | null;
  embedUrl: string;
};

export function buildWordPressPluginDefaults(
  origin: string,
  agentId: string,
  widgetToken: string | null | undefined,
  title: string,
  welcome: string,
): WordPressPluginDefaults {
  const appUrl = origin.replace(/\/$/, "");
  return {
    appUrl,
    agentId,
    widgetToken: widgetToken ?? null,
    embedUrl: buildWidgetEmbedUrl(appUrl, agentId, widgetToken, title, welcome),
  };
}
