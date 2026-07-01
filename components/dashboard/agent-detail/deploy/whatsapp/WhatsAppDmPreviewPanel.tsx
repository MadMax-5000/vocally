"use client";

import { cn } from "@/lib/utils";

type PreviewViewport = "desktop" | "mobile";

type WhatsAppDmPreviewPanelProps = {
  viewport: PreviewViewport;
  onViewportChange: (v: PreviewViewport) => void;
  businessName: string;
};

function Bubble({
  side,
  children,
}: {
  side: "in" | "out";
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex", side === "in" ? "justify-start" : "justify-end")}>
      <div
        className={cn(
          "max-w-[78%] rounded-lg px-3 py-1.5 text-[14px] leading-snug shadow-sm",
          side === "in"
            ? "bg-white text-[#111B21]"
            : "bg-[#DCF8C6] text-[#111B21]",
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function WhatsAppDmPreviewPanel({
  viewport,
  onViewportChange,
  businessName,
}: WhatsAppDmPreviewPanelProps) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between px-6 pt-5 pb-3">
        <h3 className="text-title-sm font-medium text-ink">Preview</h3>
        <div className="inline-flex rounded-lg border border-hairline bg-canvas-soft p-0.5">
          {(["desktop", "mobile"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => onViewportChange(v)}
              className={cn(
                "rounded-md px-2.5 py-1 text-caption capitalize transition-colors",
                viewport === v
                  ? "bg-surface-card font-medium text-ink shadow-sm"
                  : "text-muted hover:text-ink",
              )}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden px-6 pb-6">
        <div className="flex min-h-0 flex-1 items-center justify-center rounded-xl bg-canvas-soft/80">
          <div
            className="flex h-full max-h-full w-auto max-w-full flex-col overflow-hidden rounded-[28px] border border-hairline shadow-[0_2px_8px_rgba(0,0,0,0.06),0_12px_32px_rgba(0,0,0,0.08)]"
            style={{
              aspectRatio: viewport === "mobile" ? "320 / 640" : "420 / 720",
            }}
          >
            <div className="flex items-center gap-3 bg-[#075E54] px-4 py-3 text-white">
              <div className="size-9 rounded-full bg-white/20" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-medium">{businessName}</p>
                <p className="text-[12px] text-white/80">online</p>
              </div>
            </div>

            <div
              className="flex min-h-0 flex-1 flex-col bg-[#E5DDD5]"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4cdc4' fill-opacity='0.35'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
              }}
            >
              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-4">
                <p className="mx-auto w-fit rounded-md bg-[#FFF9C4] px-2 py-0.5 text-[11px] font-medium text-[#54656F] shadow-sm">
                  Today
                </p>
                <Bubble side="in">Bonjour — do you support Darija and French?</Bubble>
                <Bubble side="out">
                  Yes! I can reply in Arabic (MSA or Darija), French, and English — just write in
                  your language.
                </Bubble>
                <Bubble side="in">Great. What are your business hours?</Bubble>
                <Bubble side="out">
                  We&apos;re available 9am–6pm Mon–Sat. How can I help you today?
                </Bubble>
              </div>

              <div className="flex items-center gap-2 border-t border-black/5 bg-[#F0F0F0] px-2 py-2">
                <div className="min-h-9 flex-1 rounded-full bg-white px-4 py-2 text-[14px] text-[#667781]">
                  Message
                </div>
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#075E54]">
                  <span className="sr-only">Send</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
