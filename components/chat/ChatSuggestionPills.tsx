"use client";

import type { WebChatWidgetAppearance } from "@/lib/deploy/web-chat-config";
import { cn } from "@/lib/utils";

export type ChatSuggestionPillsLayout = "chips" | "stacked" | "floating";

type ChatSuggestionPillsProps = {
  messages: string[];
  onSelect: (text: string) => void;
  layout?: ChatSuggestionPillsLayout;
  appearance?: WebChatWidgetAppearance;
  disabled?: boolean;
  className?: string;
};

/**
 * Suggested-message pills. `chips` is the compact wrap used inside the
 * composer; `stacked` matches the dock launcher's stacked prompt rows.
 */
export function ChatSuggestionPills({
  messages,
  onSelect,
  layout = "chips",
  appearance = "light",
  disabled = false,
  className,
}: ChatSuggestionPillsProps) {
  const isDark = appearance === "dark";
  const visible = messages.filter((message) => message.trim());

  if (visible.length === 0) return null;

  if (layout === "floating") {
    return (
      <div className={cn("flex flex-col items-start gap-2", className)}>
        {visible.map((text, index) => (
          <button
            key={`${text}-${index}`}
            type="button"
            dir="auto"
            onClick={() => onSelect(text)}
            disabled={disabled}
            className="inline-flex h-[34px] max-w-full items-center truncate rounded-full border border-white/15 bg-[rgba(118,110,104,0.9)] px-4 text-start text-[13px] font-medium leading-[18px] text-white shadow-[0_6px_18px_-10px_rgba(12,10,9,0.65)] backdrop-blur-md transition-colors hover:bg-[rgba(94,87,82,0.94)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/45 disabled:opacity-50"
          >
            {text}
          </button>
        ))}
      </div>
    );
  }

  if (layout === "stacked") {
    return (
      <div className={cn("flex flex-col items-start gap-2", className)}>
        {visible.map((text, index) => (
          <button
            key={`${text}-${index}`}
            type="button"
            dir="auto"
            onClick={() => onSelect(text)}
            disabled={disabled}
            className={cn(
              "max-w-full rounded-full px-4 py-2.5 text-start text-sm font-medium leading-snug transition-colors disabled:opacity-50",
              isDark
                ? "bg-[#292524] text-[#fafaf9] hover:bg-[#44403c]"
                : "bg-surface-strong text-ink hover:bg-surface-card hover:ring-1 hover:ring-hairline",
            )}
          >
            {text}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {visible.map((text, index) => (
        <button
          key={`${text}-${index}`}
          type="button"
          dir="auto"
          onClick={() => onSelect(text)}
          disabled={disabled}
          className={cn(
            "rounded-full border px-2.5 py-1 text-xs transition-colors disabled:opacity-50",
            isDark
              ? "border-hairline-strong text-[#fafaf9] hover:bg-[#292524]"
              : "border-hairline text-ink hover:bg-surface-strong",
          )}
        >
          {text}
        </button>
      ))}
    </div>
  );
}
