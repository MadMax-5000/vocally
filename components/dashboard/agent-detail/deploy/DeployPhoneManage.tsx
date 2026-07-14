"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { updateAgentDeployment } from "@/lib/actions/agents";
import {
  getPhoneConnectionSettings,
  type PhoneConnectionSettings,
} from "@/lib/actions/phone-connection";

import type { AgentDetailWithRelations } from "../agent-detail-types";
import {
  PhoneConfigTabs,
  type PhoneConfigTabId,
} from "./phone/PhoneConfigTabs";
import { PhoneCallPreviewPanel } from "./phone/PhoneCallPreviewPanel";
import { PhoneManageHeader } from "./phone/PhoneManageHeader";

type Props = {
  agent: AgentDetailWithRelations;
  initialSettings: PhoneConnectionSettings;
};

function isPhoneDeploymentEnabled(
  channels: AgentDetailWithRelations["channels"],
): boolean {
  return channels.some((c) => c.channel === "VOICE_CALLS" && c.enabled);
}

export function DeployPhoneManage({ agent, initialSettings }: Props) {
  const router = useRouter();
  const tCommon = useTranslations("dashboard.deploy.common");
  const [togglePending, startToggleTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<PhoneConfigTabId>("numbers");
  const [settings, setSettings] = useState(initialSettings);
  const [phoneEnabled, setPhoneEnabled] = useState(() =>
    isPhoneDeploymentEnabled(agent.channels),
  );

  useEffect(() => {
    setSettings(initialSettings);
  }, [initialSettings]);

  useEffect(() => {
    setPhoneEnabled(isPhoneDeploymentEnabled(agent.channels));
  }, [agent.channels]);

  useEffect(() => {
    if (!phoneEnabled && activeTab !== "numbers") {
      setActiveTab("numbers");
    }
  }, [phoneEnabled, activeTab]);

  async function refreshSettings() {
    const refreshed = await getPhoneConnectionSettings(agent.id);
    if (refreshed.success) {
      setSettings(refreshed.data);
    }
  }

  function handlePhoneToggle(enabled: boolean) {
    const previous = phoneEnabled;
    setPhoneEnabled(enabled);

    startToggleTransition(async () => {
      const result = await updateAgentDeployment(agent.id, {
        integrationId: "phone",
        integrationEnabled: enabled,
      });
      if (!result.success) {
        setPhoneEnabled(previous);
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
          <PhoneManageHeader
            agentId={agent.id}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            phoneEnabled={phoneEnabled}
            toggling={togglePending}
            onPhoneEnabledChange={handlePhoneToggle}
          />

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <PhoneConfigTabs
              activeTab={activeTab}
              agentId={agent.id}
              agentName={agent.name}
              phoneEnabled={phoneEnabled}
              settings={settings}
              onSettingsRefresh={refreshSettings}
            />
          </div>
        </div>

        <div className="flex min-h-0 flex-col overflow-hidden bg-canvas-soft/40">
          <PhoneCallPreviewPanel businessName={previewBusinessName} />
        </div>
      </div>
    </div>
  );
}
