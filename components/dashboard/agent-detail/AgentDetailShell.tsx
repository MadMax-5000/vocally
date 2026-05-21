"use client";

import { useState } from "react";

import type { AgentDetailTabId, AgentDetailWithRelations } from "./agent-detail-types";
import { AgentDetailTabs } from "./AgentDetailTabs";
import { AgentDetailTopbar } from "./AgentDetailTopbar";

type AgentDetailShellProps = {
  agent: AgentDetailWithRelations;
};

export function AgentDetailShell({ agent }: AgentDetailShellProps) {
  const [activeTab, setActiveTab] = useState<AgentDetailTabId>("preview");

  return (
    <div className="flex flex-col gap-0">
      <AgentDetailTopbar agent={agent} />
      <AgentDetailTabs
        agent={agent}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </div>
  );
}
