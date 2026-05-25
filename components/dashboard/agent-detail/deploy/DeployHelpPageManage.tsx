"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { updateAgentDeployment, updateHelpPageSettings } from "@/lib/actions/agents";
import { isHelpPageEnabled } from "@/lib/deploy/web-chat-config";

import type { AgentDetailWithRelations } from "../agent-detail-types";
import {
  buildHelpPageDraft,
  draftToSavePayload,
  draftsEqual,
  type HelpPageDraft,
} from "./help-page/help-page-draft";
import { HelpPageConfigTabs } from "./help-page/HelpPageConfigTabs";
import type { HelpPageConfigTabId } from "./help-page/HelpPageConfigTabs";
import { HelpPageManageHeader } from "./help-page/HelpPageManageHeader";
import { HelpPagePreviewPanel } from "./help-page/HelpPagePreviewPanel";

type Props = { agent: AgentDetailWithRelations };

export function DeployHelpPageManage({ agent }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [togglePending, startToggleTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<HelpPageConfigTabId>("settings");
  const [helpPageEnabled, setHelpPageEnabled] = useState(() =>
    isHelpPageEnabled(agent.channels),
  );
  const [savedDraft, setSavedDraft] = useState<HelpPageDraft>(() =>
    buildHelpPageDraft(agent),
  );
  const [draft, setDraft] = useState<HelpPageDraft>(() => buildHelpPageDraft(agent));

  useEffect(() => {
    const next = buildHelpPageDraft(agent);
    setSavedDraft(next);
    setDraft(next);
    setHelpPageEnabled(isHelpPageEnabled(agent.channels));
  }, [agent]);

  useEffect(() => {
    if (!helpPageEnabled && activeTab === "embed") {
      setActiveTab("settings");
    }
  }, [helpPageEnabled, activeTab]);

  const isDirty = !draftsEqual(draft, savedDraft);

  const handleSave = useCallback(() => {
    startTransition(async () => {
      const result = await updateHelpPageSettings(agent.id, draftToSavePayload(draft));
      if (!result.success) {
        toast.error(result.error ?? "Failed to save");
        return;
      }
      toast.success("Help page settings saved");
      if (result.data) {
        const next = buildHelpPageDraft(result.data);
        setSavedDraft(next);
        setDraft(next);
      } else {
        setSavedDraft(draft);
      }
      router.refresh();
    });
  }, [agent.id, draft, router]);

  function handleHelpPageToggle(enabled: boolean) {
    const previous = helpPageEnabled;
    setHelpPageEnabled(enabled);

    startToggleTransition(async () => {
      const result = await updateAgentDeployment(agent.id, { helpPageEnabled: enabled });
      if (!result.success) {
        setHelpPageEnabled(previous);
        toast.error(result.error ?? "Failed to update");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="-mx-4 -my-3 flex h-[calc(100dvh-3rem)] min-h-0 overflow-hidden bg-surface-card">
      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)]">
        <div className="flex min-h-0 flex-col overflow-hidden border-r border-hairline bg-surface-card">
          <HelpPageManageHeader
            agentId={agent.id}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            helpPageEnabled={helpPageEnabled}
            toggling={togglePending}
            onHelpPageEnabledChange={handleHelpPageToggle}
          />

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <HelpPageConfigTabs
              activeTab={activeTab}
              draft={draft}
              onDraftChange={setDraft}
              agentId={agent.id}
              agentName={agent.name}
              widgetToken={agent.widgetToken}
            />
          </div>

          <div className="flex shrink-0 items-center justify-between gap-3 border-t border-hairline px-4 py-3">
            <span className="text-caption text-muted">
              {isDirty ? "Unsaved changes" : "All changes saved"}
            </span>
            <Button
              type="button"
              className="btn-primary h-9 rounded-md px-4"
              disabled={!isDirty || isPending}
              onClick={handleSave}
            >
              {isPending ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </div>

        <div className="flex min-h-0 flex-col overflow-hidden bg-canvas-soft/40">
          <HelpPagePreviewPanel draft={draft} agentName={agent.name} />
        </div>
      </div>
    </div>
  );
}
