"use client";

import { WidgetEmbedFromAgent } from "@/components/dashboard/agent-detail/deploy/WidgetEmbedSnippetSection";
import { resolveWidgetDisplayName } from "@/lib/deploy/web-chat-config";

import type { ChatWidgetDraft } from "./chat-widget-draft";

type ChatWidgetEmbedSectionProps = {
  agentId: string;
  agentName: string;
  widgetToken: string | null;
  draft: ChatWidgetDraft;
};

export function ChatWidgetEmbedSection({
  agentId,
  agentName,
  widgetToken,
  draft,
}: ChatWidgetEmbedSectionProps) {
  const title = resolveWidgetDisplayName(agentName, {
    displayName: draft.widget.displayName.trim() || undefined,
  });
  const welcome = draft.welcomeMessage.trim() || "Hello! How can I help you today?";

  return (
    <WidgetEmbedFromAgent
      agentId={agentId}
      agentName={agentName}
      widgetToken={widgetToken}
      title={title}
      welcome={welcome}
      description="Add this widget to your website. Snippets use your saved display name and welcome message — save any changes on Content before copying."
      iframeHint="Paste this iframe tag anywhere in your HTML where you want the chat to appear."
      floatingHint="Paste this snippet where you want the floating chat bubble to appear on your site."
    />
  );
}
