import { prisma } from "@/lib/db/prisma";
import {
  resolveWebChatHelpPageSettings,
  type ResolvedWebChatHelpPageSettings,
} from "@/lib/deploy/web-chat-config";

export type PublicHelpPageData = {
  agentId: string;
  agentName: string;
  widgetToken?: string;
  settings: ResolvedWebChatHelpPageSettings;
};

export async function loadPublicHelpPageData(
  agentId: string,
  options?: {
    widgetToken?: string | null;
    titleOverride?: string | null;
    headlineOverride?: string | null;
  },
): Promise<PublicHelpPageData | null> {
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

  const settings = resolveWebChatHelpPageSettings(refreshed.name, refreshed.channels);
  const pageTitle = options?.titleOverride?.trim() || settings.pageTitle;
  const headline = options?.headlineOverride?.trim() || settings.headline;

  return {
    agentId: refreshed.id,
    agentName: refreshed.name,
    widgetToken: token || undefined,
    settings: {
      ...settings,
      pageTitle,
      headline,
    },
  };
}
