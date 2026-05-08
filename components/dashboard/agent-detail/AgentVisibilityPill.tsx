"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AgentVisibility } from "@prisma/client";
import { toast } from "sonner";

import { updateAgentVisibility } from "@/lib/actions/agents";
import { cn } from "@/lib/utils";

type AgentVisibilityPillProps = {
  agentId: string;
  visibility: AgentVisibility;
};

export function AgentVisibilityPill({
  agentId,
  visibility: initialVisibility,
}: AgentVisibilityPillProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [visibility, setVisibility] = useState(initialVisibility);

  useEffect(() => {
    setVisibility(initialVisibility);
  }, [initialVisibility]);

  const isPublic = visibility === AgentVisibility.PUBLIC;
  const label = isPublic ? "Public" : "Private";

  function handleClick() {
    const next = isPublic ? AgentVisibility.PRIVATE : AgentVisibility.PUBLIC;
    const previous = visibility;
    startTransition(async () => {
      setVisibility(next);
      const result = await updateAgentVisibility(agentId, next);
      if (!result.success) {
        setVisibility(previous);
        toast.error(result.error ?? "Could not update visibility");
        return;
      }
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className={cn(
        "inline-flex shrink-0 items-center text-xs rounded-full px-3 py-[2px] text-caption-uppercase font-semibold ring-1 ring-inset transition-opacity",
        isPublic
          ? "bg-emerald-50 text-emerald-700 ring-emerald-100 hover:bg-emerald-100/60"
          : "bg-slate-50 text-slate-700 ring-slate-200 hover:bg-slate-100/60",
        pending && "pointer-events-none opacity-70",
      )}
    >
      {label}
    </button>
  );
}