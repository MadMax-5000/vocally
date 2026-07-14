"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { AgentStatus, AgentVisibility } from "@prisma/client";

import { updateAgentDeployment } from "@/lib/actions/agents";
import { useEmbedOrigin } from "@/lib/deploy/embed-urls";
import {
  buildWordPressPluginDefaults,
  isWordPressDeploymentEnabled,
} from "@/lib/deploy/wordpress-config";
import {
  isWebChatEnabled,
  resolveWidgetDisplayName,
} from "@/lib/deploy/web-chat-config";

import type { AgentDetailWithRelations } from "../agent-detail-types";
import { resolveCustomButtonAction } from "@/lib/deploy/custom-button-action";
import { ChatWidgetPreviewPanel } from "./chat-widget/ChatWidgetPreviewPanel";
import { buildChatWidgetDraft } from "./chat-widget/chat-widget-draft";
import { WordPressConfigTabs, type WordPressConfigTabId } from "./wordpress/WordPressConfigTabs";
import { WordPressManageHeader } from "./wordpress/WordPressManageHeader";

type Props = { agent: AgentDetailWithRelations };

export function DeployWordPressManage({ agent }: Props) {
  const router = useRouter();
  const origin = useEmbedOrigin();
  const tWidget = useTranslations("dashboard.deploy.chatWidget");
  const tCommon = useTranslations("dashboard.deploy.common");
  const [togglePending, startToggleTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<WordPressConfigTabId>("setup");
  const [previewViewport, setPreviewViewport] = useState<"desktop" | "mobile">("desktop");
  const [wordpressEnabled, setWordPressEnabled] = useState(() =>
    isWordPressDeploymentEnabled(agent.channels),
  );

  const draft = useMemo(() => buildChatWidgetDraft(agent), [agent]);
  const webChatEnabled = isWebChatEnabled(agent.channels);
  const isPublic = agent.visibility === AgentVisibility.PUBLIC;
  const isActive = agent.status === AgentStatus.ACTIVE;

  const title = resolveWidgetDisplayName(agent.name, {
    displayName: draft.widget.displayName.trim() || undefined,
  });
  const welcome = draft.welcomeMessage.trim() || tWidget("welcomeFallback");

  const pluginDefaults = useMemo(
    () => buildWordPressPluginDefaults(origin, agent.id, agent.widgetToken, title, welcome),
    [origin, agent.id, agent.widgetToken, title, welcome],
  );

  useEffect(() => {
    setWordPressEnabled(isWordPressDeploymentEnabled(agent.channels));
  }, [agent.channels]);

  useEffect(() => {
    if (!wordpressEnabled && (activeTab === "embed" || activeTab === "install")) {
      setActiveTab("setup");
    }
  }, [wordpressEnabled, activeTab]);

  function handleWordPressToggle(enabled: boolean) {
    const previous = wordpressEnabled;
    setWordPressEnabled(enabled);

    startToggleTransition(async () => {
      const result = await updateAgentDeployment(agent.id, {
        integrationId: "wordpress",
        integrationEnabled: enabled,
      });
      if (!result.success) {
        setWordPressEnabled(previous);
        toast.error(result.error ?? tCommon("failedToUpdate"));
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="-mx-4 -my-3 flex h-[calc(100dvh-3rem)] min-h-0 overflow-hidden bg-surface-card">
      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,520px)_minmax(0,1fr)]">
        <div className="flex min-h-0 flex-col overflow-hidden border-r border-hairline bg-surface-card">
          <WordPressManageHeader
            agentId={agent.id}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            wordpressEnabled={wordpressEnabled}
            toggling={togglePending}
            onWordPressEnabledChange={handleWordPressToggle}
          />

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <WordPressConfigTabs
              activeTab={activeTab}
              agentId={agent.id}
              wordpressEnabled={wordpressEnabled}
              webChatEnabled={webChatEnabled}
              isPublic={isPublic}
              isActive={isActive}
              pluginDefaults={pluginDefaults}
            />
          </div>
        </div>

        <div className="flex min-h-0 flex-col overflow-hidden bg-canvas-soft/40">
          <ChatWidgetPreviewPanel
            agentId={agent.id}
            widgetToken={agent.widgetToken}
            agentName={agent.name}
            draft={draft}
            customButtonsAction={resolveCustomButtonAction(agent.channels)}
            viewport={previewViewport}
            onViewportChange={setPreviewViewport}
          />
        </div>
      </div>
    </div>
  );
}
