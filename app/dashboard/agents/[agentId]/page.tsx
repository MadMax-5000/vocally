import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";

import { getAIAgentById } from "@/lib/actions/agents";
import { Button } from "@/components/ui/button";

export default async function AgentDetailPage({
  params,
}: {
  params: { agentId: string };
}) {
  const result = await getAIAgentById(params.agentId);

  if (!result.success || !result.data) {
    notFound();
  }

  const agent = result.data;

  return (
    <div className="flex flex-col gap-8 py-2">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/agents">
          <Button variant="ghost" size="icon-sm" className="text-muted hover:text-ink">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-display-sm font-display font-bold tracking-tight text-ink">
          {agent.name}
        </h1>
      </div>

      <div className="mx-auto w-full max-w-2xl space-y-8">
        <div className="flex items-start gap-4 rounded-xl border border-hairline bg-surface-card p-6">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-surface-strong">
            <Sparkles className="h-5 w-5 text-muted" />
          </div>
          <div className="space-y-1">
            <p className="text-title-md font-medium text-ink">{agent.name}</p>
            <p className="text-body-md text-body">{agent.title}</p>
            <span className="mt-2 inline-flex items-center rounded-pill bg-surface-strong px-2.5 py-0.5 text-caption-uppercase text-muted">
              {agent.field}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-title-md font-medium text-ink">Instructions</h2>
          <div className="rounded-xl border border-hairline bg-surface-card p-6">
            <p className="whitespace-pre-wrap text-body-md leading-relaxed text-body">
              {agent.instructions}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4">
          <Button variant="outline" disabled>
            Edit Agent
          </Button>
          <Button variant="primary" disabled>
            Configure
          </Button>
        </div>
      </div>
    </div>
  );
}
