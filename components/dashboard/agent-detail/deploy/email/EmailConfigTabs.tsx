"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import {
  getGmailLabelOptions,
  type AgentGmailSettings,
  type GmailLabelOption,
} from "@/lib/actions/gmail-connection";

import { EmailConnectionTab } from "./EmailConnectionTab";
import { EmailSettingsTab } from "./EmailSettingsTab";
import type { EmailDraft } from "./email-draft";

function resolveLabelNames(labelIds: string[], options: GmailLabelOption[]): string[] {
  const byId = new Map(options.map((o) => [o.id, o.name]));
  return labelIds.map((id) => byId.get(id) ?? id);
}

export type EmailConfigTabId = "connection" | "settings";

type EmailConfigTabsProps = {
  activeTab: EmailConfigTabId;
  draft: EmailDraft;
  onDraftChange: (draft: EmailDraft) => void;
  agentId: string;
  gmailSettings: AgentGmailSettings;
  onDisconnected: () => void;
};

export function EmailConfigTabs({
  activeTab,
  draft,
  onDraftChange,
  agentId,
  gmailSettings,
  onDisconnected,
}: EmailConfigTabsProps) {
  const [labelOptions, setLabelOptions] = useState<GmailLabelOption[]>([]);
  const [labelsLoading, setLabelsLoading] = useState(false);
  const [labelsError, setLabelsError] = useState<string | null>(null);

  const hasConnection = gmailSettings.connection !== null;

  useEffect(() => {
    if (!hasConnection) {
      setLabelOptions([]);
      setLabelsError(null);
      return;
    }

    let cancelled = false;
    setLabelsLoading(true);
    setLabelsError(null);

    void getGmailLabelOptions(agentId).then((result) => {
      if (cancelled) return;
      setLabelsLoading(false);
      if (!result.success) {
        setLabelsError(result.error);
        return;
      }
      setLabelOptions(result.data);
    });

    return () => {
      cancelled = true;
    };
  }, [agentId, hasConnection]);

  const labelNames =
    hasConnection && gmailSettings.connection
      ? resolveLabelNames(gmailSettings.connection.labelIds, labelOptions)
      : [];

  return (
    <div className="h-full min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4 pt-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.14 }}
        >
          {activeTab === "connection" ? (
            <EmailConnectionTab
              agentId={agentId}
              gmailSettings={gmailSettings}
              labelNames={labelNames}
              labelsLoading={labelsLoading}
              onDisconnected={onDisconnected}
            />
          ) : (
            <EmailSettingsTab
              draft={draft}
              onChange={onDraftChange}
              hasConnection={hasConnection}
              labelOptions={labelOptions}
              labelsLoading={labelsLoading}
              labelsError={labelsError}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
