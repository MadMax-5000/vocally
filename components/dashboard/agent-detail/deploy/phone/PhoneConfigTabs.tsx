"use client";

import { AnimatePresence, motion } from "framer-motion";

import type { AgentPhoneSettings } from "@/lib/actions/vapi-phone";

import { PhoneNumbersTab } from "./PhoneNumbersTab";
import { PhoneSettingsTab } from "./PhoneSettingsTab";

export type PhoneConfigTabId = "numbers" | "settings";

type PhoneConfigTabsProps = {
  activeTab: PhoneConfigTabId;
  agentId: string;
  agentName: string;
  phoneEnabled: boolean;
  settings: AgentPhoneSettings;
  onSettingsRefresh: () => Promise<void>;
};

export function PhoneConfigTabs({
  activeTab,
  agentId,
  agentName,
  phoneEnabled,
  settings,
  onSettingsRefresh,
}: PhoneConfigTabsProps) {
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
          {activeTab === "numbers" ? (
            <PhoneNumbersTab
              agentId={agentId}
              phoneEnabled={phoneEnabled}
              settings={settings}
              onSettingsRefresh={onSettingsRefresh}
            />
          ) : (
            <PhoneSettingsTab agentName={agentName} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
