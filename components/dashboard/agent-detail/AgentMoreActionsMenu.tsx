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
import { usePathname, useRouter } from "@/i18n/routing";
import { AgentStatus } from "@prisma/client";
import { archiveAgent, deleteAgent } from "@/lib/actions/agents";

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
  agentName: string;
  status: AgentStatus;
};

async function copyToClipboard(text: string, successMessage: string, errorMessage: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(successMessage);
  } catch {
    toast.error(errorMessage);
  }
}

async function copyShareableLink(agentId: string, pathname: string, successMessage: string, errorMessage: string) {
  const url = `${window.location.origin}${pathname}`;
  await copyToClipboard(url, successMessage, errorMessage);
}

export function AgentMoreActionsMenu({
  agentId,
  agentName,
  status,
}: AgentMoreActionsMenuProps) {
  const t = useTranslations("dashboard.agentDetail");
  const tList = useTranslations("dashboard.agents");
  const pathname = usePathname();
  const router = useRouter();

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
            void copyShareableLink(agentId, pathname, t("shareableLinkCopied"), t("couldNotCopy"));
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
            void (async () => {
              const res = await archiveAgent(agentId);
              if (res.success) {
                toast.success(
                  res.status === "PAUSED" ? tList("agentArchived") : tList("agentUnarchived"),
                );
                router.refresh();
              } else {
                toast.error(res.error ?? tList("failedToArchive"));
              }
            })();
          }}
        >
          <AppIcon icon={ArchiveIcon} className="mr-2 h-3.5 w-3.5" />
          {status === "PAUSED" ? t("unarchiveAgent") : t("archiveAgent")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-semantic-error focus:text-semantic-error"
          onSelect={(e) => {
            e.preventDefault();
            const confirmed = window.confirm(
              tList("deleteConfirmation", { name: agentName }),
            );
            if (!confirmed) return;
            void (async () => {
              const res = await deleteAgent(agentId);
              if (res.success) {
                toast.success(tList("agentDeleted"));
                router.push("/dashboard/agents");
                router.refresh();
              } else {
                toast.error(res.error ?? tList("failedToDelete"));
              }
            })();
          }}
        >
          <AppIcon icon={Trash2Icon} className="mr-2 h-3.5 w-3.5" />
          {t("deleteAgent")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
