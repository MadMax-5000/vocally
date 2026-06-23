"use client";

import { ChatWidget } from "@/components/chat/ChatWidget";
import { resolveWebChatWidgetSettings } from "@/lib/deploy/web-chat-config";

import type { AgentDetailWithRelations } from "./agent-detail-types";

type Props = { agent: AgentDetailWithRelations };

export function AgentDetailPreviewTab({ agent }: Props) {
  const welcomeMessage =
    agent.welcomeMessage?.trim() || "Hello! How can I help you today?";
  const widgetSettings = resolveWebChatWidgetSettings(
    agent.name,
    agent.welcomeMessage,
    agent.channels,
  );

  return (
    <div className="flex justify-center px-4 py-4">
      <ChatWidget
        key={`${agent.id}-${agent.updatedAt.getTime()}`}
        agentId={agent.id}
        agentName={agent.name}
        welcomeMessage={welcomeMessage}
        suggestedMessages={widgetSettings.suggestedMessages}
        keepShowingSuggested={widgetSettings.keepShowingSuggested}
        suggestedMessagesAction={widgetSettings.suggestedMessagesAction}
        customButtonsAction={widgetSettings.customButtonsAction}
        deployment="widget"
        onClear
        showPoweredBy
        className="h-[min(660px,72vh)] w-full max-w-[380px]"
      />
    </div>
  );
}
