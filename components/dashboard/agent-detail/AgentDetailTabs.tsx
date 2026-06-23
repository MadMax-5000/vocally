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

const TAB_CONFIG: { id: AgentDetailTabId; label: string }[] = [
  { id: "preview", label: "Preview" },
  { id: "agent", label: "Agent" },
  { id: "knowledge", label: "Knowledge Base" },
  { id: "actions", label: "Actions" },
  { id: "deploy", label: "Deploy" },
  { id: "security", label: "Security" },
  { id: "tests", label: "Tests" },
  { id: "advanced", label: "Advanced" },
];

type AgentDetailTabsProps = {
  agent: AgentDetailWithRelations;
  activeTab: AgentDetailTabId;
  onTabChange: (tab: AgentDetailTabId) => void;
};

function TabPlaceholder({ label }: { label: string }) {
  return (
    <div className="flex min-h-[220px] items-center justify-center rounded-xl border border-dashed border-hairline bg-canvas-soft px-6 py-16">
      <p className="text-center text-body-sm text-muted">Coming soon — {label}</p>
    </div>
  );
}

export function AgentDetailTabs({
  agent,
  activeTab,
  onTabChange,
}: AgentDetailTabsProps) {
  const activeLabel = TAB_CONFIG.find((t) => t.id === activeTab)?.label ?? "";

  return (
    <div className="flex flex-col">
      <DashboardTabBar
        tabs={TAB_CONFIG}
        activeTab={activeTab}
        onTabChange={onTabChange}
        layoutId="agentDetailTabPill"
        ariaLabel="Agent sections"
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