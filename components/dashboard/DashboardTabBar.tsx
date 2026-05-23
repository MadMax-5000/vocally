"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export type DashboardTabItem<T extends string> = {
  id: T;
  label: string;
};

type DashboardTabBarProps<T extends string> = {
  tabs: DashboardTabItem<T>[];
  activeTab: T;
  onTabChange: (tab: T) => void;
  layoutId: string;
  ariaLabel?: string;
  className?: string;
};

export function DashboardTabBar<T extends string>({
  tabs,
  activeTab,
  onTabChange,
  layoutId,
  ariaLabel = "Sections",
  className,
}: DashboardTabBarProps<T>) {
  return (
    <div
      className={cn(
        "border-b border-hairline bg-surface-card",
        className,
      )}
    >
      <nav
        className="flex overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label={ariaLabel}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className="relative shrink-0 border-none bg-transparent p-0 outline-none"
              style={{ padding: "2px 2px 8px", cursor: "pointer" }}
            >
              <span className="relative block">
                {isActive && (
                  <motion.span
                    layoutId={layoutId}
                    className="absolute inset-0 rounded-lg border border-hairline-strong bg-surface-card shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                    transition={{ type: "spring", stiffness: 400, damping: 34 }}
                  />
                )}
                <span
                  className={cn(
                    "relative block px-3 py-1 text-[13.5px] leading-[1.4] tracking-[-0.01em]",
                    isActive ? "font-medium text-ink" : "font-normal text-muted",
                  )}
                >
                  {tab.label}
                </span>
              </span>
              {isActive && (
                <motion.span
                  layoutId={`${layoutId}Indicator`}
                  className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-ink"
                  transition={{ type: "spring", stiffness: 400, damping: 34 }}
                />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
