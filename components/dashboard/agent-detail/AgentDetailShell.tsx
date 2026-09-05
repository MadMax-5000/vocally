"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import type { Plan } from "@prisma/client";

import type { AgentDetailTabId, AgentDetailWithRelations } from "./agent-detail-types";
import { AGENT_DETAIL_TAB_IDS, AgentDetailTabs } from "./AgentDetailTabs";
import { AgentDetailTopbar } from "./AgentDetailTopbar";

type AgentDetailShellProps = {
  agent: AgentDetailWithRelations;
  plan: Plan;
};

function isValidTab(value: string | null): value is AgentDetailTabId {
  return (
    value !== null &&
    (AGENT_DETAIL_TAB_IDS as readonly string[]).includes(value)
  );
}

function tabFromSearch(search: string): AgentDetailTabId {
  const tab = new URLSearchParams(search).get("tab");
  return isValidTab(tab) ? tab : "preview";
}

function replaceTabInUrl(tab: AgentDetailTabId) {
  const url = new URL(window.location.href);
  if (tab === "preview") {
    url.searchParams.delete("tab");
  } else {
    url.searchParams.set("tab", tab);
  }
  window.history.replaceState(window.history.state, "", url);
}

export function AgentDetailShell({ agent, plan }: AgentDetailShellProps) {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  const [activeTab, setActiveTab] = useState<AgentDetailTabId>(() =>
    isValidTab(tabParam) ? tabParam : "preview",
  );

  useEffect(() => {
    const onPopState = () => {
      setActiveTab(tabFromSearch(window.location.search));
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const handleTabChange = useCallback((tab: AgentDetailTabId) => {
    setActiveTab(tab);
    replaceTabInUrl(tab);
  }, []);

  return (
    <div className="flex flex-col gap-0">
      <AgentDetailTopbar
        agent={agent}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
      <AgentDetailTabs
        agent={agent}
        plan={plan}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
    </div>
  );
}
