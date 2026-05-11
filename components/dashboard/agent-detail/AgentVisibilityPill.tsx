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
    "flex h-6 items-center justify-center rounded-full px-3 text-[11px] font-medium uppercase tracking-wide leading-none whitespace-nowrap ring-1 ring-inset transition-colors",
    isPublic
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200 hover:bg-emerald-100"
      : "bg-zinc-50 text-zinc-700 ring-zinc-200 hover:bg-zinc-100",
    pending && "pointer-events-none opacity-60"
  )}
>
  <span className="translate-y-[-0.5px]">
    {label}
  </span>
</button>
  );
}