"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import { AgentStatus, AgentVisibility } from "@prisma/client";

import { regenerateAgentApiToken, updateAgentDeployment } from "@/lib/actions/agents";
import { isApiDeploymentEnabled } from "@/lib/deploy/api-config";

import type { AgentDetailWithRelations } from "../agent-detail-types";
import { ApiConfigTabs, type ApiConfigTabId } from "./api/ApiConfigTabs";
import { ApiManageHeader } from "./api/ApiManageHeader";
import { ApiTryPanel } from "./api/ApiTryPanel";

type Props = {
  agent: AgentDetailWithRelations;
  apiToken: string;
};

export function DeployApiManage({ agent, apiToken: initialApiToken }: Props) {
  const t = useTranslations("dashboard.deploy.api");
  const tCommon = useTranslations("dashboard.deploy.common");
  const router = useRouter();
  const [togglePending, startToggleTransition] = useTransition();
  const [regeneratePending, startRegenerateTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<ApiConfigTabId>("setup");
  const [apiEnabled, setApiEnabled] = useState(() =>
    isApiDeploymentEnabled(agent.channels),
  );
  const [apiToken, setApiToken] = useState(initialApiToken);

  useEffect(() => {
    setApiEnabled(isApiDeploymentEnabled(agent.channels));
    setApiToken(initialApiToken);
  }, [agent.channels, initialApiToken]);

  useEffect(() => {
    if (!apiEnabled && activeTab === "examples") {
      setActiveTab("setup");
    }
  }, [apiEnabled, activeTab]);

  function handleApiToggle(enabled: boolean) {
    const previous = apiEnabled;
    setApiEnabled(enabled);

    startToggleTransition(async () => {
      const result = await updateAgentDeployment(agent.id, {
        integrationId: "api",
        integrationEnabled: enabled,
      });
      if (!result.success) {
        setApiEnabled(previous);
        toast.error(result.error ?? tCommon("failedToUpdate"));
        return;
      }
      router.refresh();
    });
  }

  function handleRegenerateToken() {
    startRegenerateTransition(async () => {
      const result = await regenerateAgentApiToken(agent.id);
      if (!result.success) {
        toast.error(result.error ?? t("failedToRegenerate"));
        return;
      }
      setApiToken(result.data.apiToken);
      toast.success(t("keyRegenerated"));
      router.refresh();
    });
  }

  const isPublic = agent.visibility === AgentVisibility.PUBLIC;
  const isActive = agent.status === AgentStatus.ACTIVE;

  return (
    <div className="-mx-4 -my-3 flex h-[calc(100dvh-3rem)] min-h-0 overflow-hidden bg-surface-card">
      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,520px)_minmax(0,1fr)]">
        <div className="flex min-h-0 flex-col overflow-hidden border-r border-hairline bg-surface-card">
          <ApiManageHeader
            agentId={agent.id}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            apiEnabled={apiEnabled}
            toggling={togglePending}
            onApiEnabledChange={handleApiToggle}
          />

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <ApiConfigTabs
              activeTab={activeTab}
              agentId={agent.id}
              apiToken={apiToken}
              apiEnabled={apiEnabled}
              isPublic={isPublic}
              isActive={isActive}
              onRegenerateToken={handleRegenerateToken}
              regenerating={regeneratePending}
            />
          </div>
        </div>

        <div className="flex min-h-0 flex-col overflow-hidden bg-canvas-soft/40">
          <ApiTryPanel agentId={agent.id} apiToken={apiToken} />
        </div>
      </div>
    </div>
  );
}
