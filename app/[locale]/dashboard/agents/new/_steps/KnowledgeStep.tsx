"use client";
import { AppIcon } from "@/components/ui/app-icon"
import { PlugIcon } from "@/lib/icons/app-icons"

import { KnowledgeIcon } from "@/components/ui/icons";

import { SelectableCard } from "@/components/onboarding/SelectableCard";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("dashboard.agents.wizard");
  return (
    <div className="flex flex-col gap-6">
      <header className="space-y-2">
        <h1 className="text-display-sm font-display tracking-tight text-ink text-balance">
          {t("knowledgeTitle")}
        </h1>
        <p className="max-w-xl text-body-sm leading-relaxed text-muted">
          {t("knowledgeDescription")}
        </p>
      </header>

      <section className="space-y-3 rounded-xl border border-hairline bg-surface-card p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-strong text-muted">
            <AppIcon icon={PlugIcon} className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <p className="text-title-sm font-medium text-ink">{t("tools")}</p>
            <p className="mt-1 text-body-sm leading-relaxed text-body">
              {t("toolsDescription")}
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <KnowledgeIcon className="h-5 w-5 text-muted" aria-hidden />
          <h2 className="text-title-sm font-medium text-ink">{t("knowledgeDocuments")}</h2>
        </div>
        {docs.length === 0 ? (
          <p className="rounded-xl border border-dashed border-hairline-strong bg-surface-card px-4 py-8 text-center text-body-sm text-muted">
            {t("noDocuments")}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {docs.map((doc) => (
              <SelectableCard
                key={doc.id}
                title={doc.title}
                customIcon={KnowledgeIcon}
                selected={selectedIds.includes(doc.id)}
                onClick={() => onToggle(doc.id)}
              />
            ))}
          </div>
        )}
      </section>

      <div className="flex flex-wrap items-center justify-end gap-3">
        <Button type="button" variant="outline" onClick={onSkip}>
          {t("skip")}
        </Button>
        <Button type="button" variant="primary" onClick={onContinue}>
          {t("continue")}
        </Button>
      </div>
    </div>
  );
}
