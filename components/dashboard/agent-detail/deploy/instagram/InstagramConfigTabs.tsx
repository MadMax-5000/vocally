"use client";

import { AnimatePresence, motion } from "framer-motion";

import { InstagramSetupTab } from "./InstagramSetupTab";
import { InstagramTestTab } from "./InstagramTestTab";

export type InstagramConfigTabId = "setup" | "test";

type InstagramConfigTabsProps = {
  activeTab: InstagramConfigTabId;
  agentId: string;
  instagramEnabled: boolean;
  isPublic: boolean;
  isActive: boolean;
};

export function InstagramConfigTabs({
  activeTab,
  agentId,
  instagramEnabled,
  isPublic,
  isActive,
}: InstagramConfigTabsProps) {
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
            <InstagramSetupTab
              agentId={agentId}
              instagramEnabled={instagramEnabled}
              isPublic={isPublic}
              isActive={isActive}
            />
          ) : (
            <InstagramTestTab agentId={agentId} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

