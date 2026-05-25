"use client";

import { AnimatePresence, motion } from "framer-motion";

import { HelpPageEmbedSection } from "./HelpPageEmbedSection";
import { HelpPageSettingsTab } from "./HelpPageSettingsTab";
import type { HelpPageDraft } from "./help-page-draft";

export type HelpPageConfigTabId = "settings" | "embed";

type HelpPageConfigTabsProps = {
  activeTab: HelpPageConfigTabId;
  draft: HelpPageDraft;
  onDraftChange: (draft: HelpPageDraft) => void;
  agentId: string;
  agentName: string;
  widgetToken: string | null;
};

export function HelpPageConfigTabs({
  activeTab,
  draft,
  onDraftChange,
  agentId,
  agentName,
  widgetToken,
}: HelpPageConfigTabsProps) {
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
          {activeTab === "settings" ? (
            <HelpPageSettingsTab draft={draft} onChange={onDraftChange} agentName={agentName} />
          ) : (
            <HelpPageEmbedSection
              agentId={agentId}
              widgetToken={widgetToken}
              pageTitle={draft.helpPage.pageTitle}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
