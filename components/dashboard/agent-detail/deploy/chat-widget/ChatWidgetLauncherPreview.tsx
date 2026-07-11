"use client";
import { useTranslations } from "next-intl";
import { AppIcon } from "@/components/ui/app-icon"
import { MessageCircle } from "@/lib/icons/app-icons"

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
  const t = useTranslations("dashboard.deploy.generic");
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
        aria-label={t("launcherPreview")}
      >
        <AppIcon icon={MessageCircle} className="size-5" />
      </button>
    </div>
  );
}
