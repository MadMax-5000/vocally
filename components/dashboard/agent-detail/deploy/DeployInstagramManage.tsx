"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { AgentStatus, AgentVisibility } from "@prisma/client";

import { updateAgentDeployment } from "@/lib/actions/agents";

import type { AgentDetailWithRelations } from "../agent-detail-types";
import {
  InstagramConfigTabs,
  type InstagramConfigTabId,
} from "./instagram/InstagramConfigTabs";
import { InstagramManageHeader } from "./instagram/InstagramManageHeader";
import { InstagramDmPreviewPanel } from "./instagram/InstagramDmPreviewPanel";

type Props = { agent: AgentDetailWithRelations };

function isInstagramDeploymentEnabled(
  channels: AgentDetailWithRelations["channels"],
): boolean {
  return channels.some((c) => c.channel === "INSTAGRAM" && c.enabled);
}

export function DeployInstagramManage({ agent }: Props) {
  const router = useRouter();
  const tCommon = useTranslations("dashboard.deploy.common");
  const [togglePending, startToggleTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<InstagramConfigTabId>("setup");
  const [previewViewport, setPreviewViewport] = useState<"desktop" | "mobile">(
    "mobile",
  );
  const [instagramEnabled, setInstagramEnabled] = useState(() =>
    isInstagramDeploymentEnabled(agent.channels),
  );

  useEffect(() => {
    setInstagramEnabled(isInstagramDeploymentEnabled(agent.channels));
  }, [agent.channels]);

  useEffect(() => {
    if (!instagramEnabled && activeTab !== "setup") {
      setActiveTab("setup");
    }
  }, [instagramEnabled, activeTab]);

  function handleInstagramToggle(enabled: boolean) {
    const previous = instagramEnabled;
    setInstagramEnabled(enabled);

    startToggleTransition(async () => {
      const result = await updateAgentDeployment(agent.id, {
        integrationId: "instagram",
        integrationEnabled: enabled,
      });
      if (!result.success) {
        setInstagramEnabled(previous);
        toast.error(result.error ?? tCommon("failedToUpdate"));
        return;
      }
      router.refresh();
    });
  }

  const isPublic = agent.visibility === AgentVisibility.PUBLIC;
  const isActive = agent.status === AgentStatus.ACTIVE;

  const previewAccountName = useMemo(() => agent.name, [agent.name]);

  return (
    <div className="-mx-4 -my-3 flex h-[calc(100dvh-3rem)] min-h-0 overflow-hidden bg-surface-card">
      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,520px)_minmax(0,1fr)]">
        <div className="flex min-h-0 flex-col overflow-hidden border-r border-hairline bg-surface-card">
          <InstagramManageHeader
            agentId={agent.id}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            instagramEnabled={instagramEnabled}
            toggling={togglePending}
            onInstagramEnabledChange={handleInstagramToggle}
          />

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <InstagramConfigTabs
              activeTab={activeTab}
              agentId={agent.id}
              instagramEnabled={instagramEnabled}
              isPublic={isPublic}
              isActive={isActive}
            />
          </div>
        </div>

        <div className="flex min-h-0 flex-col overflow-hidden bg-canvas-soft/40">
          <InstagramDmPreviewPanel
            viewport={previewViewport}
            onViewportChange={setPreviewViewport}
            accountName={previewAccountName}
          />
        </div>
      </div>
    </div>
  );
}

