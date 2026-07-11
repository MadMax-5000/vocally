"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";

import { updateAgentDeployment } from "@/lib/actions/agents";
import {
  getAgentWhatsAppSettings,
  type AgentWhatsAppSettings,
} from "@/lib/actions/whatsapp-connection";

import type { AgentDetailWithRelations } from "../agent-detail-types";
import {
  WhatsAppConfigTabs,
  type WhatsAppConfigTabId,
} from "./whatsapp/WhatsAppConfigTabs";
import { WhatsAppDmPreviewPanel } from "./whatsapp/WhatsAppDmPreviewPanel";
import { WhatsAppManageHeader } from "./whatsapp/WhatsAppManageHeader";

type Props = {
  agent: AgentDetailWithRelations;
  initialSettings: AgentWhatsAppSettings;
};

function isWhatsAppDeploymentEnabled(
  channels: AgentDetailWithRelations["channels"],
): boolean {
  return channels.some((c) => c.channel === "WHATSAPP" && c.enabled);
}

export function DeployWhatsAppManage({ agent, initialSettings }: Props) {
  const router = useRouter();
  const [togglePending, startToggleTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<WhatsAppConfigTabId>("connect");
  const [previewViewport, setPreviewViewport] = useState<"desktop" | "mobile">("mobile");
  const [settings, setSettings] = useState(initialSettings);
  const [whatsappEnabled, setWhatsappEnabled] = useState(() =>
    isWhatsAppDeploymentEnabled(agent.channels),
  );

  useEffect(() => {
    setSettings(initialSettings);
  }, [initialSettings]);

  useEffect(() => {
    setWhatsappEnabled(isWhatsAppDeploymentEnabled(agent.channels));
  }, [agent.channels]);

  useEffect(() => {
    if (!whatsappEnabled && activeTab !== "connect") {
      setActiveTab("connect");
    }
  }, [whatsappEnabled, activeTab]);

  async function refreshSettings() {
    const refreshed = await getAgentWhatsAppSettings(agent.id);
    if (refreshed.success) {
      setSettings(refreshed.data);
    }
  }

  function handleWhatsappToggle(enabled: boolean) {
    const previous = whatsappEnabled;
    setWhatsappEnabled(enabled);

    startToggleTransition(async () => {
      const result = await updateAgentDeployment(agent.id, {
        integrationId: "whatsapp",
        integrationEnabled: enabled,
      });
      if (!result.success) {
        setWhatsappEnabled(previous);
        toast.error(result.error ?? "Failed to update");
        return;
      }
      router.refresh();
    });
  }

  const previewBusinessName = useMemo(() => agent.name, [agent.name]);

  return (
    <div className="-mx-4 -my-3 flex h-[calc(100dvh-3rem)] min-h-0 overflow-hidden bg-surface-card">
      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,520px)_minmax(0,1fr)]">
        <div className="flex min-h-0 flex-col overflow-hidden border-r border-hairline bg-surface-card">
          <WhatsAppManageHeader
            agentId={agent.id}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            whatsappEnabled={whatsappEnabled}
            toggling={togglePending}
            onWhatsappEnabledChange={handleWhatsappToggle}
          />

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <WhatsAppConfigTabs
              activeTab={activeTab}
              agentId={agent.id}
              agentName={agent.name}
              whatsappEnabled={whatsappEnabled}
              settings={settings}
              onSettingsRefresh={refreshSettings}
            />
          </div>
        </div>

        <div className="flex min-h-0 flex-col overflow-hidden bg-canvas-soft/40">
          <WhatsAppDmPreviewPanel
            viewport={previewViewport}
            onViewportChange={setPreviewViewport}
            businessName={previewBusinessName}
          />
        </div>
      </div>
    </div>
  );
}
