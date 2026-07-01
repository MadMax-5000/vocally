"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import type { AgentDetailTabId, AgentDetailWithRelations } from "./agent-detail-types";
import { AGENT_DETAIL_TAB_IDS, AgentDetailTabs } from "./AgentDetailTabs";
import { AgentDetailTopbar } from "./AgentDetailTopbar";

type AgentDetailShellProps = {
  agent: AgentDetailWithRelations;
};

function isValidTab(value: string | null): value is AgentDetailTabId {
  return (
    value !== null &&
    (AGENT_DETAIL_TAB_IDS as readonly string[]).includes(value)
  );
}

export function AgentDetailShell({ agent }: AgentDetailShellProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  const [activeTab, setActiveTab] = useState<AgentDetailTabId>(() =>
    isValidTab(tabParam) ? tabParam : "preview",
  );

  useEffect(() => {
    if (isValidTab(tabParam) && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam, activeTab]);

  const handleTabChange = useCallback(
    (tab: AgentDetailTabId) => {
      setActiveTab(tab);
      const url = new URL(window.location.href);
      if (tab === "preview") {
        url.searchParams.delete("tab");
      } else {
        url.searchParams.set("tab", tab);
      }
      router.replace(url.pathname + url.search, { scroll: false });
    },
    [router],
  );

  return (
    <div className="flex flex-col gap-0">
      <AgentDetailTopbar
        agent={agent}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
      <AgentDetailTabs
        agent={agent}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
    </div>
  );
}
