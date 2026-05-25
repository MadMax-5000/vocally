"use client";

import { FormEvent } from "react";
import { ArrowUp, Mic } from "lucide-react";

import type { WebChatWidgetAppearance } from "@/lib/deploy/web-chat-config";
import { cn } from "@/lib/utils";

export type ChatComposerVoiceSlot = {
  show: boolean;
  disabled?: boolean;
  comingSoon?: boolean;
  onClick?: () => void;
  isRecording?: boolean;
  recordingLabel?: string;
  isPlaying?: boolean;
};

export type ChatMessageComposerProps = {
  appearance?: WebChatWidgetAppearance;
  primaryColor?: string;
  primaryCssVar?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
  isBusy?: boolean;
  canSend?: boolean;
  suggestedMessages?: string[];
  onSuggestedClick?: (text: string) => void;
  showSuggestions?: boolean;
  voice?: ChatComposerVoiceSlot;
  readOnly?: boolean;
  className?: string;
  suggestionsBelow?: boolean;
};

function formatDuration(ms: number): string {
  const secs = Math.floor(ms / 1000);
  const mins = Math.floor(secs / 60);
  const s = secs % 60;
  return `${mins}:${s.toString().padStart(2, "0")}`;
}

export function ChatMessageComposer({
  appearance = "light",
  primaryColor,
  primaryCssVar = "--widget-primary",
  placeholder = "Message...",
  value,
  onChange,
  onSubmit,
  isBusy = false,
  canSend = false,
  suggestedMessages = [],
  onSuggestedClick,
  showSuggestions = true,
  voice,
  readOnly = false,
  className,
  suggestionsBelow = false,
}: ChatMessageComposerProps) {
  const isDark = appearance === "dark";
  const visibleSuggestions = suggestedMessages.filter((s) => s.trim());

  const suggestionsEl =
    showSuggestions && visibleSuggestions.length > 0 ? (
      <div className="mb-2 flex flex-wrap gap-1.5">
        {visibleSuggestions.map((text, i) => (
          <button
            key={`${text}-${i}`}
            type="button"
            onClick={() => onSuggestedClick?.(text)}
            disabled={readOnly || isBusy}
            className={cn(
              "rounded-full border px-2.5 py-1 text-xs transition-colors disabled:opacity-50",
              isDark
                ? "border-hairline-strong text-[#fafaf9] hover:bg-[#292524]"
                : "border-hairline text-ink hover:bg-surface-strong",
              readOnly && "cursor-default",
            )}
          >
            {text}
          </button>
        ))}
      </div>
    ) : null;

  const composerStyle = primaryColor
    ? ({ [primaryCssVar]: primaryColor } as React.CSSProperties)
    : undefined;

  const form = (
    <form onSubmit={onSubmit} style={composerStyle}>
      <div
        className={cn(
          "flex items-center gap-1 rounded-full border py-1 pl-3.5 pr-1.5",
          isDark
            ? "border-hairline-strong bg-[#292524]"
            : "border-hairline bg-surface-card",
        )}
      >
        {readOnly ? (
          <span
            className={cn(
              "min-w-0 flex-1 py-1.5 text-sm",
              isDark ? "text-[#a8a29e]" : "text-muted-soft",
            )}
          >
            {placeholder}
          </span>
        ) : (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={isBusy}
            className={cn(
              "min-w-0 flex-1 bg-transparent text-sm outline-none disabled:opacity-50",
              isDark
                ? "text-[#fafaf9] placeholder:text-[#a8a29e]"
                : "text-ink placeholder:text-muted-soft",
            )}
          />
        )}

        {voice?.show ? (
          <button
            type="button"
            onClick={voice.onClick}
            disabled={readOnly || voice.disabled || isBusy}
            aria-label={
              voice.comingSoon
                ? "Voice to text (coming soon)"
                : voice.isRecording
                  ? "Stop recording"
                  : "Start voice input"
            }
            title={voice.comingSoon ? "Voice to text (coming soon)" : undefined}
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-full transition-colors",
              voice.isRecording
                ? "bg-error text-white"
                : voice.comingSoon || voice.disabled
                  ? "text-muted opacity-50"
                  : "text-muted hover:text-ink disabled:opacity-50",
            )}
          >
            {voice.isRecording && voice.recordingLabel ? (
              <span className="text-[10px] font-medium tabular-nums">
                {voice.recordingLabel}
              </span>
            ) : voice.isPlaying ? (
              <span className="text-[10px] font-medium">▮▮</span>
            ) : (
              <Mic className="size-4" strokeWidth={1.75} />
            )}
          </button>
        ) : null}

        <button
          type="submit"
          disabled={readOnly || !canSend}
          aria-label="Send message"
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-full transition-colors",
            canSend
              ? primaryColor
                ? "text-white"
                : "bg-primary text-on-primary hover:bg-primary-active"
              : isDark
                ? "bg-[#44403c] text-[#a8a29e]"
                : "bg-surface-strong text-muted-soft",
          )}
          style={
            canSend && primaryColor
              ? { backgroundColor: `var(${primaryCssVar})` }
              : undefined
          }
        >
          {isBusy ? (
            <span className="flex items-center gap-0.5">
              <span className="size-1 animate-bounce rounded-full bg-current opacity-70" />
              <span className="size-1 animate-bounce rounded-full bg-current opacity-70 [animation-delay:0.1s]" />
              <span className="size-1 animate-bounce rounded-full bg-current opacity-70 [animation-delay:0.2s]" />
            </span>
          ) : (
            <ArrowUp className="size-4" strokeWidth={2} />
          )}
        </button>
      </div>
    </form>
  );

  return (
    <div className={className}>
      {!suggestionsBelow && suggestionsEl}
      {form}
      {suggestionsBelow && suggestionsEl}
    </div>
  );
}

export { formatDuration as chatComposerFormatDuration };
