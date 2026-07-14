"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { updateAgentDeployment } from "@/lib/actions/agents";
import {
  getAgentSmsSettings,
  type AgentSmsSettings,
} from "@/lib/actions/sms-connection";

import type { AgentDetailWithRelations } from "../agent-detail-types";
import {
  SmsConfigTabs,
  type SmsConfigTabId,
} from "./sms/SmsConfigTabs";
import { SmsPreviewPanel } from "./sms/SmsPreviewPanel";
import { SmsManageHeader } from "./sms/SmsManageHeader";

type Props = {
  agent: AgentDetailWithRelations;
  initialSettings: AgentSmsSettings;
};

function isSmsDeploymentEnabled(
  channels: AgentDetailWithRelations["channels"],
): boolean {
  return channels.some((c) => c.channel === "SMS" && c.enabled);
}

export function DeploySmsManage({ agent, initialSettings }: Props) {
  const router = useRouter();
  const tCommon = useTranslations("dashboard.deploy.common");
  const [togglePending, startToggleTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<SmsConfigTabId>("setup");
  const [settings, setSettings] = useState(initialSettings);
  const [smsEnabled, setSmsEnabled] = useState(() =>
    isSmsDeploymentEnabled(agent.channels),
  );

  useEffect(() => {
    setSettings(initialSettings);
  }, [initialSettings]);

  useEffect(() => {
    setSmsEnabled(isSmsDeploymentEnabled(agent.channels));
  }, [agent.channels]);

  useEffect(() => {
    if (!smsEnabled && activeTab !== "setup") {
      setActiveTab("setup");
    }
  }, [smsEnabled, activeTab]);

  async function refreshSettings() {
    const refreshed = await getAgentSmsSettings(agent.id);
    if (refreshed.success) {
      setSettings(refreshed.data);
    }
  }

  function handleSmsToggle(enabled: boolean) {
    const previous = smsEnabled;
    setSmsEnabled(enabled);

    startToggleTransition(async () => {
      const result = await updateAgentDeployment(agent.id, {
        integrationId: "sms",
        integrationEnabled: enabled,
      });
      if (!result.success) {
        setSmsEnabled(previous);
        toast.error(result.error ?? tCommon("failedToUpdate"));
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
          <SmsManageHeader
            agentId={agent.id}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            smsEnabled={smsEnabled}
            toggling={togglePending}
            onSmsEnabledChange={handleSmsToggle}
          />

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <SmsConfigTabs
              activeTab={activeTab}
              agentId={agent.id}
              agentName={agent.name}
              smsEnabled={smsEnabled}
              settings={settings}
              onSettingsRefresh={refreshSettings}
            />
          </div>
        </div>

        <div className="flex min-h-0 flex-col overflow-hidden bg-canvas-soft/40">
          <SmsPreviewPanel businessName={previewBusinessName} />
        </div>
      </div>
    </div>
  );
}
