"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { updateAgentDeployment } from "@/lib/actions/agents";
import {
  getAgentMessengerSettings,
  type AgentMessengerSettings,
} from "@/lib/actions/messenger-connection";

import type { AgentDetailWithRelations } from "../agent-detail-types";
import { MessengerConfigTabs, type MessengerConfigTabId } from "./messenger/MessengerConfigTabs";
import { MessengerManageHeader } from "./messenger/MessengerManageHeader";
import { MessengerPreviewPanel } from "./messenger/MessengerPreviewPanel";

type Props = {
  agent: AgentDetailWithRelations;
  initialSettings: AgentMessengerSettings;
};

export function DeployMessengerManage({ agent, initialSettings }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [togglePending, startToggleTransition] = useTransition();

  const [activeTab, setActiveTab] = useState<MessengerConfigTabId>("connection");
  const [settings, setSettings] = useState(initialSettings);
  const [enabled, setEnabled] = useState(() => {
    const row = agent.channels.find((c) => c.channel === "MESSENGER");
    return row?.enabled ?? false;
  });

  useEffect(() => {
    const row = agent.channels.find((c) => c.channel === "MESSENGER");
    setEnabled(row?.enabled ?? false);
  }, [agent.channels]);

  useEffect(() => {
    if (searchParams.get("connected") === "1") {
      toast.success("Messenger connected");
      router.replace(`/dashboard/agents/${agent.id}/deploy/messenger`, { scroll: false });
      void refreshSettings();
    }
    const err = searchParams.get("error");
    if (err) {
      toast.error(decodeURIComponent(err.replace(/\+/g, " ")));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- read-once after redirects
  }, []);

  async function refreshSettings() {
    const refreshed = await getAgentMessengerSettings(agent.id);
    if (refreshed.success) {
      setSettings(refreshed.data);
    }
  }

  function handleToggle(next: boolean) {
    const previous = enabled;
    setEnabled(next);

    startToggleTransition(async () => {
      const result = await updateAgentDeployment(agent.id, {
        integrationId: "messenger",
        integrationEnabled: next,
      });
      if (!result.success) {
        setEnabled(previous);
        toast.error(result.error ?? "Failed to update");
        return;
      }
      router.refresh();
    });
  }

  function handleSave() {
    startTransition(async () => {
      await refreshSettings();
      toast.success("Messenger settings refreshed");
      router.refresh();
    });
  }

  return (
    <div className="-mx-4 -my-3 flex h-[calc(100dvh-3rem)] min-h-0 overflow-hidden bg-surface-card">
      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <div className="flex min-h-0 flex-col overflow-hidden border-r border-hairline bg-surface-card">
          <MessengerManageHeader
            agentId={agent.id}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            enabled={enabled}
            toggling={togglePending}
            onEnabledChange={handleToggle}
          />

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <MessengerConfigTabs
              activeTab={activeTab}
              agentId={agent.id}
              settings={settings}
              onSettingsRefresh={refreshSettings}
            />
          </div>

          <div className="flex shrink-0 items-center justify-between gap-3 border-t border-hairline px-4 py-3">
            <span className="text-caption text-muted">Connection updates instantly</span>
            <Button
              type="button"
              className="btn-primary h-9 rounded-md px-4"
              disabled={isPending}
              onClick={handleSave}
            >
              {isPending ? "Refreshing…" : "Refresh"}
            </Button>
          </div>
        </div>

        <div className="flex min-h-0 flex-col overflow-hidden bg-canvas-soft/40">
          <MessengerPreviewPanel agentName={agent.name} settings={settings} />
        </div>
      </div>
    </div>
  );
}

