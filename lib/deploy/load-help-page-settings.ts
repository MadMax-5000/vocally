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

  const token = options?.widgetToken?.trim();
  if (token && agent.widgetToken && agent.widgetToken !== token) {
    return null;
  }

  const settings = resolveWebChatHelpPageSettings(agent.name, agent.channels);
  const pageTitle = options?.titleOverride?.trim() || settings.pageTitle;
  const headline = options?.headlineOverride?.trim() || settings.headline;

  return {
    agentId: agent.id,
    agentName: agent.name,
    widgetToken: token || undefined,
    settings: {
      ...settings,
      pageTitle,
      headline,
    },
  };
}
