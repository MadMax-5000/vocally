"use client";

import { AppIcon } from "@/components/ui/app-icon";
import {
  ArchiveIcon,
  CopyIcon,
  LinkIcon,
  MoreHorizontal,
  Trash2Icon,
} from "@/lib/icons/app-icons";
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

async function copyShareableLink(agentId: string) {
  const url = `${window.location.origin}/agents/${agentId}`;
  await copyToClipboard(url, "Shareable link copied");
}

export function AgentMoreActionsMenu({ agentId }: AgentMoreActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="shrink-0 text-muted hover:text-ink"
          aria-label="More actions"
        >
          <AppIcon icon={MoreHorizontal} className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[11rem]">
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            void copyShareableLink(agentId);
          }}
        >
          <AppIcon icon={LinkIcon} className="mr-2 h-3.5 w-3.5" />
          Copy shareable link
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            void copyToClipboard(agentId, "Agent ID copied");
          }}
        >
          <AppIcon icon={CopyIcon} className="mr-2 h-3.5 w-3.5" />
          Copy agent ID
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            toast.message("Archive agent", { description: "Coming soon." });
          }}
        >
          <AppIcon icon={ArchiveIcon} className="mr-2 h-3.5 w-3.5" />
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
          <AppIcon icon={Trash2Icon} className="mr-2 h-3.5 w-3.5" />
          Delete agent
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
