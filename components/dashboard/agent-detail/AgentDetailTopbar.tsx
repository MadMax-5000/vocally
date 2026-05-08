"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";

import type { AgentDetailWithRelations } from "./agent-detail-types";
import { AgentMoreActionsMenu } from "./AgentMoreActionsMenu";
import { AgentPublishButton } from "./AgentPublishButton";
import { AgentVariablesSheet } from "./AgentVariablesSheet";
import { AgentVisibilityPill } from "./AgentVisibilityPill";

type AgentDetailTopbarProps = {
  agent: AgentDetailWithRelations;
};

export function AgentDetailTopbar({ agent }: AgentDetailTopbarProps) {
  return (
    <div
      className="-mx-4 px-4"
      style={{
        backgroundColor: "#ffffff",
      }}
    >
      <div className="flex h-12 items-center justify-between gap-3">

        {/* Left — back chevron + agent name */}
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <Link href="/dashboard/agents">
            <button
              aria-label="Back to agents"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 28,
                height: 28,
                borderRadius: 8,
                border: "none",
                background: "none",
                cursor: "pointer",
                color: "#9ca3af",
                flexShrink: 0,
                transition: "background 0.15s, color 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "#f3f4f6";
                (e.currentTarget as HTMLButtonElement).style.color = "#111827";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "none";
                (e.currentTarget as HTMLButtonElement).style.color = "#9ca3af";
              }}
            >
              <ArrowLeft style={{ width: 15, height: 15 }} />
            </button>
          </Link>

          <h1
            className="truncate"
            style={{
              fontSize: "13.5px",
              fontWeight: 500,
              color: "#111827",
              letterSpacing: "-0.01em",
              lineHeight: 1.4,
            }}
          >
            {agent.name}
          </h1>
        </div>

        {/* Right — action row */}
        <div className="flex items-center gap-1.5">
          <AgentVisibilityPill agentId={agent.id} visibility={agent.visibility} />

          <div
            style={{
              width: 1,
              height: 16,
              backgroundColor: "#e5e7eb",
              margin: "0 2px",
              flexShrink: 0,
            }}
          />

          <AgentVariablesSheet agent={agent} />

          {/* Preview — muted ghost */}
          <button
            type="button"
            disabled
            style={{
              height: 28,
              padding: "0 10px",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              background: "#ffffff",
              fontSize: 13,
              fontWeight: 400,
              color: "#9ca3af",
              cursor: "not-allowed",
              letterSpacing: "-0.01em",
              lineHeight: 1,
              opacity: 0.7,
            }}
          >
            Preview
          </button>

          <AgentPublishButton agentId={agent.id} />
          <AgentMoreActionsMenu agentId={agent.id} />
        </div>
      </div>
    </div>
  );
}