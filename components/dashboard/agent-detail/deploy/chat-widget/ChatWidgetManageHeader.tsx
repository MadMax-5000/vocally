"use client";
import { AppIcon } from "@/components/ui/app-icon"
import { ArrowLeftIcon } from "@/lib/icons/app-icons"

import Link from "next/link";
import { useMemo } from "react";

import { DashboardTabBar, type DashboardTabItem } from "@/components/dashboard/DashboardTabBar";
import { Switch } from "@/components/ui/switch";

import type { ChatWidgetConfigTabId } from "./ChatWidgetConfigTabs";

type ChatWidgetManageHeaderProps = {
  agentId: string;
  activeTab: ChatWidgetConfigTabId;
  onTabChange: (tab: ChatWidgetConfigTabId) => void;
  webChatEnabled: boolean;
  toggling: boolean;
  onWebChatEnabledChange: (enabled: boolean) => void;
};

export function ChatWidgetManageHeader({
  agentId,
  activeTab,
  onTabChange,
  webChatEnabled,
  toggling,
  onWebChatEnabledChange,
}: ChatWidgetManageHeaderProps) {
  const tabs = useMemo((): DashboardTabItem<ChatWidgetConfigTabId>[] => {
    const items: DashboardTabItem<ChatWidgetConfigTabId>[] = [
      { id: "content", label: "Content" },
      { id: "style", label: "Style" },
    ];
    if (webChatEnabled) {
      items.push({ id: "embed", label: "Embed" });
    }
    return items;
  }, [webChatEnabled]);

  return (
    <header className="sticky top-0 z-10 shrink-0 border-b border-hairline bg-surface-card">
      <div className="px-4 pt-3">
        <Link
          href={`/dashboard/agents/${agentId}?tab=deploy`}
          className="mb-3 inline-flex items-center gap-1.5 text-body-sm text-muted transition-colors hover:text-ink"
        >
          <AppIcon icon={ArrowLeftIcon} className="size-3.5" />
          Back to Deploy
        </Link>

        <div className="flex items-start justify-between gap-4 pb-3">
          <div className="min-w-0">
            <h1 className="font-display text-display-sm font-normal tracking-tight text-ink">
              Chat widget
            </h1>
          </div>
          <div className="flex shrink-0 items-center gap-2 pt-1">
            <span className="text-caption text-muted">
              {webChatEnabled ? "Enabled" : "Disabled"}
            </span>
            <Switch
              checked={webChatEnabled}
              disabled={toggling}
              onCheckedChange={onWebChatEnabledChange}
              aria-label="Enable chat widget"
            />
          </div>
        </div>
      </div>

      <DashboardTabBar
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={onTabChange}
        layoutId="chatWidgetManageTab"
        ariaLabel="Chat widget configuration"
        className="px-4"
      />
    </header>
  );
}
