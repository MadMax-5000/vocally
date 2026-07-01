"use client";

import Link from "next/link";

import { AppIcon } from "@/components/ui/app-icon";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ArrowLeftIcon, Eye } from "@/lib/icons/app-icons";
import { cn } from "@/lib/utils";

import type { AgentDetailTabId, AgentDetailWithRelations } from "./agent-detail-types";
import { AgentMoreActionsMenu } from "./AgentMoreActionsMenu";
import { AgentPublishButton } from "./AgentPublishButton";
import { AgentVariablesSheet } from "./AgentVariablesSheet";
import { AgentVisibilityPill } from "./AgentVisibilityPill";

const groupedToolBtn =
  "group h-7 gap-1.5 rounded-none border-0 px-2.5 text-body-sm font-medium text-ink shadow-none hover:bg-surface-strong focus-visible:ring-0 focus-visible:ring-offset-0";

type AgentDetailTopbarProps = {
  agent: AgentDetailWithRelations;
  activeTab: AgentDetailTabId;
  onTabChange: (tab: AgentDetailTabId) => void;
};

export function AgentDetailTopbar({
  agent,
  activeTab,
  onTabChange,
}: AgentDetailTopbarProps) {
  const isPreviewActive = activeTab === "preview";

  return (
    <div className="-mx-4 bg-surface-card px-4">
      <div className="flex h-12 items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon-sm"
            className="shrink-0 text-muted hover:text-ink"
            aria-label="Back to agents"
            asChild
          >
            <Link href="/dashboard/agents">
              <AppIcon icon={ArrowLeftIcon} size={15} />
            </Link>
          </Button>

          <h1 className="truncate text-body-sm font-medium text-ink">{agent.name}</h1>
        </div>

        <div className="flex items-center gap-1.5">
          <div
            className="flex items-center overflow-hidden rounded-md border border-hairline-strong bg-surface-card shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
            role="group"
            aria-label="Agent tools"
          >
            <AgentVisibilityPill agentId={agent.id} visibility={agent.visibility} />

            <div className="h-4 w-px shrink-0 bg-hairline" aria-hidden />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={cn(
                    groupedToolBtn,
                    isPreviewActive && "bg-surface-strong",
                  )}
                  aria-pressed={isPreviewActive}
                  onClick={() => onTabChange("preview")}
                >
                  <AppIcon
                    icon={Eye}
                    className={cn(
                      "h-3.5 w-3.5 transition-colors",
                      isPreviewActive ? "text-ink" : "text-muted group-hover:text-ink",
                    )}
                  />
                  Preview
                </Button>
              </TooltipTrigger>
              <TooltipContent>Open live chat preview</TooltipContent>
            </Tooltip>

            <div className="h-4 w-px shrink-0 bg-hairline" aria-hidden />

            <AgentVariablesSheet agent={agent} />
          </div>

          <div className="mx-0.5 h-5 w-px shrink-0 bg-hairline" aria-hidden />

          <AgentPublishButton />

          <AgentMoreActionsMenu agentId={agent.id} />
        </div>
      </div>
    </div>
  );
}
