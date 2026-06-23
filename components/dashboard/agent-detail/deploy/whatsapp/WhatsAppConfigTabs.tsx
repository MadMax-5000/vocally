"use client";

import { AnimatePresence, motion } from "framer-motion";

import type { AgentWhatsAppSettings } from "@/lib/actions/whatsapp-connection";

import { WhatsAppConnectTab } from "./WhatsAppConnectTab";
import { WhatsAppSetupTab } from "./WhatsAppSetupTab";
import { WhatsAppTestTab } from "./WhatsAppTestTab";

export type WhatsAppConfigTabId = "setup" | "connect" | "test";

type WhatsAppConfigTabsProps = {
  activeTab: WhatsAppConfigTabId;
  agentId: string;
  agentName: string;
  whatsappEnabled: boolean;
  isPublic: boolean;
  isActive: boolean;
  settings: AgentWhatsAppSettings;
  onSettingsRefresh: () => Promise<void>;
};

export function WhatsAppConfigTabs({
  activeTab,
  agentId,
  agentName,
  whatsappEnabled,
  isPublic,
  isActive,
  settings,
  onSettingsRefresh,
}: WhatsAppConfigTabsProps) {
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
            <WhatsAppSetupTab
              whatsappEnabled={whatsappEnabled}
              isPublic={isPublic}
              isActive={isActive}
              settings={settings}
            />
          ) : activeTab === "connect" ? (
            <WhatsAppConnectTab
              agentId={agentId}
              settings={settings}
              onSettingsRefresh={onSettingsRefresh}
            />
          ) : (
            <WhatsAppTestTab agentName={agentName} settings={settings} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
