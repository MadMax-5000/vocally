"use client";
import { AnimatePresence, motion } from "framer-motion";
import { DashboardTabBar } from "@/components/dashboard/DashboardTabBar";
import type { AgentDetailTabId, AgentDetailWithRelations } from "./agent-detail-types";
import { AgentDetailAgentTab } from "./AgentDetailAgentTab";
import { AgentDetailAnalyticsTab } from "./AgentDetailAnalyticsTab";
import { AgentDetailKnowledgeTab } from "./AgentDetailKnowledgeTab";
import { AgentDetailPreviewTab } from "./AgentDetailPreviewTab";
import { AgentDetailDeployTab } from "./AgentDetailDeployTab";
import { AgentDetailActionsTab } from "./AgentDetailActionsTab";
import { useTranslations } from "next-intl";

export const AGENT_DETAIL_TAB_IDS: AgentDetailTabId[] = [
  "preview",
  "agent",
  "knowledge",
  "actions",
  "deploy",
  "security",
  "tests",
  "advanced",
];

type AgentDetailTabsProps = {
  agent: AgentDetailWithRelations;
  activeTab: AgentDetailTabId;
  onTabChange: (tab: AgentDetailTabId) => void;
};

function TabPlaceholder({ label }: { label: string }) {
  const t = useTranslations("dashboard.agentDetail.tabs");
  return (
    <div className="flex min-h-[220px] items-center justify-center rounded-xl border border-dashed border-hairline bg-canvas-soft px-6 py-16">
      <p className="text-center text-body-sm text-muted">{t("placeholder", { label })}</p>
    </div>
  );
}

export function AgentDetailTabs({
  agent,
  activeTab,
  onTabChange,
}: AgentDetailTabsProps) {
  const t = useTranslations("dashboard.agentDetail.tabs");
  const tabConfig = AGENT_DETAIL_TAB_IDS.map((id) => ({ id, label: t(id) }));
  const activeLabel = tabConfig.find((tab) => tab.id === activeTab)?.label ?? "";

  return (
    <div className="flex flex-col">
      <DashboardTabBar
        tabs={tabConfig}
        activeTab={activeTab}
        onTabChange={onTabChange}
        layoutId="agentDetailTabPill"
        ariaLabel={t("sections")}
        className="-mx-4 -mt-1 px-4"
      />

      {/* Tab content with fade+slide transition */}
      <div className="pt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.14 }}
          >
            {activeTab === "agent" ? (
              <AgentDetailAgentTab agent={agent} />
            ) : activeTab === "analysis" ? (
              <AgentDetailAnalyticsTab agentId={agent.id} />
            ) : activeTab === "knowledge" ? (
              <AgentDetailKnowledgeTab agentId={agent.id} />
            ) : activeTab === "actions" ? (
              <AgentDetailActionsTab agent={agent} />
            ) : activeTab === "preview" ? (
              <AgentDetailPreviewTab agent={agent} />
            ) : activeTab === "deploy" ? (
              <AgentDetailDeployTab agent={agent} />
            ) : (
              <TabPlaceholder label={activeLabel} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}