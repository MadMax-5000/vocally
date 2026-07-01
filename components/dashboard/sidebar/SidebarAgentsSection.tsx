"use client";
import { AppIcon } from "@/components/ui/app-icon"
import { MoreHorizontal, PlusIcon } from "@/lib/icons/app-icons"

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { AgentIcon } from "@/components/ui/icons";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { getSidebarAgentsList, type SidebarAgentListItem } from "@/lib/actions/agents";
import { cn } from "@/lib/utils";
import { ConversationIcon } from "./ConversationIcon";
import { SidebarAgentAvatar } from "./SidebarAgentAvatar";

const RECENT_AGENT_LIMIT = 3;
const POPOVER_AGENT_LIMIT = 5;

function AgentSidebarLink({
  agent,
  isActive,
}: {
  agent: SidebarAgentListItem;
  isActive: boolean;
}) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive} tooltip={agent.name}>
        <Link href={`/dashboard/agents/${agent.id}`}>
          <SidebarAgentAvatar agentId={agent.id} />
          <span className="truncate">{agent.name}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function AgentsMorePopover({
  agents,
  disabled,
}: {
  agents: SidebarAgentListItem[];
  disabled?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const searchRef = React.useRef<HTMLTextAreaElement>(null);
  const closeTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return agents.slice(0, POPOVER_AGENT_LIMIT);
    return agents.filter((a) => a.name.toLowerCase().includes(q)).slice(0, POPOVER_AGENT_LIMIT);
  }, [query, agents]);

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const scheduleClose = () => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => setOpen(false), 120);
  };

  React.useEffect(() => {
    return () => clearCloseTimer();
  }, []);

  React.useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }
    const timer = setTimeout(() => searchRef.current?.focus(), 0);
    return () => clearTimeout(timer);
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          onMouseEnter={() => {
            clearCloseTimer();
            setOpen(true);
          }}
          onMouseLeave={scheduleClose}
          onClick={() => router.push("/dashboard/agents")}
          className={cn(
            "flex h-8 w-full items-center gap-2 rounded-md px-2 text-[13px] text-muted transition-colors",
            "hover:bg-surface-strong",
            "focus-visible:outline-none focus-visible:ring-0",
            "disabled:pointer-events-none disabled:opacity-50",
            pathname === "/dashboard/agents" || pathname.startsWith("/dashboard/agents/")
              ? "bg-surface-strong"
              : undefined,
          )}
        >
          <AppIcon icon={MoreHorizontal} className="h-4 w-4 shrink-0 text-muted" />
          <span className="text-muted">More</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="right"
        align="start"
        sideOffset={8}
        className="w-[260px] gap-0 rounded-lg border border-hairline bg-surface-card p-0 shadow-md ring-0"
        onMouseEnter={clearCloseTimer}
        onMouseLeave={scheduleClose}
      >
        <div className="border-b border-hairline px-1.5 py-1">
          <div className="mb-1 px-0.5 pt-0.5">
            <Textarea
              ref={searchRef}
              placeholder="Search agents…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              rows={1}
              aria-label="Search agents"
              className="min-h-0 resize-none border-0 bg-transparent p-0 text-body-md placeholder:text-muted-soft shadow-none focus-visible:border-0 focus-visible:ring-0"
            />
          </div>
        </div>
        <ul className="max-h-[240px] overflow-y-auto py-0.5">
          {filtered.length === 0 ? (
            <li className="px-2 py-4 text-center text-[12px] text-muted">No agents found.</li>
          ) : (
            filtered.map((agent) => {
              const active =
                pathname === `/dashboard/agents/${agent.id}` ||
                pathname.startsWith(`/dashboard/agents/${agent.id}/`);
              return (
                <li key={agent.id}>
                  <Link
                    href={`/dashboard/agents/${agent.id}`}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-2 px-2 py-1.5 transition-colors hover:bg-canvas-soft",
                      active && "bg-surface-strong",
                    )}
                  >
                    <SidebarAgentAvatar agentId={agent.id} />
                    <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-ink">
                      {agent.name}
                    </span>
                    {agent.hasSessions ? (
                      <span
                        className="flex shrink-0 items-center gap-0.5 text-[11px] tabular-nums text-muted"
                        aria-label={`${agent.activeSessionCount} active conversations`}
                      >
                        <ConversationIcon className="text-muted" />
                        <span>{agent.activeSessionCount}</span>
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })
          )}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

export function SidebarAgentsSection() {
  const pathname = usePathname();
  const { state, isMobile, openMobile } = useSidebar();
  const [agents, setAgents] = React.useState<SidebarAgentListItem[]>([]);

  const isExpanded = isMobile ? openMobile : state === "expanded";

  React.useEffect(() => {
    getSidebarAgentsList().then((res) => {
      if (res.success) setAgents(res.data);
    });
  }, [pathname]);

  const recentAgents = agents.slice(0, RECENT_AGENT_LIMIT);

  const agentsNavActive =
    pathname === "/dashboard/agents" || pathname.startsWith("/dashboard/agents/");

  return (
    <div className={cn("flex flex-col", isExpanded && "py-1")}>
      {isExpanded ? <Separator className="mb-2" /> : null}
      <SidebarGroup className="py-0">
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={agentsNavActive} tooltip="Agents">
                <Link href="/dashboard/agents">
                  <AgentIcon />
                  <span>Agents</span>
                </Link>
              </SidebarMenuButton>
              {isExpanded ? (
                <SidebarMenuAction asChild>
                  <Link href="/dashboard/agents/new" aria-label="Create agent">
                    <AppIcon icon={PlusIcon} className="h-3.5 w-3.5" />
                  </Link>
                </SidebarMenuAction>
              ) : null}
            </SidebarMenuItem>
            {isExpanded
              ? recentAgents.map((agent) => (
                  <AgentSidebarLink
                    key={agent.id}
                    agent={agent}
                    isActive={
                      pathname === `/dashboard/agents/${agent.id}` ||
                      pathname.startsWith(`/dashboard/agents/${agent.id}/`)
                    }
                  />
                ))
              : null}
            {isExpanded ? (
              <SidebarMenuItem>
                <AgentsMorePopover agents={agents} />
              </SidebarMenuItem>
            ) : null}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
      {isExpanded ? <Separator className="mt-2" /> : null}
    </div>
  );
}
