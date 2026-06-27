"use client";

import { FormEvent } from "react";
import { ArrowUp, Mic, X } from "lucide-react";

import type { WebChatWidgetAppearance } from "@/lib/deploy/web-chat-config";
import { cn } from "@/lib/utils";

export type ChatComposerVoiceSlot = {
  show: boolean;
  disabled?: boolean;
  comingSoon?: boolean;
  onClick?: () => void;
  onCancel?: () => void;
  isRecording?: boolean;
  isTranscribing?: boolean;
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

function ComposerDots({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-0.5", className)}>
      <span className="size-1 animate-bounce rounded-full bg-current opacity-70" />
      <span className="size-1 animate-bounce rounded-full bg-current opacity-70 [animation-delay:0.1s]" />
      <span className="size-1 animate-bounce rounded-full bg-current opacity-70 [animation-delay:0.2s]" />
    </span>
  );
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
  const isRecording = voice?.isRecording ?? false;
  const isTranscribing = voice?.isTranscribing ?? false;
  const voiceActive = isRecording || isTranscribing;
  const inputDisabled = readOnly || isBusy || voiceActive;

  const suggestionsEl =
    showSuggestions && visibleSuggestions.length > 0 ? (
      <div className="mb-2 flex flex-wrap gap-1.5">
        {visibleSuggestions.map((text, i) => (
          <button
            key={`${text}-${i}`}
            type="button"
            onClick={() => onSuggestedClick?.(text)}
            disabled={readOnly || isBusy || voiceActive}
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

  const shellClass = cn(
    "flex items-center gap-2 rounded-full border py-1.5 pl-3.5 pr-1.5",
    isDark ? "border-hairline-strong bg-[#292524]" : "border-hairline bg-surface-card",
  );

  const voiceActiveBar = voiceActive ? (
    <div
      style={composerStyle}
      className={cn(shellClass, "min-h-10")}
      role="status"
      aria-live="polite"
      aria-label={isRecording ? "Recording" : "Processing recording"}
    >
      <span className="relative flex size-2 shrink-0">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-semantic-error opacity-40" />
        <span className="relative inline-flex size-2 rounded-full bg-semantic-error" />
      </span>

      {isRecording ? (
        <span
          className={cn(
            "shrink-0 text-xs font-medium tabular-nums",
            isDark ? "text-[#fafaf9]" : "text-ink",
          )}
        >
          {voice?.recordingLabel ?? formatDuration(0)}
        </span>
      ) : (
        <ComposerDots className={isDark ? "text-[#fafaf9]" : "text-ink"} />
      )}

      <span className="min-w-0 flex-1" aria-hidden />

      {isRecording && voice?.onCancel ? (
        <button
          type="button"
          onClick={voice.onCancel}
          aria-label="Cancel recording"
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-full transition-colors",
            isDark
              ? "text-[#a8a29e] hover:bg-[#44403c] hover:text-[#fafaf9]"
              : "text-muted hover:bg-surface-strong hover:text-ink",
          )}
        >
          <X className="size-4" strokeWidth={2} />
        </button>
      ) : null}

      {isRecording ? (
        <button
          type="button"
          onClick={voice?.onClick}
          aria-label="Stop recording"
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-semantic-error transition-colors hover:bg-[#b91c1c]"
        >
          <span className="size-2.5 rounded-[2px] bg-white" aria-hidden />
        </button>
      ) : null}
    </div>
  ) : null;

  const normalForm = !voiceActive ? (
    <form onSubmit={onSubmit} style={composerStyle}>
      <div className={cn(shellClass, "gap-1 pl-3.5")}>
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
            disabled={inputDisabled}
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
            disabled={readOnly || voice.disabled || voice.comingSoon}
            aria-label={
              voice.comingSoon ? "Voice to text (coming soon)" : "Start voice input"
            }
            title={voice.comingSoon ? "Voice to text (coming soon)" : undefined}
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-full transition-colors",
              voice.comingSoon || voice.disabled
                ? "text-muted opacity-50"
                : isDark
                  ? "text-[#a8a29e] hover:bg-[#44403c] hover:text-[#fafaf9]"
                  : "text-muted hover:bg-surface-strong hover:text-ink",
            )}
          >
            {voice.isPlaying ? (
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
            <ComposerDots />
          ) : (
            <ArrowUp className="size-4" strokeWidth={2} />
          )}
        </button>
      </div>
    </form>
  ) : null;

  return (
    <div className={className}>
      {!suggestionsBelow && suggestionsEl}
      {voiceActiveBar ?? normalForm}
      {suggestionsBelow && suggestionsEl}
    </div>
  );
}

export { formatDuration as chatComposerFormatDuration };
