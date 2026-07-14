"use client";

import { useTranslations } from "next-intl";
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
  const t = useTranslations("dashboard.deploy.chatWidget");
  const title = resolveWidgetDisplayName(agentName, {
    displayName: draft.widget.displayName.trim() || undefined,
  });
  const welcome = draft.welcomeMessage.trim() || t("welcomeFallback");

  return (
    <WidgetEmbedFromAgent
      agentId={agentId}
      agentName={agentName}
      widgetToken={widgetToken}
      title={title}
      welcome={welcome}
      description={t("embedDescription")}
      iframeHint={t("iframeHint")}
      floatingHint={t("floatingHint")}
    />
  );
}
