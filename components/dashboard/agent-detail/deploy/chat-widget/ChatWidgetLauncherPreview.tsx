"use client";

import { MessageCircle } from "lucide-react";

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
        "relative flex min-h-[120px] items-end justify-end rounded-xl border border-dashed border-hairline bg-canvas-soft p-4",
        className,
      )}
    >
      {showPopup ? (
        <div className="absolute bottom-16 right-4 max-w-[220px] rounded-xl border border-hairline bg-surface-card px-3 py-2 text-sm shadow-md">
          <ChatMarkdown content={welcomeMessage} variant="assistant" />
        </div>
      ) : null}
      <button
        type="button"
        disabled
        className="flex size-12 items-center justify-center rounded-full text-white shadow-lg"
        style={{ backgroundColor: bubbleColor }}
        aria-label="Chat launcher preview"
      >
        <MessageCircle className="size-5" />
      </button>
    </div>
  );
}
