"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  getAgentGmailSettings,
  updateEmailChannelSettings,
  type AgentGmailSettings,
} from "@/lib/actions/gmail-connection";
import { updateAgentDeployment } from "@/lib/actions/agents";
import { isEmailChannelEnabled } from "@/lib/deploy/email-channel-config";

import type { AgentDetailWithRelations } from "../agent-detail-types";
import {
  buildEmailDraft,
  draftToSavePayload,
  draftsEqual,
  type EmailDraft,
} from "./email/email-draft";
import { EmailConfigTabs, type EmailConfigTabId } from "./email/EmailConfigTabs";
import { EmailManageHeader } from "./email/EmailManageHeader";
import { EmailPreviewPanel } from "./email/EmailPreviewPanel";

type Props = {
  agent: AgentDetailWithRelations;
  initialGmailSettings: AgentGmailSettings;
};

export function DeployEmailManage({ agent, initialGmailSettings }: Props) {
  const tEmail = useTranslations("dashboard.deploy.email");
  const tCommon = useTranslations("dashboard.deploy.common");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [togglePending, startToggleTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<EmailConfigTabId>("connection");
  const [gmailSettings, setGmailSettings] = useState(initialGmailSettings);
  const [emailEnabled, setEmailEnabled] = useState(() =>
    isEmailChannelEnabled(agent.channels),
  );
  const [savedDraft, setSavedDraft] = useState<EmailDraft>(() =>
    buildEmailDraft(agent, initialGmailSettings),
  );
  const [draft, setDraft] = useState<EmailDraft>(() =>
    buildEmailDraft(agent, initialGmailSettings),
  );

  useEffect(() => {
    const next = buildEmailDraft(agent, gmailSettings);
    setSavedDraft(next);
    setDraft(next);
    setEmailEnabled(isEmailChannelEnabled(agent.channels));
  }, [agent, gmailSettings]);

  useEffect(() => {
    if (searchParams.get("connected") === "1") {
      toast.success(tEmail("connected"));
      router.replace(`/dashboard/agents/${agent.id}/deploy/email`, { scroll: false });
    }
    const err = searchParams.get("error");
    if (err) {
      toast.error(decodeURIComponent(err.replace(/\+/g, " ")));
    }
  }, [searchParams, agent.id, router, tEmail]);

  const isDirty = !draftsEqual(draft, savedDraft);

  const handleSave = useCallback(() => {
    startTransition(async () => {
      const result = await updateEmailChannelSettings(agent.id, draftToSavePayload(draft));
      if (!result.success) {
        toast.error(result.error ?? tCommon("failedToSave"));
        return;
      }
      toast.success(tEmail("settingsSaved"));
      setSavedDraft(draft);
      const refreshed = await getAgentGmailSettings(agent.id);
      if (refreshed.success) {
        setGmailSettings(refreshed.data);
      }
      router.refresh();
    });
  }, [agent.id, draft, router, tCommon, tEmail]);

  function handleEmailToggle(enabled: boolean) {
    const previous = emailEnabled;
    setEmailEnabled(enabled);

    startToggleTransition(async () => {
      const result = await updateAgentDeployment(agent.id, {
        integrationId: "email",
        integrationEnabled: enabled,
      });
      if (!result.success) {
        setEmailEnabled(previous);
        toast.error(result.error ?? tCommon("failedToUpdate"));
        return;
      }
      router.refresh();
    });
  }

  async function handleDisconnected() {
    const refreshed = await getAgentGmailSettings(agent.id);
    if (refreshed.success) {
      setGmailSettings(refreshed.data);
    }
    router.refresh();
  }

  return (
    <div className="-mx-4 -my-3 flex h-[calc(100dvh-3rem)] min-h-0 overflow-hidden bg-surface-card">
      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)]">
        <div className="flex min-h-0 flex-col overflow-hidden border-r border-hairline bg-surface-card">
          <EmailManageHeader
            agentId={agent.id}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            emailEnabled={emailEnabled}
            toggling={togglePending}
            onEmailEnabledChange={handleEmailToggle}
          />

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <EmailConfigTabs
              activeTab={activeTab}
              draft={draft}
              onDraftChange={setDraft}
              agentId={agent.id}
              gmailSettings={gmailSettings}
              onDisconnected={handleDisconnected}
            />
          </div>

          <div className="flex shrink-0 items-center justify-between gap-3 border-t border-hairline px-4 py-3">
            <span className="text-caption text-muted">
              {isDirty ? tCommon("unsavedChanges") : tCommon("allChangesSaved")}
            </span>
            <Button
              type="button"
              className="btn-primary h-9 rounded-md px-4"
              disabled={!isDirty || isPending}
              onClick={handleSave}
            >
              {isPending ? tCommon("saving") : tCommon("saveChanges")}
            </Button>
          </div>
        </div>

        <div className="flex min-h-0 flex-col overflow-hidden bg-canvas-soft/40">
          <EmailPreviewPanel
            agentName={agent.name}
            draft={draft}
            gmailSettings={gmailSettings}
          />
        </div>
      </div>
    </div>
  );
}
