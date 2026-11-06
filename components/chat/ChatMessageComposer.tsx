"use client";
import { AppIcon } from "@/components/ui/app-icon"
import { LoadingState } from "@/components/ui/loading-state"
import { ArrowUpIcon, AttachmentIcon, Mic, XIcon } from "@/lib/icons/app-icons"

import { FormEvent, ReactNode, RefObject } from "react";

import { ChatSuggestionPills } from "@/components/chat/ChatSuggestionPills";
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
  suggestionLayout?: "chips" | "stacked";
  voice?: ChatComposerVoiceSlot;
  /** Paperclip control shown in the expanded dock bar. */
  showAttach?: boolean;
  onAttach?: () => void;
  readOnly?: boolean;
  className?: string;
  suggestionsBelow?: boolean;
  /** `bar` is the wide dock launcher pill; `default` is the compact inline composer. */
  variant?: "default" | "bar";
  /** When the field is empty, keep the send arrow clickable (used to expand the dock). */
  emptyArrowOpens?: boolean;
  onFocus?: () => void;
  inputRef?: RefObject<HTMLInputElement>;
  footer?: ReactNode;
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
  suggestionLayout = "chips",
  voice,
  showAttach = false,
  onAttach,
  readOnly = false,
  className,
  suggestionsBelow = false,
  variant = "default",
  emptyArrowOpens = false,
  onFocus,
  inputRef,
  footer,
}: ChatMessageComposerProps) {
  const isDark = appearance === "dark";
  const isBar = variant === "bar";
  const isRecording = voice?.isRecording ?? false;
  const isTranscribing = voice?.isTranscribing ?? false;
  const voiceActive = isRecording || isTranscribing;
  const inputDisabled = readOnly || isBusy || voiceActive;
  const sendDisabled = readOnly || isBusy || (!canSend && !emptyArrowOpens);

  const suggestionsEl =
    showSuggestions && suggestedMessages.length > 0 ? (
      <ChatSuggestionPills
        messages={suggestedMessages}
        layout={suggestionLayout}
        appearance={appearance}
        disabled={readOnly || isBusy || voiceActive}
        onSelect={(text) => onSuggestedClick?.(text)}
        className={isBar ? "mb-2.5" : "mb-2"}
      />
    ) : null;

  const composerStyle = primaryColor
    ? ({ [primaryCssVar]: primaryColor } as React.CSSProperties)
    : undefined;

  const shellClass = cn(
    "flex items-center gap-2 rounded-full border",
    isBar
      ? "min-h-14 py-2 ps-5 pe-2 shadow-[0_4px_8px_rgba(12,10,9,0.08),0_12px_24px_-12px_rgba(12,10,9,0.38)] focus-within:border-hairline-strong"
      : "py-1.5 ps-3.5 pe-1.5",
    isDark ? "border-hairline-strong bg-[#292524]" : "border-hairline bg-surface-card",
  );

  const voiceActiveBar = voiceActive ? (
    <div
      style={composerStyle}
      className={cn(shellClass, isBar ? "min-h-14" : "min-h-10")}
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
        <LoadingState
          label={null}
          size="sm"
          className={isDark ? "text-[#fafaf9]" : "text-ink"}
        />
      )}

      <span className="min-w-0 flex-1" aria-hidden />

      {isRecording && voice?.onCancel ? (
        <button
          type="button"
          onClick={voice.onCancel}
          aria-label="Cancel recording"
          className={cn(
            "flex shrink-0 items-center justify-center rounded-full transition-colors",
            isBar ? "size-9" : "size-8",
            isDark
              ? "text-[#a8a29e] hover:bg-[#44403c] hover:text-[#fafaf9]"
              : "text-muted hover:bg-surface-strong hover:text-ink",
          )}
        >
          <AppIcon icon={XIcon} className="size-4" strokeWidth={2} />
        </button>
      ) : null}

      {isRecording ? (
        <button
          type="button"
          onClick={voice?.onClick}
          aria-label="Stop recording"
          className={cn(
            "flex shrink-0 items-center justify-center rounded-full bg-semantic-error transition-colors hover:bg-[#b91c1c]",
            isBar ? "size-9" : "size-8",
          )}
        >
          <span className="size-2.5 rounded-[2px] bg-white" aria-hidden />
        </button>
      ) : null}
    </div>
  ) : null;

  const normalForm = !voiceActive ? (
    <form onSubmit={onSubmit} style={composerStyle}>
      <div className={cn(shellClass, isBar ? "gap-2" : "gap-1")}>
        {readOnly ? (
          <span
            className={cn(
              "min-w-0 flex-1 truncate",
              isBar ? "py-2 text-[14px]" : "py-1.5 text-sm",
              isDark ? "text-[#a8a29e]" : "text-muted-soft",
            )}
          >
            {placeholder}
          </span>
        ) : (
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={onFocus}
            onClick={onFocus}
            placeholder={placeholder}
            aria-label={placeholder}
            disabled={inputDisabled}
            className={cn(
              "min-w-0 flex-1 bg-transparent outline-none disabled:opacity-50",
              isBar ? "text-[14px]" : "text-sm",
              isDark
                ? "text-[#fafaf9] placeholder:text-[#a8a29e]"
                : "text-ink placeholder:text-muted-soft",
            )}
          />
        )}

        {showAttach ? (
          <button
            type="button"
            onClick={onAttach}
            disabled={readOnly || isBusy || voiceActive}
            aria-label="Attach a file"
            title="Attach a file"
            className={cn(
              "flex shrink-0 items-center justify-center rounded-full transition-colors disabled:opacity-40",
              isBar ? "size-9" : "size-8",
              isDark
                ? "text-[#a8a29e] hover:bg-[#44403c] hover:text-[#fafaf9]"
                : "text-muted hover:bg-surface-strong hover:text-ink",
            )}
          >
            <AppIcon
              icon={AttachmentIcon}
              className={isBar ? "size-[17px]" : "size-4"}
              strokeWidth={1.75}
            />
          </button>
        ) : null}

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
              "flex shrink-0 items-center justify-center rounded-full transition-colors",
              isBar ? "size-9" : "size-8",
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
              <AppIcon icon={Mic} className={isBar ? "size-[18px]" : "size-4"} strokeWidth={1.75} />
            )}
          </button>
        ) : null}

        <button
          type="submit"
          disabled={sendDisabled}
          aria-label={canSend || !emptyArrowOpens ? "Send message" : "Open chat"}
          className={cn(
            "flex shrink-0 items-center justify-center rounded-full transition-colors",
            isBar ? "size-9" : "size-8",
            canSend
              ? primaryColor
                ? "text-white"
                : "bg-primary text-on-primary hover:bg-primary-active"
              : isBar
                ? isDark
                  ? "bg-[#44403c] text-[#a8a29e]"
                  : "bg-surface-strong text-muted-soft"
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
            <LoadingState label={null} size="sm" />
          ) : (
            <AppIcon
              icon={ArrowUpIcon}
              className={isBar ? "size-[18px]" : "size-4"}
              strokeWidth={2}
            />
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
      {footer ? <div className="mt-2">{footer}</div> : null}
    </div>
  );
}

export { formatDuration as chatComposerFormatDuration };
