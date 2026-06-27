"use client";

import { ChatWidget } from "@/components/chat/ChatWidget";
import { ChatWidgetFloating } from "@/components/chat/ChatWidgetFloating";
import type { PublicWidgetPageData } from "@/lib/deploy/load-widget-settings";
import type { WidgetEmbedLayout } from "@/lib/deploy/web-chat-config";

type WidgetPageClientProps = {
  data: PublicWidgetPageData;
  layout?: WidgetEmbedLayout;
};

export function WidgetPageClient({ data, layout = "inline" }: WidgetPageClientProps) {
  const { settings } = data;

  const chatProps = {
    agentId: data.agentId,
    widgetToken: data.widgetToken,
    agentName: data.displayName,
    welcomeMessage: data.welcomeMessage,
    appearance: settings.appearance,
    primaryColor: settings.primaryColor,
    placeholder: settings.placeholder,
    suggestedMessages: settings.suggestedMessages,
    keepShowingSuggested: settings.keepShowingSuggested,
    suggestedMessagesAction: settings.suggestedMessagesAction,
    customButtonsAction: settings.customButtonsAction,
    deployment: "widget" as const,
    voiceToTextEnabled: settings.voiceToTextEnabled,
    showPoweredBy: true,
  };

  if (layout === "floating") {
    return (
      <div className="h-dvh w-full overflow-hidden bg-transparent">
        <ChatWidgetFloating
          {...chatProps}
          bubbleColor={settings.bubbleColor}
          autoShowWelcomePopup={settings.autoShowWelcomePopup}
          autoShowWelcomePopupMobile={settings.autoShowWelcomePopupMobile}
          welcomePopupDelaySec={settings.welcomePopupDelaySec}
        />
      </div>
    );
  }

  return (
    <div className="h-dvh w-full overflow-hidden bg-transparent">
      <ChatWidget
        {...chatProps}
        className="h-full w-full rounded-none border-0 shadow-none"
      />
    </div>
  );
}
