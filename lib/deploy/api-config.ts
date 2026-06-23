import type { AgentChannel } from "@prisma/client";

import { parseWebChatConfig } from "@/lib/deploy/web-chat-config";

export function isApiDeploymentEnabled(
  channels: Pick<AgentChannel, "channel" | "enabled" | "config">[],
): boolean {
  const webChat = channels.find((c) => c.channel === "WEB_CHAT");
  if (!webChat) return false;
  const parsed = parseWebChatConfig(webChat.config);
  return parsed.integrations?.api?.enabled ?? false;
}

export function buildAgentChatApiUrl(origin: string, agentId: string): string {
  const base = origin.replace(/\/$/, "");
  return `${base}/api/v1/agents/${agentId}/chat`;
}
