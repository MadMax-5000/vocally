"use client";

import { AnimatePresence, motion } from "framer-motion";

import type { WordPressPluginDefaults } from "@/lib/deploy/wordpress-config";

import { WordPressEmbedTab } from "./WordPressEmbedTab";
import { WordPressInstallTab } from "./WordPressInstallTab";
import { WordPressSetupTab } from "./WordPressSetupTab";

export type WordPressConfigTabId = "setup" | "embed" | "install";

type WordPressConfigTabsProps = {
  activeTab: WordPressConfigTabId;
  agentId: string;
  wordpressEnabled: boolean;
  webChatEnabled: boolean;
  isPublic: boolean;
  isActive: boolean;
  pluginDefaults: WordPressPluginDefaults;
};

export function WordPressConfigTabs({
  activeTab,
  agentId,
  wordpressEnabled,
  webChatEnabled,
  isPublic,
  isActive,
  pluginDefaults,
}: WordPressConfigTabsProps) {
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
            <WordPressSetupTab
              agentId={agentId}
              wordpressEnabled={wordpressEnabled}
              webChatEnabled={webChatEnabled}
              isPublic={isPublic}
              isActive={isActive}
              pluginDefaults={pluginDefaults}
            />
          ) : activeTab === "embed" ? (
            <WordPressEmbedTab
              inlineEmbedUrl={pluginDefaults.embedUrl}
              floatingEmbedUrl={pluginDefaults.floatingEmbedUrl}
            />
          ) : (
            <WordPressInstallTab />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
