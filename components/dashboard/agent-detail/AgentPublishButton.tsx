"use client";

import { ChevronDown } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type AgentPublishButtonProps = {
  agentId: string;
};

async function copyShareableLink(agentId: string) {
  const url = `${window.location.origin}/agents/${agentId}`;
  try {
    await navigator.clipboard.writeText(url);
    toast.success("Shareable link copied");
  } catch {
    toast.error("Could not copy link");
  }
}

export function AgentPublishButton({ agentId }: AgentPublishButtonProps) {
  return (
    <div className="flex shrink-0 overflow-hidden rounded-md bg-ink text-canvas">
      <Button
        type="button"
        variant="default"
        size="sm"
        className="h-7 rounded-none rounded-l-md border-0 px-3 text-canvas hover:bg-ink/90"
        onClick={() => {
          toast.message("Publish", { description: "Coming soon." });
        }}
      >
        Publish
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="default"
            size="icon-sm"
            className={cn(
              "h-7 w-7 shrink-0 rounded-none rounded-r-md border-0 border-l border-canvas/15 text-canvas hover:bg-ink/90",
            )}
            aria-label="Publish options"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[10rem]">
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              void copyShareableLink(agentId);
            }}
          >
            Copy shareable link
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
