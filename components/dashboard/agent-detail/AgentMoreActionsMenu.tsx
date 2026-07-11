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
import { useTranslations } from "next-intl";

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

async function copyToClipboard(text: string, successMessage: string, errorMessage: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(successMessage);
  } catch {
    toast.error(errorMessage);
  }
}

async function copyShareableLink(agentId: string, successMessage: string, errorMessage: string) {
  const url = `${window.location.origin}/agents/${agentId}`;
  await copyToClipboard(url, successMessage, errorMessage);
}

export function AgentMoreActionsMenu({ agentId }: AgentMoreActionsMenuProps) {
  const t = useTranslations("dashboard.agentDetail");
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="shrink-0 text-muted hover:text-ink"
          aria-label={t("moreActions")}
        >
          <AppIcon icon={MoreHorizontal} className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[11rem]">
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            void copyShareableLink(agentId, t("shareableLinkCopied"), t("couldNotCopy"));
          }}
        >
          <AppIcon icon={LinkIcon} className="mr-2 h-3.5 w-3.5" />
          {t("copyShareableLink")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            void copyToClipboard(agentId, t("agentIdCopied"), t("couldNotCopy"));
          }}
        >
          <AppIcon icon={CopyIcon} className="mr-2 h-3.5 w-3.5" />
          {t("copyAgentId")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            toast.message(t("archiveAgent"), { description: t("comingSoon") });
          }}
        >
          <AppIcon icon={ArchiveIcon} className="mr-2 h-3.5 w-3.5" />
          {t("archiveAgent")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-semantic-error focus:text-semantic-error"
          onSelect={(e) => {
            e.preventDefault();
            toast.message(t("deleteAgent"), { description: t("comingSoon") });
          }}
        >
          <AppIcon icon={Trash2Icon} className="mr-2 h-3.5 w-3.5" />
          {t("deleteAgent")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
