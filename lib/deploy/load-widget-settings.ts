import { prisma } from "@/lib/db/prisma";
import {
  resolveWebChatWidgetSettings,
  resolveWidgetDisplayName,
  resolveWidgetWelcomeMessage,
  getWebChatWidgetConfig,
  type ResolvedWebChatWidgetSettings,
} from "@/lib/deploy/web-chat-config";

export type PublicWidgetPageData = {
  agentId: string;
  widgetToken?: string;
  displayName: string;
  welcomeMessage: string;
  settings: ResolvedWebChatWidgetSettings;
};

export async function loadPublicWidgetPageData(
  agentId: string,
  options?: {
    widgetToken?: string | null;
    titleOverride?: string | null;
    welcomeOverride?: string | null;
    isMobile?: boolean;
  },
): Promise<PublicWidgetPageData | null> {
  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    include: { channels: true },
  });

  if (!agent) return null;

  const token = options?.widgetToken?.trim();
  if (token && agent.widgetToken && agent.widgetToken !== token) {
    return null;
  }

  const widget = getWebChatWidgetConfig(agent.channels);
  const settings = resolveWebChatWidgetSettings(
    agent.name,
    agent.welcomeMessage,
    agent.channels,
    { isMobile: options?.isMobile },
  );

  const displayName =
    options?.titleOverride?.trim() ||
    resolveWidgetDisplayName(agent.name, widget);

  const welcomeMessage =
    options?.welcomeOverride?.trim() ||
    resolveWidgetWelcomeMessage(agent.welcomeMessage, widget, options?.isMobile);

  return {
    agentId: agent.id,
    widgetToken: token || undefined,
    displayName,
    welcomeMessage,
    settings: {
      ...settings,
      displayName,
      welcomeMessage,
    },
  };
}
