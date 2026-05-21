"use client";

import { DeployManageShell } from "@/components/dashboard/agent-detail/deploy/DeployManageShell";

type DeployStubManageProps = {
  agentId: string;
  title: string;
};

export function DeployStubManage({ agentId, title }: DeployStubManageProps) {
  return (
    <DeployManageShell agentId={agentId} title={title}>
      <div className="flex min-h-[220px] items-center justify-center rounded-xl border border-dashed border-hairline bg-canvas-soft px-6 py-16">
        <p className="text-center text-body-sm text-muted">
          Coming soon — configuration for {title} will be available here.
        </p>
      </div>
    </DeployManageShell>
  );
}
