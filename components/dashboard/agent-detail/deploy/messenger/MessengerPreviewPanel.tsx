"use client";

import { useMemo } from "react";

import type { AgentMessengerSettings } from "@/lib/actions/messenger-connection";
import { cn } from "@/lib/utils";

type Props = {
  agentName: string;
  settings: AgentMessengerSettings;
};

function nowTime(): string {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}

function Bubble({
  side,
  children,
}: {
  side: "in" | "out";
  children: React.ReactNode;
}) {
  const isOut = side === "out";
  return (
    <div className={cn("flex", isOut ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[78%] rounded-2xl px-3 py-2 text-body-sm leading-relaxed",
          isOut
            ? "bg-[#0A84FF] text-white"
            : "bg-surface-card text-ink border border-hairline",
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function MessengerPreviewPanel({ agentName, settings }: Props) {
  const pageName = settings.connection?.pageName ?? "Your Facebook Page";
  const sampleUser = "Customer";

  const transcript = useMemo(
    () => [
      { side: "in" as const, text: "Hi — do you have this in stock?" },
      { side: "out" as const, text: `Yes — I can help with that. What item are you looking for?` },
      { side: "in" as const, text: "The black hoodie, size M." },
      { side: "out" as const, text: `Got it. Let me check availability for black hoodie (M).` },
    ],
    [],
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between px-6 pt-5 pb-3">
        <h3 className="text-title-sm font-medium text-ink">Preview</h3>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden px-6 pb-6">
        <div className="flex min-h-0 flex-1 items-center justify-center rounded-xl bg-canvas-soft/80 p-6">
          <div className="flex h-full min-h-0 w-full max-w-[420px] flex-col overflow-hidden rounded-[22px] border border-hairline bg-surface-card shadow-[0_2px_8px_rgba(0,0,0,0.06),0_12px_32px_rgba(0,0,0,0.08)]">
            <div className="shrink-0 border-b border-hairline bg-surface-card px-4 py-3">
              <p className="text-body-sm font-medium text-ink">{pageName}</p>
              <p className="text-caption text-muted">
                Replying as <span className="text-ink">{agentName}</span>
              </p>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto bg-canvas-soft/40 px-3 py-3">
              <p className="mb-3 text-center text-[11px] text-muted-soft">
                {sampleUser} • Today • {nowTime()}
              </p>
              <div className="space-y-2">
                {transcript.map((m, idx) => (
                  <Bubble key={idx} side={m.side}>
                    {m.text}
                  </Bubble>
                ))}
              </div>
            </div>

            <div className="shrink-0 border-t border-hairline bg-surface-card px-3 py-3">
              <div className="flex items-center gap-2 rounded-full border border-hairline bg-canvas-soft/60 px-3 py-2">
                <span className="text-caption text-muted">Message…</span>
                <span className="ml-auto text-caption text-muted-soft">↩</span>
              </div>
              <p className="mt-2 text-center text-[11px] text-muted-soft">
                Preview only — real replies are sent via your Page connection.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

