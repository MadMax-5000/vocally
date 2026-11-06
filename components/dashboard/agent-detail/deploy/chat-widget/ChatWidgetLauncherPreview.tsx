"use client";
import { AppIcon } from "@/components/ui/app-icon"
import { ArrowUpIcon } from "@/lib/icons/app-icons"

import { ChatMarkdown } from "@/components/chat/ChatMarkdown";
import { cn } from "@/lib/utils";

type ChatWidgetLauncherPreviewProps = {
  bubbleColor: string;
  welcomeMessage: string;
  showPopup: boolean;
  className?: string;
};

export function ChatWidgetLauncherPreview({
  bubbleColor,
  welcomeMessage,
  showPopup,
  className,
}: ChatWidgetLauncherPreviewProps) {
  return (
    <div
      className={cn(
        "relative flex min-h-[140px] items-end justify-end rounded-xl border border-dashed border-hairline bg-canvas-soft p-4",
        className,
      )}
    >
      {showPopup ? (
        <div className="absolute bottom-20 end-4 max-w-[220px] rounded-2xl border border-hairline bg-surface-card px-3 py-2 text-sm shadow-md">
          <ChatMarkdown content={welcomeMessage} variant="assistant" />
        </div>
      ) : null}
      <div className="flex w-full max-w-[300px] items-center gap-2 rounded-full border border-hairline bg-surface-card py-2 pe-2 ps-4 shadow-[0_10px_36px_rgba(12,10,9,0.12)]">
        <span className="min-w-0 flex-1 truncate text-sm text-muted-soft">
          Ask anything…
        </span>
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-full text-white"
          style={{ backgroundColor: bubbleColor }}
          aria-hidden
        >
          <AppIcon icon={ArrowUpIcon} className="size-[18px]" strokeWidth={2} />
        </span>
      </div>
    </div>
  );
}
