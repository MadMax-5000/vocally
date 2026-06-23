"use client";

import { ChatWidget } from "@/components/chat/ChatWidget";
import type { PublicWidgetPageData } from "@/lib/deploy/load-widget-settings";

type WidgetPageClientProps = {
  data: PublicWidgetPageData;
};

export function WidgetPageClient({ data }: WidgetPageClientProps) {
  const { settings } = data;

  return (
    <div className="h-dvh w-full overflow-hidden bg-transparent">
      <ChatWidget
        agentId={data.agentId}
        widgetToken={data.widgetToken}
        agentName={data.displayName}
        welcomeMessage={data.welcomeMessage}
        appearance={settings.appearance}
        primaryColor={settings.primaryColor}
        placeholder={settings.placeholder}
        suggestedMessages={settings.suggestedMessages}
        keepShowingSuggested={settings.keepShowingSuggested}
        suggestedMessagesAction={settings.suggestedMessagesAction}
        customButtonsAction={settings.customButtonsAction}
        deployment="widget"
        className="h-full w-full rounded-none border-0 shadow-none"
        showPoweredBy
      />
    </div>
  );
}
