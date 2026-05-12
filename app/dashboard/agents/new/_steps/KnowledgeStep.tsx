"use client";

import { Plug } from "lucide-react";
import { KnowledgeIcon } from "@/components/ui/icons";

import { SelectableCard } from "@/components/onboarding/SelectableCard";
import { Button } from "@/components/ui/button";

type KnowledgeDocRow = { id: string; title: string };

type KnowledgeStepProps = {
  docs: KnowledgeDocRow[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onSkip: () => void;
  onContinue: () => void;
};

export function KnowledgeStep({
  docs,
  selectedIds,
  onToggle,
  onSkip,
  onContinue,
}: KnowledgeStepProps) {
  return (
    <div className="flex flex-col gap-6">
      <header className="space-y-2">
        <h1 className="text-display-sm font-display tracking-tight text-ink text-balance">
          Ground your agent
        </h1>
        <p className="max-w-xl text-body-sm leading-relaxed text-muted">
          Link knowledge your agent can cite. Tools and deeper integrations can be added from the
          dashboard after creation.
        </p>
      </header>

      <section className="space-y-3 rounded-xl border border-hairline bg-surface-card p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-strong text-muted">
            <Plug className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <p className="text-title-sm font-medium text-ink">Tools</p>
            <p className="mt-1 text-body-sm leading-relaxed text-body">
              CRM lookups, calendars, and ticketing will appear here soon. Skip for now if you are
              not ready — nothing is required to continue.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <KnowledgeIcon className="h-5 w-5 text-muted" aria-hidden />
          <h2 className="text-title-sm font-medium text-ink">Knowledge documents</h2>
        </div>
        {docs.length === 0 ? (
          <p className="rounded-xl border border-dashed border-hairline-strong bg-surface-card px-4 py-8 text-center text-body-sm text-muted">
            No documents in your workspace yet. Upload files from the knowledge base, then edit this
            agent to attach them.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {docs.map((doc) => (
              <SelectableCard
                key={doc.id}
                title={doc.title}
                icon={KnowledgeIcon}
                selected={selectedIds.includes(doc.id)}
                onClick={() => onToggle(doc.id)}
              />
            ))}
          </div>
        )}
      </section>

      <div className="flex flex-wrap items-center justify-end gap-3">
        <Button type="button" variant="outline" onClick={onSkip}>
          Skip
        </Button>
        <Button type="button" variant="primary" onClick={onContinue}>
          Continue
        </Button>
      </div>
    </div>
  );
}
