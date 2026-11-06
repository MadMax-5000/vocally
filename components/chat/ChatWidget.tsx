"use client";
import { AppIcon } from "@/components/ui/app-icon"
import {
  ArrowUpIcon,
  ChevronDown,
  PlusIcon,
  RefreshCwIcon,
  XIcon,
} from "@/lib/icons/app-icons"

import Image from "next/image";
import {
  ChangeEvent,
  FormEvent,
  ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";

import { ChatCustomButtonsRow } from "@/components/chat/ChatCustomButtonsRow";
import { ChatInlineForm } from "@/components/chat/ChatInlineForm";
import { ChatMarkdown } from "@/components/chat/ChatMarkdown";
import {
  ChatMessageComposer,
  chatComposerFormatDuration,
} from "@/components/chat/ChatMessageComposer";
import { ChatSuggestionPills } from "@/components/chat/ChatSuggestionPills";
import { ChatTypewriterQuestion } from "@/components/chat/ChatTypewriterQuestion";
import { PoweredByAnselio } from "@/components/chat/PoweredByAnselio";
import { LoadingState } from "@/components/ui/loading-state";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useChat, type ChatMessage } from "@/hooks/useChat";
import { useVoiceToText } from "@/hooks/useVoiceToText";
import { getOrCreateVisitorId } from "@/lib/chat/visitor-id";
import { getVisibleCustomButtons } from "@/lib/deploy/custom-button-action";
import type {
  ResolvedCustomButtonAction,
  ResolvedSuggestedMessagesAction,
  WebChatWidgetAppearance,
} from "@/lib/deploy/web-chat-config";
import {
  getInitialSuggestedMessages,
  shouldShowSuggestedMessages,
} from "@/lib/deploy/suggested-messages-action";
import { cn } from "@/lib/utils";

const DOCK_PANEL_HEIGHT = 440;
const DOCK_MAX_SUGGESTIONS = 3;
const DOCK_COLLAPSED_TEXT_PADDING = 84;
const DOCK_COLLAPSED_MIN_WIDTH = 340;

export type ChatHistoryLabels = {
  title: string;
  newConversation: string;
  empty: string;
  loading: string;
  error: string;
};

const DEFAULT_HISTORY_LABELS: ChatHistoryLabels = {
  title: "Conversations",
  newConversation: "New conversation",
  empty: "No conversations yet",
  loading: "Loading conversations…",
  error: "Could not load conversations.",
};

type ConversationSummary = {
  id: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
};

function formatConversationTime(iso: string): string {
  const timestamp = new Date(iso).getTime();
  if (Number.isNaN(timestamp)) return "";

  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60_000));
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;

  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

type ChatWidgetProps = {
  agentId: string;
  widgetToken?: string;
  agentName?: string;
  welcomeMessage?: string;
  className?: string;
  initialMessages?: ChatMessage[];
  initialSessionId?: string;
  /** Pass `true` or a handler to show the refresh control (dashboard preview). */
  onClear?: boolean | (() => void);
  /** Called when Escape should return the dock card to the launcher. */
  onMinimize?: () => void;
  showPoweredBy?: boolean;
  appearance?: WebChatWidgetAppearance;
  primaryColor?: string;
  /** Accent for the dock composer (send arrow); defaults to `primaryColor`. */
  launcherAccentColor?: string;
  placeholder?: string;
  suggestedMessagesAction?: ResolvedSuggestedMessagesAction;
  customButtonsAction?: ResolvedCustomButtonAction;
  deployment?: "widget" | "help";
  onSuggestedClick?: (message: string) => void;
  customButtonsReadOnly?: boolean;
  voiceToTextEnabled?: boolean;
  context?: string;
  /** Dock layout: the launcher bar and glass conversation card share one anchor. */
  dock?: boolean;
  /** Narrow single-pill launcher state. */
  collapsed?: boolean;
  /** Whether the glass conversation card is open. Defaults to `!collapsed`. */
  panelOpen?: boolean;
  onExpand?: () => void;
  /** Called the first time a message is sent so the parent can reveal the card. */
  onOpenPanel?: () => void;
  /** Collapse the expanded launcher back to the single pill. */
  onCollapse?: () => void;
  /** Reports the intrinsic width of the collapsed question pill. */
  onDockWidthChange?: (width: number) => void;
  /** Expanded panel height in dock mode. */
  panelHeight?: number;
  /** Rendered under the dock composer only while the launcher is expanded. */
  privacyNote?: ReactNode;
  /** Brand mark shown in the glass card header. Defaults to the dot grid. */
  brandLogo?: string;
  /** Localized copy for the dock conversation-history menu. */
  historyLabels?: ChatHistoryLabels;
};

