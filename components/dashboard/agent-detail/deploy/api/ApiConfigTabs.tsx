"use client";

import { AnimatePresence, motion } from "framer-motion";

import { ApiExamplesTab } from "./ApiExamplesTab";
import { ApiSetupTab } from "./ApiSetupTab";

export type ApiConfigTabId = "setup" | "examples";

type ApiConfigTabsProps = {
  activeTab: ApiConfigTabId;
  agentId: string;
  apiToken: string;
  apiEnabled: boolean;
  isPublic: boolean;
  isActive: boolean;
  onRegenerateToken: () => void;
  regenerating: boolean;
};

export function ApiConfigTabs({
  activeTab,
  agentId,
  apiToken,
  apiEnabled,
  isPublic,
  isActive,
  onRegenerateToken,
  regenerating,
}: ApiConfigTabsProps) {
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
            <ApiSetupTab
              agentId={agentId}
              apiToken={apiToken}
              apiEnabled={apiEnabled}
              isPublic={isPublic}
              isActive={isActive}
              onRegenerateToken={onRegenerateToken}
              regenerating={regenerating}
            />
          ) : (
            <ApiExamplesTab agentId={agentId} apiToken={apiToken} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
