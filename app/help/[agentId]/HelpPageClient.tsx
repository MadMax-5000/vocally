"use client";

import type { PublicHelpPageData } from "@/lib/deploy/load-help-page-settings";

import { HelpCenterChat } from "@/components/chat/HelpCenterChat";

type HelpPageClientProps = {
  data: PublicHelpPageData;
  sidebarLabel: string;
};

export function HelpPageClient({ data, sidebarLabel }: HelpPageClientProps) {
  return (
    <HelpCenterChat
      agentId={data.agentId}
      widgetToken={data.widgetToken}
      sidebarLabel={sidebarLabel}
      settings={data.settings}
    />
  );
}
