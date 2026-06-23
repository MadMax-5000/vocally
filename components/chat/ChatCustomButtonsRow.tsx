"use client";

import type { CustomButtonItem } from "@/lib/deploy/custom-button-action";
import type { WebChatWidgetAppearance } from "@/lib/deploy/web-chat-config";
import { cn } from "@/lib/utils";

type ChatCustomButtonsRowProps = {
  buttons: CustomButtonItem[];
  appearance?: WebChatWidgetAppearance;
  isBusy?: boolean;
  readOnly?: boolean;
  onMessageClick: (text: string) => void;
  className?: string;
};

export function ChatCustomButtonsRow({
  buttons,
  appearance = "light",
  isBusy = false,
  readOnly = false,
  onMessageClick,
  className,
}: ChatCustomButtonsRowProps) {
  const isDark = appearance === "dark";
  const visible = buttons.filter((b) => b.label.trim());

  if (visible.length === 0) return null;

  return (
    <div className={cn("mb-2 flex flex-wrap gap-1.5", className)}>
      {visible.map((btn, i) => (
        <button
          key={`${btn.label}-${btn.kind}-${i}`}
          type="button"
          disabled={readOnly || isBusy}
          onClick={() => {
            if (readOnly || isBusy) return;
            if (btn.kind === "message" && btn.message?.trim()) {
              onMessageClick(btn.message.trim());
              return;
            }
            if (btn.kind === "link" && btn.href?.trim()) {
              const target = btn.openInNewTab !== false ? "_blank" : "_self";
              window.open(btn.href.trim(), target, "noopener,noreferrer");
            }
          }}
          className={cn(
            "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50",
            isDark
              ? "border-hairline-strong text-[#fafaf9] hover:bg-[#292524]"
              : "border-hairline text-ink hover:bg-surface-strong",
            readOnly && "cursor-default",
          )}
        >
          {btn.label}
        </button>
      ))}
    </div>
  );
}
