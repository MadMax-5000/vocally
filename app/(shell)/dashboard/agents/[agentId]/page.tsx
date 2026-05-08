import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";

import { getAIAgentById } from "@/lib/actions/agents";
import { Button } from "@/components/ui/button";

function formatEnumLabel(value: string): string {
  return value.replaceAll("_", " ");
}

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
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex rounded-pill bg-surface-strong px-2.5 py-0.5 text-caption-uppercase text-muted">
                {formatEnumLabel(agent.agentType)}
              </span>
              <span className="inline-flex rounded-pill bg-surface-strong px-2.5 py-0.5 text-caption-uppercase text-muted">
                {formatEnumLabel(agent.tone)}
              </span>
              <span className="inline-flex rounded-pill bg-surface-strong px-2.5 py-0.5 text-caption-uppercase text-muted">
                {formatEnumLabel(agent.creativity)}
              </span>
              <span className="inline-flex rounded-pill bg-surface-strong px-2.5 py-0.5 text-caption-uppercase text-muted">
                Handoff {agent.handoffEnabled ? "on" : "off"}
              </span>
            </div>
            {agent.customRole ? (
              <p className="text-body-md text-body">
                <span className="font-medium text-ink">Custom role: </span>
                {agent.customRole}
              </p>
            ) : null}
            {agent.customTone ? (
              <p className="text-body-md text-body">
                <span className="font-medium text-ink">Custom tone: </span>
                {agent.customTone}
              </p>
            ) : null}
            {agent.websiteUrl ? (
              <p className="text-body-sm text-muted">
                Website:{" "}
                <a
                  href={agent.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ink underline-offset-4 hover:underline"
                >
                  {agent.websiteUrl}
                </a>
              </p>
            ) : null}
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-title-md font-medium text-ink">Main goal</h2>
          <div className="rounded-xl border border-hairline bg-surface-card p-6">
            <p className="whitespace-pre-wrap text-body-md leading-relaxed text-body">
              {agent.description ?? "—"}
            </p>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <h2 className="text-title-md font-medium text-ink">Languages</h2>
            <div className="rounded-xl border border-hairline bg-surface-card p-4">
              <ul className="space-y-1.5 text-body-sm text-body">
                {agent.languages.length === 0 ? (
                  <li className="text-muted">—</li>
                ) : (
                  agent.languages.map((l) => (
                    <li key={l.id}>{formatEnumLabel(l.language)}</li>
                  ))
                )}
              </ul>
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-title-md font-medium text-ink">Channels</h2>
            <div className="rounded-xl border border-hairline bg-surface-card p-4">
              <ul className="space-y-1.5 text-body-sm text-body">
                {agent.channels.length === 0 ? (
                  <li className="text-muted">—</li>
                ) : (
                  agent.channels.map((c) => (
                    <li key={c.id}>
                      {formatEnumLabel(c.channel)}
                      {!c.enabled ? " (off)" : ""}
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-title-md font-medium text-ink">Knowledge</h2>
          <div className="rounded-xl border border-hairline bg-surface-card p-4">
            {agent.knowledgeDocs.length === 0 ? (
              <p className="text-body-sm text-muted">No documents linked yet.</p>
            ) : (
              <ul className="space-y-1.5 text-body-sm text-body">
                {agent.knowledgeDocs.map((row) => (
                  <li key={row.id}>{row.knowledgeDoc.title}</li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {agent.instructions ? (
          <div className="space-y-2">
            <h2 className="text-title-md font-medium text-ink">Instructions</h2>
            <div className="rounded-xl border border-hairline bg-surface-card p-6">
              <p className="whitespace-pre-wrap text-body-md leading-relaxed text-body">
                {agent.instructions}
              </p>
            </div>
          </div>
        ) : null}

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
