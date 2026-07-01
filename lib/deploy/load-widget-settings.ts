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

  const { ensureSuggestedMessagesMigrated } = await import(
    "@/lib/deploy/migrate-suggested-messages"
  );
  await ensureSuggestedMessagesMigrated(agentId);

  const refreshed = await prisma.agent.findUnique({
    where: { id: agentId },
    include: { channels: true },
  });
  if (!refreshed) return null;

  const token = options?.widgetToken?.trim();
  if (token && refreshed.widgetToken && refreshed.widgetToken !== token) {
    return null;
  }

  const widget = getWebChatWidgetConfig(refreshed.channels);
  const settings = resolveWebChatWidgetSettings(
    refreshed.name,
    refreshed.welcomeMessage,
    refreshed.channels,
    { isMobile: options?.isMobile },
  );

  const displayName =
    options?.titleOverride?.trim() ||
    resolveWidgetDisplayName(refreshed.name, widget);

  const welcomeMessage =
    options?.welcomeOverride?.trim() ||
    resolveWidgetWelcomeMessage(refreshed.welcomeMessage, widget, options?.isMobile);

  return {
    agentId: refreshed.id,
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
