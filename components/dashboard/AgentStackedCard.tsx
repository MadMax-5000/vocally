"use client";
import { AppIcon } from "@/components/ui/app-icon"
import { MoreHorizontal } from "@/lib/icons/app-icons"

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AgentChannelType,
  AgentStatus,
  AgentTone,
  AgentType,
  SupportedLanguage,
} from "@prisma/client";
import { archiveAgent, deleteAgent, duplicateAgent } from "@/lib/actions/agents";

import { getEnabledAgentChannelTypes } from "@/lib/deploy/web-chat-config";
import { formatRelativeCreated } from "@/lib/format/relative-created";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  TooltipProvider,
} from "@/components/ui/tooltip";
import { SidebarAgentAvatar } from "@/components/dashboard/sidebar/SidebarAgentAvatar";
import {
  AgentCardMetaFooter,
  CARD_AVATAR_SIZE,
  humanizeEnum,
} from "@/components/dashboard/agent-card-shared";

export type AgentCardData = {
  id: string;
  name: string;
  agentType: AgentType;
  tone: AgentTone;
  customRole: string | null;
  status: AgentStatus;
  channels: { channel: AgentChannelType; enabled: boolean }[];
  languages: { language: SupportedLanguage }[];
  createdAt: Date;
};

function AgentAvatarWithStatus({
  agentId,
  status,
}: {
  agentId: string;
  status: AgentStatus;
}) {
  const showActiveDot = status === "ACTIVE";

  return (
    <div
      className="relative shrink-0"
      style={{ width: CARD_AVATAR_SIZE, height: CARD_AVATAR_SIZE }}
    >
      <SidebarAgentAvatar agentId={agentId} size={CARD_AVATAR_SIZE} />
      {showActiveDot ? (
        <span
          className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full border-2 border-surface-card bg-emerald-500"
          aria-label="Active"
        />
      ) : null}
    </div>
  );
}

type AgentActionsMenuProps = {
  agent: AgentCardData;
};

function AgentActionsMenu({ agent }: AgentActionsMenuProps) {
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Agent actions"
          className="-mr-1 -mt-1 h-8 w-8 shrink-0 text-muted transition-all hover:bg-surface-strong hover:text-ink"
          onClick={(e) => e.stopPropagation()}
        >
          <AppIcon icon={MoreHorizontal} className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem asChild>
          <Link href={`/dashboard/agents/${agent.id}`}>Open</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={async (e) => {
            e.stopPropagation();
            const res = await duplicateAgent(agent.id);
            if (res.success) {
              toast.success("Agent duplicated");
              router.refresh();
            } else {
              toast.error(res.error ?? "Failed to duplicate");
            }
          }}
        >
          Duplicate Agent
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={async (e) => {
            e.stopPropagation();
            const res = await archiveAgent(agent.id);
            if (res.success) {
              toast.success(res.status === "PAUSED" ? "Agent archived" : "Agent unarchived");
              router.refresh();
            } else {
              toast.error(res.error ?? "Failed to archive");
            }
          }}
        >
          {agent.status === "PAUSED" ? "Unarchive Agent" : "Archive Agent"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={async (e) => {
            e.stopPropagation();
            const confirmed = window.confirm(
              `Are you sure you want to delete "${agent.name}"? This cannot be undone.`,
            );
            if (!confirmed) return;
            const res = await deleteAgent(agent.id);
            if (res.success) {
              toast.success("Agent deleted");
              router.refresh();
            } else {
              toast.error(res.error ?? "Failed to delete");
            }
          }}
          className="text-semantic-error focus:text-semantic-error"
        >
          Delete Agent
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <p className="pointer-events-none px-2 py-1.5 text-caption text-muted-soft">
          {formatRelativeCreated(agent.createdAt)}
        </p>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

type AgentStackedCardProps = {
  agent: AgentCardData;
  index: number;
};

export function AgentStackedCard({ agent, index }: AgentStackedCardProps) {
  const router = useRouter();

  const displayType =
    agent.agentType === "CUSTOM" && agent.customRole
      ? agent.customRole
      : humanizeEnum(agent.agentType);

  const displayTone = humanizeEnum(agent.tone);

  const enabledChannelTypes = getEnabledAgentChannelTypes(agent.channels);
  const agentLanguages = agent.languages.map((entry) => entry.language);

  return (
    <div
      className="group flex cursor-pointer flex-col rounded-xl border border-hairline bg-surface-card p-4 transition-all duration-200 hover:border-hairline-strong/70 hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)]"
      style={{ animationDelay: `${index * 45}ms` }}
      onClick={() => router.push(`/dashboard/agents/${agent.id}`)}
    >
      <div className="flex items-start gap-3">
        <AgentAvatarWithStatus agentId={agent.id} status={agent.status} />

        <div className="min-w-0 flex-1 pt-1">
          <h3 className="truncate font-display text-title-sm tracking-tight text-ink transition-colors group-hover:text-ink/90">
            {agent.name}
          </h3>
          <p className="mt-0.5 truncate text-body-sm text-muted">
            {displayType} · {displayTone}
          </p>
        </div>

        <AgentActionsMenu agent={agent} />
      </div>

      <AgentCardMetaFooter
        channelTypes={enabledChannelTypes}
        languages={agentLanguages}
      />
    </div>
  );
}

type AgentCardGridProps = {
  agents: AgentCardData[];
};

export function AgentCardGrid({ agents }: AgentCardGridProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {agents.map((agent, index) => (
          <AgentStackedCard key={agent.id} agent={agent} index={index} />
        ))}
      </div>
    </TooltipProvider>
  );
}
