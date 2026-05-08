import type { AgentDetailWithRelations } from "./agent-detail-types";

type AgentDetailAgentTabProps = {
  agent: AgentDetailWithRelations;
};

export function AgentDetailAgentTab({ agent }: AgentDetailAgentTabProps) {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="flex min-h-[220px] items-center justify-center rounded-xl border border-dashed border-hairline bg-canvas-soft px-6 py-16">
        <p className="text-center text-body-sm text-muted">Coming soon — Agent</p>
      </div>
    </div>
  );
}
