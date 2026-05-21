"use client";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { AgentDetailTabId, AgentDetailWithRelations } from "./agent-detail-types";
import { AgentDetailAgentTab } from "./AgentDetailAgentTab";
import { AgentDetailAnalyticsTab } from "./AgentDetailAnalyticsTab";
import { AgentDetailKnowledgeTab } from "./AgentDetailKnowledgeTab";
import { AgentDetailPreviewTab } from "./AgentDetailPreviewTab";
import { AgentDetailWidgetTab } from "./AgentDetailWidgetTab";

const TAB_CONFIG: { id: AgentDetailTabId; label: string }[] = [
  { id: "preview", label: "Preview" },
  { id: "agent", label: "Agent" },
  { id: "knowledge", label: "Knowledge Base" },
  { id: "widget", label: "Widget" },
  { id: "security", label: "Security" },
  { id: "tests", label: "Tests" },
  { id: "advanced", label: "Advanced" },
];

type AgentDetailTabsProps = {
  agent: AgentDetailWithRelations;
  activeTab: AgentDetailTabId;
  onTabChange: (tab: AgentDetailTabId) => void;
};

function TabPlaceholder({ label }: { label: string }) {
  return (
    <div className="flex min-h-[220px] items-center justify-center rounded-xl border border-dashed border-hairline bg-canvas-soft px-6 py-16">
      <p className="text-center text-body-sm text-muted">Coming soon — {label}</p>
    </div>
  );
}

export function AgentDetailTabs({
  agent,
  activeTab,
  onTabChange,
}: AgentDetailTabsProps) {
  const activeLabel = TAB_CONFIG.find((t) => t.id === activeTab)?.label ?? "";

  return (
    <div className="flex flex-col">
      {/* Tab bar — flush to card edges, white bg, single bottom border */}
      <div
        className="-mx-4 -mt-1 px-4"
        style={{
          backgroundColor: "#ffffff",
          borderBottom: "1px solid #e5e7eb", // zinc-200 equivalent
        }}
      >
        <nav
          className="flex overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="Agent sections"
        >
          {TAB_CONFIG.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className="relative shrink-0 transition-colors"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  outline: "none",
                  padding: "2px 2px 8px",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).querySelector<HTMLSpanElement>(".tab-label")!.style.color = "#374151";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).querySelector<HTMLSpanElement>(".tab-label")!.style.color = "#6b7280";
                  }
                }}
              >
                {/* Pill wrapper — animates shared layout */}
                <span className="relative block">
                  {isActive && (
                    <motion.span
                      layoutId="agentDetailTabPill"
                      className="absolute inset-0 rounded-lg"
                      style={{
                        border: "1px solid #d1d5db",
                        backgroundColor: "#ffffff",
                        boxShadow: "0 1px 2px 0 rgba(0,0,0,0.04)",
                      }}
                      transition={{ type: "spring", stiffness: 400, damping: 34 }}
                    />
                  )}
                  <span
                    className="tab-label relative block px-3 py-1"
                    style={{
                      fontSize: "13.5px",
                      fontWeight: isActive ? 500 : 400,
                      color: isActive ? "#111827" : "#6b7280",
                      lineHeight: "1.4",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {tab.label}
                  </span>
                </span>

                {/* Underline beneath the active pill */}
                {isActive && (
                  <motion.span
                    layoutId="agentDetailTabIndicator"
                    className="absolute inset-x-2 -bottom-px h-0.5 rounded-full"
                    style={{ backgroundColor: "#111827" }}
                    transition={{ type: "spring", stiffness: 400, damping: 34 }}
                  />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab content with fade+slide transition */}
      <div className="pt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.14 }}
          >
            {activeTab === "agent" ? (
              <AgentDetailAgentTab agent={agent} />
            ) : activeTab === "analysis" ? (
              <AgentDetailAnalyticsTab agentId={agent.id} />
            ) : activeTab === "knowledge" ? (
              <AgentDetailKnowledgeTab agentId={agent.id} />
            ) : activeTab === "preview" ? (
              <AgentDetailPreviewTab agent={agent} />
            ) : activeTab === "widget" ? (
              <AgentDetailWidgetTab agent={agent} />
            ) : (
              <TabPlaceholder label={activeLabel} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}