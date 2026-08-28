"use client";

import { AgentTestsPanel } from "@/components/dashboard/agent-detail/tests/AgentTestsPanel";

import { DashIn } from "./shared";

export function TestVisual() {
  return (
    <DashIn delay={0.05} className="w-full">
      <AgentTestsPanel variant="marketing" />
    </DashIn>
  );
}
