"use client";

import { AnimatePresence, motion } from "framer-motion";

import { ChatWidgetContentTab } from "./ChatWidgetContentTab";
import { ChatWidgetEmbedSection } from "./ChatWidgetEmbedSection";
import { ChatWidgetStyleTab } from "./ChatWidgetStyleTab";
import type { ChatWidgetDraft } from "./chat-widget-draft";

export type ChatWidgetConfigTabId = "content" | "style" | "embed";

type ChatWidgetConfigTabsProps = {
  activeTab: ChatWidgetConfigTabId;
  draft: ChatWidgetDraft;
  onDraftChange: (draft: ChatWidgetDraft) => void;
  agentId: string;
  agentName: string;
  widgetToken: string | null;
};

export function ChatWidgetConfigTabs({
  activeTab,
  draft,
  onDraftChange,
  agentId,
  agentName,
  widgetToken,
}: ChatWidgetConfigTabsProps) {
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
          {activeTab === "content" ? (
            <ChatWidgetContentTab draft={draft} onChange={onDraftChange} />
          ) : activeTab === "style" ? (
            <ChatWidgetStyleTab draft={draft} onChange={onDraftChange} />
          ) : (
            <ChatWidgetEmbedSection
              agentId={agentId}
              agentName={agentName}
              widgetToken={widgetToken}
              draft={draft}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