export function ChatWidget({
  agentId,
  widgetToken,
  agentName = "AI Assistant",
  welcomeMessage = "Hello! How can I help you today?",
  className = "",
  initialMessages,
  initialSessionId,
  onClear,
  onMinimize,
  showPoweredBy = true,
  appearance = "light",
  primaryColor,
  launcherAccentColor,
  placeholder = "Message...",
  suggestedMessagesAction,
  customButtonsAction,
  deployment = "widget",
  onSuggestedClick,
  customButtonsReadOnly,
  voiceToTextEnabled = false,
  context,
  dock = false,
  collapsed = false,
  panelOpen,
  onExpand,
  onOpenPanel,
  onCollapse,
  onDockWidthChange,
  panelHeight = DOCK_PANEL_HEIGHT,
  privacyNote,
  brandLogo,
  historyLabels = DEFAULT_HISTORY_LABELS,
}: ChatWidgetProps) {
  const actionEnabled = suggestedMessagesAction?.enabled ?? false;

  const initialSuggestedMessages = useMemo(() => {
    if (!actionEnabled || !suggestedMessagesAction) return [];
    return getInitialSuggestedMessages(suggestedMessagesAction);
  }, [actionEnabled, suggestedMessagesAction]);

  const [visitorId, setVisitorId] = useState<string | null>(null);

  const {
    messages,
    sessionId,
    sessionTitle,
    suggestedMessages: liveSuggestedMessages,
    isEscalated,
    escalationMessage,
    isLoading,
    isStreaming,
    error,
    activeForm,
    formSubmitting,
    sendMessage,
    submitForm,
    clearMessages,
    loadConversation,
  } = useChat({
    agentId,
    widgetToken,
    sessionId: initialSessionId,
    visitorId,
    initialMessages,
    initialSuggestedMessages: actionEnabled ? initialSuggestedMessages : undefined,
    deployment,
    context,
  });

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const collapsedSizerRef = useRef<HTMLDivElement>(null);
  const launcherSuggestionsRef = useRef<HTMLDivElement>(null);
  const privacyRef = useRef<HTMLDivElement>(null);
  const historyButtonRef = useRef<HTMLButtonElement>(null);
  const historyPanelRef = useRef<HTMLDivElement>(null);
  const wasHistoryOpenRef = useRef(false);
  const [draft, setDraft] = useState("");
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historySessions, setHistorySessions] = useState<ConversationSummary[]>(
    [],
  );
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const {
    isMicSupported,
    isRecording,
    isTranscribing,
    durationMs,
    handleMicToggle,
    cancelRecording,
  } = useVoiceToText({
    agentId,
    widgetToken,
    deployment,
    enabled: voiceToTextEnabled,
    onTranscript: (text) => {
      setDraft(text);
      setVoiceError(null);
    },
    onError: (message) => setVoiceError(message),
  });

  const showClearButton = onClear !== undefined;
  const isCollapsed = dock && collapsed;
  const isPanelOpen = dock ? (panelOpen ?? !collapsed) : false;

  const displaySuggestions = actionEnabled ? liveSuggestedMessages : [];
  const keepShowing = suggestedMessagesAction?.keepShowingAfterFirst ?? false;
  const visibleSuggestions = displaySuggestions
    .filter((s) => s.trim())
    .slice(0, dock ? DOCK_MAX_SUGGESTIONS : undefined);

  const showSuggestionChips =
    !isEscalated &&
    shouldShowSuggestedMessages({
      hasMessages: messages.length > 0,
      keepShowingAfterFirst: keepShowing,
      suggestionCount: visibleSuggestions.length,
    });

  const launcherSuggestions = dock && !isEscalated ? visibleSuggestions : [];
  const launcherQuestions =
    launcherSuggestions.length > 0 ? launcherSuggestions : [placeholder];
  const launcherQuestionsKey = launcherQuestions.join("\u0000");
  const showLauncherSuggestions =
    dock &&
    !isCollapsed &&
    !isPanelOpen &&
    !isEscalated &&
    launcherSuggestions.length > 0;
  const showPrivacy = dock && !isCollapsed && !isPanelOpen && Boolean(privacyNote);

  useEffect(() => {
    setVisitorId(getOrCreateVisitorId(agentId));
  }, [agentId]);

  const loadHistory = useCallback(async () => {
    if (!dock || !isPanelOpen || !visitorId) return;

    setHistoryLoading(true);
    setHistoryError(null);

    try {
      const params = new URLSearchParams({ agentId, visitorId });
      if (widgetToken) params.set("widgetToken", widgetToken);
      if (deployment === "help") params.set("deployment", "help");

      const res = await fetch(`/api/chat/sessions?${params.toString()}`);
      const json = (await res.json()) as {
        success?: boolean;
        error?: string;
        data?: { sessions?: ConversationSummary[] };
      };

      if (!json.success) {
        throw new Error(json.error ?? historyLabels.error);
      }

      setHistorySessions(json.data?.sessions ?? []);
    } catch (err) {
      setHistoryError(
        err instanceof Error ? err.message : historyLabels.error,
      );
    } finally {
      setHistoryLoading(false);
    }
  }, [
    dock,
    isPanelOpen,
    visitorId,
    agentId,
    widgetToken,
    deployment,
    historyLabels.error,
  ]);

  useEffect(() => {
    if (historyOpen) void loadHistory();
  }, [historyOpen, loadHistory]);

  useEffect(() => {
    if (!sessionId) return;

    setHistorySessions((prev) => {
      const existing = prev.find((item) => item.id === sessionId);
      if (!existing && !sessionTitle) return prev;

      const now = new Date().toISOString();
      const next: ConversationSummary = {
        id: sessionId,
        title: sessionTitle ?? existing?.title ?? null,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      };

      return [next, ...prev.filter((item) => item.id !== sessionId)];
    });
  }, [sessionId, sessionTitle]);

  useEffect(() => {
    if (!historyOpen) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (historyPanelRef.current?.contains(target)) return;
      if (historyButtonRef.current?.contains(target)) return;
      setHistoryOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [historyOpen]);

  useEffect(() => {
    if (!historyOpen) return;

    const frame = window.requestAnimationFrame(() => {
      historyPanelRef.current
        ?.querySelector<HTMLButtonElement>("[role='menuitem']")
        ?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [historyOpen]);

  useEffect(() => {
    if (!historyOpen && wasHistoryOpenRef.current) {
      historyButtonRef.current?.focus();
    }
    wasHistoryOpenRef.current = historyOpen;
  }, [historyOpen]);

  useEffect(() => {
    if (!isPanelOpen || isCollapsed) setHistoryOpen(false);
  }, [isPanelOpen, isCollapsed]);

  const handleNewConversation = useCallback(() => {
    clearMessages();
    setDraft("");
    setHistoryOpen(false);
    window.requestAnimationFrame(() => inputRef.current?.focus());
  }, [clearMessages]);

  const handleSelectConversation = useCallback(
    async (item: ConversationSummary) => {
      if (item.id === sessionId) {
        setHistoryOpen(false);
        return;
      }
      if (!visitorId) return;

      setHistoryLoading(true);
      setHistoryError(null);

      try {
        const params = new URLSearchParams({ agentId, visitorId });
        if (widgetToken) params.set("widgetToken", widgetToken);
        if (deployment === "help") params.set("deployment", "help");

        const res = await fetch(
          `/api/chat/sessions/${encodeURIComponent(item.id)}?${params.toString()}`,
        );
        const json = (await res.json()) as {
          success?: boolean;
          error?: string;
          data?: {
            session?: { id: string; title: string | null };
            messages?: ChatMessage[];
          };
        };

        if (!json.success || !json.data?.session) {
          throw new Error(json.error ?? historyLabels.error);
        }

        loadConversation({
          sessionId: json.data.session.id,
          messages: json.data.messages ?? [],
          title: json.data.session.title,
        });
        setDraft("");
        setHistoryOpen(false);
        window.requestAnimationFrame(() => inputRef.current?.focus());
      } catch (err) {
        setHistoryError(
          err instanceof Error ? err.message : historyLabels.error,
        );
      } finally {
        setHistoryLoading(false);
      }
    },
    [
      sessionId,
      visitorId,
      agentId,
      widgetToken,
      deployment,
      historyLabels.error,
      loadConversation,
    ],
  );

  useEffect(() => {
    const el = scrollAreaRef.current;
    if (!el || (dock && !isPanelOpen)) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, dock, isPanelOpen]);

  useLayoutEffect(() => {
    if (!dock || !onDockWidthChange) return;
    const el = collapsedSizerRef.current;
    if (!el) return;

    const measure = () => {
      const widths = Array.from(el.children).map(
        (child) => (child as HTMLElement).getBoundingClientRect().width,
      );
      const max = widths.length > 0 ? Math.max(...widths) : 0;
      if (max > 0) {
        onDockWidthChange(
          Math.max(DOCK_COLLAPSED_MIN_WIDTH, Math.ceil(max + DOCK_COLLAPSED_TEXT_PADDING)),
        );
      }
    };

    measure();
    if (typeof document !== "undefined" && document.fonts) {
      void document.fonts.ready.then(measure).catch(() => undefined);
    }
  }, [dock, launcherQuestionsKey, onDockWidthChange]);

  useEffect(() => {
    if (!dock) return;
    const el = panelRef.current;
    if (!el) return;
    if (isPanelOpen) {
      el.removeAttribute("inert");
    } else {
      el.setAttribute("inert", "");
    }
  }, [dock, isPanelOpen]);

  useEffect(() => {
    if (!dock) return;
    const setHidden = (el: HTMLDivElement | null, hidden: boolean) => {
      if (!el) return;
      if (hidden) {
        el.setAttribute("inert", "");
      } else {
        el.removeAttribute("inert");
      }
    };
    setHidden(launcherSuggestionsRef.current, !showLauncherSuggestions);
    setHidden(privacyRef.current, !showPrivacy);
  }, [dock, showLauncherSuggestions, showPrivacy]);

  useEffect(() => {
    if (!dock || isCollapsed) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (historyOpen) {
        setHistoryOpen(false);
        return;
      }
      if (isPanelOpen) {
        onMinimize?.();
      } else {
        onCollapse?.();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [dock, isCollapsed, isPanelOpen, historyOpen, onMinimize, onCollapse]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (isCollapsed) {
      onExpand?.();
      return;
    }
    const text = draft.trim();
    if (!text || isLoading || isTranscribing || isEscalated) return;
    onOpenPanel?.();
    sendMessage(text);
    setDraft("");
  };

  const handleClear = () => {
    if (typeof onClear === "function") {
      onClear();
    } else {
      clearMessages();
    }
  };

  const handleMic = () => {
    handleMicToggle();
  };

  const handleAttach = () => {
    fileInputRef.current?.click();
  };

  const handleAttachChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      toast.info("Attachments are coming soon.", { position: "top-center" });
    }
    event.target.value = "";
  };

  const hasMessages = messages.length > 0;
  const isBusy = isLoading || isTranscribing;
  const canSend =
    draft.trim().length > 0 && !isBusy && !isRecording && !isEscalated;
  const isDark = appearance === "dark";

  const voiceProps =
    voiceToTextEnabled && isMicSupported
      ? {
          show: true as const,
          onClick: handleMic,
          onCancel: cancelRecording,
          isRecording,
          isTranscribing,
          recordingLabel: chatComposerFormatDuration(durationMs),
        }
      : undefined;

  const widgetStyle = primaryColor
    ? ({ "--widget-primary": primaryColor } as React.CSSProperties)
    : undefined;

  function handleSuggestedClick(text: string) {
    if (onSuggestedClick) {
      onSuggestedClick(text);
      return;
    }
    if (!isBusy && !isRecording && !isEscalated) {
      onOpenPanel?.();
      setDraft("");
      sendMessage(text);
    }
  }

  const visibleCustomButtons = useMemo(
    () =>
      customButtonsAction ? getVisibleCustomButtons(customButtonsAction) : [],
    [customButtonsAction],
  );

  function handleCustomButtonMessage(text: string) {
    if (!isBusy && !isRecording && !isEscalated) {
      sendMessage(text);
    }
  }

  const handoffBannerText =
    escalationMessage ?? "Connecting you to an agent. Please wait.";

  const header = (
    <header
      className={cn(
        "flex h-11 shrink-0 items-center justify-between gap-3 border-b px-3.5",
        isDark
          ? "border-hairline-strong bg-[#292524]/80"
          : "border-hairline-soft bg-canvas-soft/60",
      )}
    >
      <h2
        className={cn(
          "min-w-0 truncate text-[15px] font-medium tracking-[-0.01em]",
          isDark ? "text-[#fafaf9]" : "text-ink",
        )}
      >
        {agentName}
      </h2>
      {(showClearButton || onMinimize) && (
        <div className="flex shrink-0 items-center gap-1">
          {onMinimize ? (
            <button
              type="button"
              onClick={onMinimize}
              aria-label="Close chat"
              className={cn(
                "flex size-7 items-center justify-center rounded-full border transition-colors",
                isDark
                  ? "border-hairline-strong bg-[#292524] text-muted hover:text-[#fafaf9]"
                  : "border-hairline bg-surface-card text-muted hover:border-hairline-strong hover:bg-white hover:text-ink",
              )}
            >
              <AppIcon icon={XIcon} className="size-4" strokeWidth={2} />
            </button>
          ) : null}
          {showClearButton ? (
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={handleClear}
                    aria-label="Clear messages"
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-full border transition-colors",
                      isDark
                        ? "border-hairline-strong bg-[#292524] text-muted hover:text-[#fafaf9]"
                        : "border-hairline bg-surface-card text-muted hover:border-hairline-strong hover:bg-white hover:text-ink",
                    )}
                  >
                    <AppIcon icon={RefreshCwIcon} className="size-3.5" strokeWidth={2} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">Clear messages</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : null}
        </div>
      )}
    </header>
  );

  function renderTranscript(glass: boolean) {
    return (
      <div
        ref={scrollAreaRef}
        className={cn(
          glass
            ? "chat-glass-scroll relative z-10 min-h-0 flex-1 space-y-3 overflow-y-auto px-4 pb-12 pt-1"
            : "min-h-0 flex-1 space-y-2.5 overflow-y-auto px-3.5 py-2.5",
        )}
      >
        {glass && isEscalated ? (
          <div
            className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-[12px] leading-relaxed text-white/85"
            role="status"
          >
            {handoffBannerText}
          </div>
        ) : null}

        {!hasMessages && (
          <div className="flex justify-start">
            {glass ? (
              <div
                dir="auto"
                className="max-w-[92%] text-[14px] leading-relaxed text-white/90"
              >
                <ChatMarkdown content={welcomeMessage} variant="glass" />
              </div>
            ) : (
              <div
                dir="auto"
                className={cn(
                  "max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed",
                  isDark ? "bg-[#292524] text-[#fafaf9]" : "bg-surface-strong text-ink",
                )}
              >
                <ChatMarkdown content={welcomeMessage} variant="assistant" />
              </div>
            )}
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn("flex", msg.role === "USER" ? "justify-end" : "justify-start")}
          >
            {msg.role === "USER" ? (
              glass ? (
                <div
                  dir="auto"
                  className="max-w-[85%] rounded-[18px] border border-white/10 bg-white/15 px-3.5 py-2 text-[14px] leading-relaxed text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] backdrop-blur-sm"
                >
                  <ChatMarkdown content={msg.content} variant="userInk" />
                </div>
              ) : (
                <div
                  dir="auto"
                  className={cn(
                    "max-w-[85%] rounded-md px-3 py-1.5 text-sm leading-relaxed",
                    primaryColor ? "text-white" : "bg-primary text-on-primary",
                  )}
                  style={
                    primaryColor
                      ? { backgroundColor: "var(--widget-primary)" }
                      : undefined
                  }
                >
                  <ChatMarkdown content={msg.content} variant="user" />
                </div>
              )
            ) : glass ? (
              <div
                dir="auto"
                className="max-w-[92%] text-[14px] leading-relaxed text-white/90"
              >
                <ChatMarkdown
                  content={msg.content}
                  variant="glass"
                  isStreaming={Boolean(msg.streaming)}
                />
              </div>
            ) : (
              <div
                dir="auto"
                className={cn(
                  "max-w-[85%] text-sm leading-relaxed",
                  isDark ? "text-[#fafaf9]" : "text-ink",
                )}
              >
                <ChatMarkdown
                  content={msg.content}
                  variant="assistant"
                  isStreaming={Boolean(msg.streaming)}
                />
              </div>
            )}
          </div>
        ))}

        {isBusy && hasMessages && !isStreaming && (
          <div className="flex justify-start">
            <LoadingState
              label="Thinking"
              variant="Drive"
              tone={glass || isDark ? "dark" : "light"}
            />
          </div>
        )}

        {(error || voiceError) && (
          <div className="flex justify-center">
            <span
              className={cn(
                "rounded-full px-3 py-1 text-xs",
                glass
                  ? "border border-rose-300/20 bg-rose-500/15 text-rose-100"
                  : "bg-error/10 text-error",
              )}
            >
              {error ?? voiceError}
            </span>
          </div>
        )}
      </div>
    );
  }

  const composer = (
    <ChatMessageComposer
      appearance={appearance}
      primaryColor={launcherAccentColor ?? primaryColor}
      placeholder={isEscalated ? "Waiting for an agent…" : placeholder}
      value={draft}
      onChange={setDraft}
      onSubmit={handleSubmit}
      isBusy={isBusy || isEscalated}
      canSend={canSend}
      showSuggestions={!dock && showSuggestionChips}
      suggestedMessages={displaySuggestions}
      onSuggestedClick={handleSuggestedClick}
      voice={voiceProps}
      showAttach={dock && !isCollapsed}
      onAttach={handleAttach}
      variant={dock ? "bar" : "default"}
      inputRef={inputRef}
    />
  );

  if (dock) {
    return (
      <div
        data-widget-appearance={appearance}
        data-state={isCollapsed ? "collapsed" : isPanelOpen ? "chat" : "launcher"}
        style={widgetStyle}
        className={cn("relative flex w-full flex-col", className)}
      >
        {onDockWidthChange ? (
          <div
            ref={collapsedSizerRef}
            aria-hidden
            className="pointer-events-none absolute start-0 top-0 -z-10 w-max opacity-0"
          >
            {launcherQuestions.map((question, index) => (
              <span
                key={`${question}-${index}`}
                className="block whitespace-nowrap text-[14px] font-medium leading-5"
              >
                {question}
              </span>
            ))}
          </div>
        ) : null}

        <div
          ref={launcherSuggestionsRef}
          className={cn(
            "grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
            showLauncherSuggestions
              ? "grid-rows-[1fr] opacity-100"
              : "grid-rows-[0fr] opacity-0",
          )}
          aria-hidden={!showLauncherSuggestions || undefined}
        >
          <div className="min-h-0 overflow-hidden">
            <div className="pb-3">
              <ChatSuggestionPills
                messages={launcherSuggestions}
                layout="floating"
                disabled={isBusy || isRecording || isEscalated}
                onSelect={handleSuggestedClick}
              />
            </div>
          </div>
        </div>

        <div
          className={cn(
            "grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
            isPanelOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
          )}
          aria-hidden={!isPanelOpen || undefined}
        >
          <div className="min-h-0 overflow-hidden">
            <div className="px-1.5 pb-2.5">
              <div
                ref={panelRef}
                role="dialog"
                aria-label={agentName}
                style={{ height: panelHeight }}
                className={cn(
                  "liquid-glass flex flex-col overflow-hidden rounded-[28px] text-white transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
                  isPanelOpen
                    ? "translate-y-0 scale-100 opacity-100"
                    : "translate-y-2 scale-[0.985] opacity-0",
                )}
              >
                <header className="relative z-30 flex h-14 shrink-0 items-center px-3">
                  <button
                    ref={historyButtonRef}
                    type="button"
                    onClick={() => setHistoryOpen((open) => !open)}
                    aria-haspopup="menu"
                    aria-expanded={historyOpen}
                    aria-label={`${historyLabels.title}: ${sessionTitle ?? agentName}`}
                    className="-ms-2 flex min-w-0 flex-1 items-center gap-2.5 rounded-full px-2 py-1.5 text-start outline-none transition-colors hover:bg-white/10 focus-visible:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/30"
                  >
                    {brandLogo ? (
                      <Image
                        src={brandLogo}
                        alt=""
                        width={28}
                        height={28}
                        className="size-7 shrink-0 object-contain"
                      />
                    ) : (
                      <span
                        aria-hidden
                        className="grid size-7 shrink-0 grid-cols-3 place-content-center gap-[3px] rounded-[9px] border border-white/15 bg-white/10 p-[6px] shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]"
                      >
                        {Array.from({ length: 9 }).map((_, index) => (
                          <span
                            key={index}
                            className="size-[3px] rounded-full bg-white/80"
                          />
                        ))}
                      </span>
                    )}
                    <span className="min-w-0 flex-1 truncate text-[14px] font-medium tracking-[-0.01em] text-white/95">
                      {sessionTitle ?? agentName}
                    </span>
                    <AppIcon
                      icon={ChevronDown}
                      className={cn(
                        "size-4 shrink-0 text-white/60 transition-transform duration-200 motion-reduce:transition-none",
                        historyOpen && "rotate-180",
                      )}
                      strokeWidth={2}
                    />
                  </button>

                  {historyOpen ? (
                    <div
                      ref={historyPanelRef}
                      role="menu"
                      aria-label={historyLabels.title}
                      className="absolute inset-x-3 top-[52px] z-40 overflow-hidden rounded-[18px] border border-black/5 bg-white/95 text-ink shadow-[0_18px_50px_-18px_rgba(0,0,0,0.55)] backdrop-blur-xl"
                    >
                      <div className="max-h-[320px] overflow-y-auto p-1.5">
                        <div className="px-2.5 pb-1.5 pt-1 text-[10px] font-medium uppercase tracking-[0.08em] text-muted">
                          {historyLabels.title}
                        </div>

                        <button
                          type="button"
                          role="menuitem"
                          onClick={handleNewConversation}
                          className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-[13px] font-medium text-ink outline-none transition-colors hover:bg-canvas-soft focus-visible:bg-canvas-soft"
                        >
                          <AppIcon
                            icon={PlusIcon}
                            className="size-4 shrink-0 text-muted"
                            strokeWidth={2}
                          />
                          <span className="truncate">
                            {historyLabels.newConversation}
                          </span>
                        </button>

                        <div className="my-1 h-px bg-hairline" />

                        {historyLoading ? (
                          <div className="px-2.5 py-2 text-[11px] text-muted">
                            {historyLabels.loading}
                          </div>
                        ) : null}

                        {historyError ? (
                          <div className="px-2.5 py-2 text-[11px] text-error">
                            {historyError}
                          </div>
                        ) : null}

                        {!historyLoading &&
                        !historyError &&
                        historySessions.length === 0 ? (
                          <div className="px-2.5 py-3 text-[11px] leading-relaxed text-muted">
                            {historyLabels.empty}
                          </div>
                        ) : null}

                        {historySessions.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            role="menuitem"
                            aria-current={
                              item.id === sessionId ? "true" : undefined
                            }
                            onClick={() => void handleSelectConversation(item)}
                            className={cn(
                              "flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-start text-[13px] outline-none transition-colors hover:bg-canvas-soft focus-visible:bg-canvas-soft",
                              item.id === sessionId
                                ? "bg-canvas-soft text-ink"
                                : "text-ink/85",
                            )}
                          >
                            <span className="min-w-0 flex-1 truncate">
                              {item.title ?? historyLabels.newConversation}
                            </span>
                            <span className="shrink-0 text-[10px] tabular-nums text-muted">
                              {formatConversationTime(item.updatedAt)}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </header>

                {renderTranscript(true)}

                {activeForm && !isEscalated ? (
                  <div className="relative z-10 shrink-0 border-t border-white/10 px-4 py-3">
                    <div className="rounded-2xl bg-white/95 p-3 text-ink shadow-[0_8px_24px_-12px_rgba(0,0,0,0.45)]">
                      <ChatInlineForm
                        form={activeForm}
                        disabled={isBusy || isRecording || formSubmitting}
                        onSubmit={submitForm}
                      />
                    </div>
                  </div>
                ) : null}

                {isPanelOpen && hasMessages ? (
                  <button
                    type="button"
                    onClick={() =>
                      scrollAreaRef.current?.scrollTo({
                        top: scrollAreaRef.current.scrollHeight,
                        behavior: "smooth",
                      })
                    }
                    aria-label="Scroll to latest message"
                    className="absolute bottom-3 left-1/2 z-20 flex size-8 -translate-x-1/2 items-center justify-center rounded-full border border-white/40 bg-white/90 text-ink shadow-[0_6px_16px_rgba(0,0,0,0.25)] backdrop-blur-md transition-colors hover:bg-white"
                  >
                    <AppIcon icon={ChevronDown} className="size-4" strokeWidth={2} />
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="shrink-0">
          {isCollapsed ? (
            <button
              type="button"
              onClick={onExpand}
              disabled={!onExpand}
              aria-label="Open chat"
              aria-haspopup="dialog"
              className="group flex h-14 w-full items-center gap-2 rounded-full border border-hairline bg-surface-card ps-5 pe-1.5 text-start shadow-[0_4px_8px_rgba(12,10,9,0.08),0_12px_24px_-12px_rgba(12,10,9,0.38)] outline-none transition-[border-color,box-shadow] duration-200 hover:border-hairline-strong focus-visible:ring-2 focus-visible:ring-ink/10 disabled:opacity-70 motion-reduce:transition-none"
            >
              <ChatTypewriterQuestion
                questions={launcherQuestions}
                fallback={placeholder}
                className="text-[14px] font-medium text-muted"
              />
              <span
                aria-hidden
                className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-strong text-muted transition-colors group-hover:bg-canvas-soft group-hover:text-ink"
              >
                <AppIcon
                  icon={ArrowUpIcon}
                  className="size-4"
                  strokeWidth={2}
                />
              </span>
            </button>
          ) : (
            <>
              {composer}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleAttachChange}
                tabIndex={-1}
                aria-hidden
              />
            </>
          )}
        </div>

        {privacyNote ? (
          <div
            ref={privacyRef}
            className={cn(
              "flex h-8 shrink-0 items-center justify-center overflow-hidden px-2 transition-opacity duration-200 motion-reduce:transition-none",
              showPrivacy ? "opacity-100" : "opacity-0",
            )}
            aria-hidden={!showPrivacy || undefined}
          >
            {privacyNote}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div
      data-widget-appearance={appearance}
      style={widgetStyle}
      className={cn(
        "flex h-full min-h-0 w-full max-h-full flex-col overflow-hidden rounded-xl border shadow-[0_2px_8px_rgba(0,0,0,0.06),0_12px_32px_rgba(0,0,0,0.1)]",
        isDark
          ? "border-hairline-strong bg-[#1c1917] text-[#fafaf9]"
          : "border-hairline bg-surface-card",
        className,
      )}
    >
      {header}
      {renderTranscript(false)}

      <div className="shrink-0 px-3.5 pb-2 pt-0.5">
        {isEscalated ? (
          <div
            className={cn(
              "mb-2 rounded-lg border px-3 py-2 text-body-sm leading-relaxed",
              isDark
                ? "border-hairline-strong bg-[#292524] text-[#fafaf9]"
                : "border-hairline bg-surface-strong text-ink",
            )}
            role="status"
          >
            {handoffBannerText}
          </div>
        ) : null}

        {showPoweredBy && <PoweredByAnselio />}

        <ChatCustomButtonsRow
          buttons={visibleCustomButtons}
          appearance={appearance}
          isBusy={isBusy || isRecording || isEscalated}
          readOnly={customButtonsReadOnly || isEscalated}
          onMessageClick={handleCustomButtonMessage}
        />

        {activeForm && !isEscalated ? (
          <div className="mb-2">
            <ChatInlineForm
              form={activeForm}
              disabled={isBusy || isRecording || formSubmitting}
              onSubmit={submitForm}
            />
          </div>
        ) : null}

        {composer}
      </div>
    </div>
  );
}
