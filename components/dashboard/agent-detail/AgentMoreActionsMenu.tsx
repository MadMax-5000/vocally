"use client";

import { Copy, MoreHorizontal, Share2, Trash2, Archive } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type AgentMoreActionsMenuProps = {
  agentId: string;
};

async function copyToClipboard(text: string, successMessage: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(successMessage);
  } catch {
    toast.error("Could not copy to clipboard");
  }
}

export function AgentMoreActionsMenu({ agentId }: AgentMoreActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          className="shrink-0 border-hairline-strong text-ink"
          aria-label="More actions"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[11rem]">
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            void copyToClipboard(agentId, "Agent ID copied");
          }}
        >
          <Copy className="mr-2 h-3.5 w-3.5" />
          Copy agent ID
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            toast.message("Share agent", { description: "Coming soon." });
          }}
        >
          <Share2 className="mr-2 h-3.5 w-3.5" />
          Share agent
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            toast.message("Archive agent", { description: "Coming soon." });
          }}
        >
          <Archive className="mr-2 h-3.5 w-3.5" />
          Archive agent
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-semantic-error focus:text-semantic-error"
          onSelect={(e) => {
            e.preventDefault();
            toast.message("Delete agent", { description: "Coming soon." });
          }}
        >
          <Trash2 className="mr-2 h-3.5 w-3.5" />
          Delete agent
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
