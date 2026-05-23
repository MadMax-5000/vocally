"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { updateAgentDeployment, updateChatWidgetSettings } from "@/lib/actions/agents";
import { isWebChatEnabled } from "@/lib/deploy/web-chat-config";

import type { AgentDetailWithRelations } from "../agent-detail-types";
import {
  buildChatWidgetDraft,
  draftToSavePayload,
  draftsEqual,
  type ChatWidgetDraft,
} from "./chat-widget/chat-widget-draft";
import { ChatWidgetConfigTabs } from "./chat-widget/ChatWidgetConfigTabs";
import type { ChatWidgetConfigTabId } from "./chat-widget/ChatWidgetConfigTabs";
import { ChatWidgetManageHeader } from "./chat-widget/ChatWidgetManageHeader";
import { ChatWidgetPreviewPanel } from "./chat-widget/ChatWidgetPreviewPanel";

type Props = { agent: AgentDetailWithRelations };

export function DeployChatWidgetManage({ agent }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [togglePending, startToggleTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<ChatWidgetConfigTabId>("content");
  const [previewViewport, setPreviewViewport] = useState<"desktop" | "mobile">("desktop");
  const [webChatEnabled, setWebChatEnabled] = useState(() =>
    isWebChatEnabled(agent.channels),
  );
  const [savedDraft, setSavedDraft] = useState<ChatWidgetDraft>(() =>
    buildChatWidgetDraft(agent),
  );
  const [draft, setDraft] = useState<ChatWidgetDraft>(() => buildChatWidgetDraft(agent));

  useEffect(() => {
    const next = buildChatWidgetDraft(agent);
    setSavedDraft(next);
    setDraft(next);
    setWebChatEnabled(isWebChatEnabled(agent.channels));
  }, [agent]);

  useEffect(() => {
    if (!webChatEnabled && activeTab === "embed") {
      setActiveTab("content");
    }
  }, [webChatEnabled, activeTab]);

  const isDirty = !draftsEqual(draft, savedDraft);

  const handleSave = useCallback(() => {
    startTransition(async () => {
      const result = await updateChatWidgetSettings(agent.id, draftToSavePayload(draft));
      if (!result.success) {
        toast.error(result.error ?? "Failed to save");
        return;
      }
      toast.success("Chat widget settings saved");
      if (result.data) {
        const next = buildChatWidgetDraft(result.data);
        setSavedDraft(next);
        setDraft(next);
      } else {
        setSavedDraft(draft);
      }
      router.refresh();
    });
  }, [agent.id, draft, router]);

  function handleWebChatToggle(enabled: boolean) {
    const previous = webChatEnabled;
    setWebChatEnabled(enabled);

    startToggleTransition(async () => {
      const result = await updateAgentDeployment(agent.id, { webChatEnabled: enabled });
      if (!result.success) {
        setWebChatEnabled(previous);
        toast.error(result.error ?? "Failed to update");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="-mx-4 -my-3 flex h-[calc(100dvh-3rem)] min-h-0 overflow-hidden bg-surface-card">
      <div className="grid min-h-0 flex-1 lg:grid-cols-2">
        <div className="flex min-h-0 flex-col overflow-hidden border-r border-hairline bg-surface-card">
          <ChatWidgetManageHeader
            agentId={agent.id}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            webChatEnabled={webChatEnabled}
            toggling={togglePending}
            onWebChatEnabledChange={handleWebChatToggle}
          />

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <ChatWidgetConfigTabs
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
          <ChatWidgetPreviewPanel
            agentId={agent.id}
            widgetToken={agent.widgetToken}
            agentName={agent.name}
            draft={draft}
            viewport={previewViewport}
            onViewportChange={setPreviewViewport}
          />
        </div>
      </div>
    </div>
  );
}
