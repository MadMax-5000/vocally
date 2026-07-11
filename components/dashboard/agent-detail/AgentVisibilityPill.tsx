"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "@/i18n/routing";
import { AgentVisibility } from "@prisma/client";
import { toast } from "sonner";

import { Switch } from "@/components/ui/switch";
import { updateAgentVisibility } from "@/lib/actions/agents";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

type AgentVisibilityPillProps = {
  agentId: string;
  visibility: AgentVisibility;
  className?: string;
};

export function AgentVisibilityPill({
  agentId,
  visibility: initialVisibility,
  className,
}: AgentVisibilityPillProps) {
  const t = useTranslations("dashboard.agentDetail");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [visibility, setVisibility] = useState(initialVisibility);

  useEffect(() => {
    setVisibility(initialVisibility);
  }, [initialVisibility]);

  const isPublic = visibility === AgentVisibility.PUBLIC;
  const label = isPublic ? t("public") : t("private");

  function handleToggle(checked: boolean) {
    const next = checked ? AgentVisibility.PUBLIC : AgentVisibility.PRIVATE;
    const previous = visibility;
    startTransition(async () => {
      setVisibility(next);
      const result = await updateAgentVisibility(agentId, next);
      if (!result.success) {
        setVisibility(previous);
        toast.error(result.error ?? t("couldNotUpdateVisibility"));
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className={cn("flex h-7 items-center gap-2 px-2.5", className)}>
      <span className="whitespace-nowrap text-caption font-medium text-ink">{label}</span>
      <Switch
        size="sm"
        checked={isPublic}
        disabled={pending}
        onCheckedChange={handleToggle}
        aria-label={isPublic ? t("setPrivate") : t("setPublic")}
      />
    </div>
  );
}
