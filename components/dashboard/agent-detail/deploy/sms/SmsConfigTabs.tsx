"use client";

import { AnimatePresence, motion } from "framer-motion";

import type { AgentSmsSettings } from "@/lib/actions/sms-connection";

import { SmsConnectTab } from "./SmsConnectTab";
import { SmsSetupTab } from "./SmsSetupTab";
import { SmsTestTab } from "./SmsTestTab";

export type SmsConfigTabId = "setup" | "connect" | "test";

type SmsConfigTabsProps = {
  activeTab: SmsConfigTabId;
  agentId: string;
  agentName: string;
  smsEnabled: boolean;
  settings: AgentSmsSettings;
  onSettingsRefresh: () => Promise<void>;
};

export function SmsConfigTabs({
  activeTab,
  agentId,
  agentName,
  smsEnabled,
  settings,
  onSettingsRefresh,
}: SmsConfigTabsProps) {
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
          {activeTab === "setup" ? (
            <SmsSetupTab
              smsEnabled={smsEnabled}
              settings={settings}
            />
          ) : activeTab === "connect" ? (
            <SmsConnectTab
              agentId={agentId}
              settings={settings}
              onSettingsRefresh={onSettingsRefresh}
            />
          ) : (
            <SmsTestTab agentName={agentName} settings={settings} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
