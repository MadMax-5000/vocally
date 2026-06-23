"use client";

import { AnimatePresence, motion } from "framer-motion";

import type { AgentMessengerSettings } from "@/lib/actions/messenger-connection";

import { MessengerConnectionTab } from "./MessengerConnectionTab";

export type MessengerConfigTabId = "connection";

type Props = {
  activeTab: MessengerConfigTabId;
  agentId: string;
  settings: AgentMessengerSettings;
  onSettingsRefresh: () => Promise<void>;
};

export function MessengerConfigTabs({ activeTab, agentId, settings, onSettingsRefresh }: Props) {
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
          <MessengerConnectionTab
            agentId={agentId}
            settings={settings}
            onSettingsRefresh={onSettingsRefresh}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

