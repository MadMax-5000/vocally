"use client";

import { DeployComingSoonPanel } from "@/components/dashboard/agent-detail/deploy/DeployComingSoonPanel";
import { DeployManageShell } from "@/components/dashboard/agent-detail/deploy/DeployManageShell";
import type { DeployCatalogEntry } from "@/lib/constants/deploy-catalog";

type DeployStubManageProps = {
  agentId: string;
  entry: Pick<DeployCatalogEntry, "title" | "description" | "iconSrc">;
};

export function DeployStubManage({ agentId, entry }: DeployStubManageProps) {
  return (
    <DeployManageShell
      agentId={agentId}
      title={entry.title}
      description="This channel is on our roadmap. Check back soon."
    >
      <DeployComingSoonPanel
        title={entry.title}
        description={entry.description}
        iconSrc={entry.iconSrc}
      />
    </DeployManageShell>
  );
}
