"use client";

import { useEffect, useState } from "react";
import type { Plan } from "@prisma/client";
import { DashboardTabBar } from "@/components/dashboard/DashboardTabBar";
import type { AgentDetailTabId, AgentDetailWithRelations } from "./agent-detail-types";
import { AgentDetailAgentTab } from "./AgentDetailAgentTab";
import { AgentDetailKnowledgeTab } from "./AgentDetailKnowledgeTab";
import { AgentDetailPreviewTab } from "./AgentDetailPreviewTab";
import { AgentDetailDeployTab } from "./AgentDetailDeployTab";
import { AgentDetailActionsTab } from "./AgentDetailActionsTab";
import { AgentTestsPanel } from "./tests/AgentTestsPanel";
import { AgentDetailSecurityTab } from "./AgentDetailSecurityTab";
import { AgentDetailAdvancedTab } from "./AgentDetailAdvancedTab";
import { resolveTestingAsLabel } from "@/lib/agent-tests/context";
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

const IDLE_PREMOUNT_TABS: AgentDetailTabId[] = [
  "actions",
  "deploy",
  "security",
  "tests",
];

type AgentDetailTabsProps = {
  agent: AgentDetailWithRelations;
  plan: Plan;
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

function TabPanelContent({
  tabId,
  agent,
  plan,
  label,
}: {
  tabId: AgentDetailTabId;
  agent: AgentDetailWithRelations;
  plan: Plan;
  label: string;
}) {
  const tTests = useTranslations("dashboard.agentDetail.tests");

  switch (tabId) {
    case "agent":
      return <AgentDetailAgentTab agent={agent} plan={plan} />;
    case "knowledge":
      return <AgentDetailKnowledgeTab agentId={agent.id} />;
    case "actions":
      return <AgentDetailActionsTab agent={agent} />;
    case "preview":
      return <AgentDetailPreviewTab agent={agent} />;
    case "deploy":
      return <AgentDetailDeployTab agent={agent} />;
    case "tests":
      return (
        <AgentTestsPanel
          agentId={agent.id}
          testingAs={resolveTestingAsLabel(
            agent.variables,
            tTests("previewUser"),
          )}
        />
      );
    case "security":
      return <AgentDetailSecurityTab agent={agent} />;
    case "advanced":
      return <AgentDetailAdvancedTab agent={agent} />;
    default:
      return <TabPlaceholder label={label} />;
  }
}

export function AgentDetailTabs({
  agent,
  plan,
  activeTab,
  onTabChange,
}: AgentDetailTabsProps) {
  const t = useTranslations("dashboard.agentDetail.tabs");
  const tabConfig = AGENT_DETAIL_TAB_IDS.map((id) => ({ id, label: t(id) }));
  const [mountedTabs, setMountedTabs] = useState<Set<AgentDetailTabId>>(
    () => new Set([activeTab]),
  );

  useEffect(() => {
    setMountedTabs((prev) => {
      if (prev.has(activeTab)) return prev;
      const next = new Set(prev);
      next.add(activeTab);
      return next;
    });
  }, [activeTab]);

  useEffect(() => {
    const premount = () => {
      setMountedTabs((prev) => {
        const next = new Set(prev);
        for (const id of IDLE_PREMOUNT_TABS) next.add(id);
        return next;
      });
    };

    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(premount);
      return () => window.cancelIdleCallback(id);
    }

    const timeout = window.setTimeout(premount, 200);
    return () => window.clearTimeout(timeout);
  }, []);

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

      <div className="pt-6">
        {AGENT_DETAIL_TAB_IDS.map((id) => {
          if (!mountedTabs.has(id)) return null;
          const isActive = id === activeTab;
          return (
            <div key={id} hidden={!isActive} inert={!isActive}>
              <TabPanelContent
                tabId={id}
                agent={agent}
                plan={plan}
                label={tabConfig.find((tab) => tab.id === id)?.label ?? ""}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
