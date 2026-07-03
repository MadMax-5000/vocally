"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { AppIcon } from "@/components/ui/app-icon";
import { Button } from "@/components/ui/button";
import { TemplateStackedCard } from "@/components/dashboard/TemplateStackedCard";
import { useClickSound } from "@/lib/hooks/useClickSound";
import { AGENT_TEMPLATES } from "@/lib/templates/agent-templates";
import { ArrowLeftIcon } from "@/lib/icons/app-icons";
import { TooltipProvider } from "@/components/ui/tooltip";

export function TemplatesClient() {
  const router = useRouter();
  const play = useClickSound();

  const handleSelect = (templateId: string) => {
    play();
    router.push(`/dashboard/agents/new?template=${encodeURIComponent(templateId)}`);
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 py-2">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/agents">
            <Button variant="ghost" size="icon-sm" className="text-muted hover:text-ink">
              <AppIcon icon={ArrowLeftIcon} className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-display-sm font-display tracking-tight text-ink">
              Templates
            </h1>
            <p className="mt-1 text-body-sm text-muted">
              Start from a curated preset — tone, languages, and channels are pre-configured.
            </p>
          </div>
        </div>
        <Link href="/dashboard/agents/new">
          <Button variant="outline" size="sm">
            Build from scratch
          </Button>
        </Link>
      </div>

      <TooltipProvider delayDuration={300}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {AGENT_TEMPLATES.map((template, index) => (
            <TemplateStackedCard
              key={template.id}
              template={template}
              index={index}
              onSelect={handleSelect}
            />
          ))}
        </div>
      </TooltipProvider>
    </div>
  );
}
