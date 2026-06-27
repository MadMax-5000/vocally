"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

import { ChatCustomButtonsRow } from "@/components/chat/ChatCustomButtonsRow";
import { ChatMarkdown } from "@/components/chat/ChatMarkdown";
import { ChatInlineForm } from "@/components/chat/ChatInlineForm";
import {
  ChatMessageComposer,
  chatComposerFormatDuration,
} from "@/components/chat/ChatMessageComposer";
import { HelpPageShell } from "@/components/chat/HelpPageShell";
import { PoweredByVocally } from "@/components/chat/PoweredByVocally";
import { useChat } from "@/hooks/useChat";
import { useVoiceToText } from "@/hooks/useVoiceToText";
import type { ResolvedWebChatHelpPageSettings } from "@/lib/deploy/web-chat-config";
import type { WebChatHelpPageTheme } from "@/lib/deploy/web-chat-config";
import { getVisibleCustomButtons } from "@/lib/deploy/custom-button-action";
import {
  getInitialSuggestedMessages,
  shouldShowSuggestedMessages,
} from "@/lib/deploy/suggested-messages-action";
import { cn } from "@/lib/utils";

type HelpCenterChatProps = {
  agentId: string;
  widgetToken?: string;
  sidebarLabel: string;
  settings: ResolvedWebChatHelpPageSettings;
  className?: string;
};

export function HelpCenterChat({
  agentId,
  widgetToken,
  sidebarLabel,
  settings,
  className = "",
}: HelpCenterChatProps) {
  const action = settings.suggestedMessagesAction;
  const actionEnabled = action.enabled;

  const initialSuggestedMessages = useMemo(() => {
    if (!actionEnabled) return [];
    return getInitialSuggestedMessages(action, settings.suggestedMessages);
  }, [action, actionEnabled, settings.suggestedMessages]);

  const {
    messages,
    suggestedMessages: liveSuggestedMessages,
    isEscalated,
    escalationMessage,
    isLoading,
    error,
    activeForm,
    formSubmitting,
    sendMessage,
    submitForm,
    clearMessages,
  } = useChat({
    agentId,
    widgetToken,
    deployment: "help",
    initialSuggestedMessages: actionEnabled ? initialSuggestedMessages : undefined,
  });

  const bottomRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState("");
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [theme, setTheme] = useState<WebChatHelpPageTheme>(settings.defaultTheme);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const voiceEnabled = settings.voiceToTextEnabled;

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
    deployment: "help",
    enabled: voiceEnabled,
    onTranscript: (text) => {
      setDraft(text);
      setVoiceError(null);
    },
    onError: (message) => setVoiceError(message),
  });

  useEffect(() => {
    setTheme(settings.defaultTheme);
  }, [settings.defaultTheme]);

  const hasMessages = messages.length > 0;
  const isBusy = isLoading || isTranscribing;
  const canSend =
    draft.trim().length > 0 && !isBusy && !isRecording && !isEscalated;
  const isDark = theme === "dark";

  const voiceProps =
    voiceEnabled && isMicSupported
      ? {
          show: true as const,
          onClick: handleMicToggle,
          onCancel: cancelRecording,
          isRecording,
          isTranscribing,
          recordingLabel: chatComposerFormatDuration(durationMs),
        }
      : undefined;

  const { logoUrl, heroUrl, primaryColor } = useMemo(() => {
    return {
      logoUrl: isDark
        ? settings.logoDarkUrl || settings.logoUrl
        : settings.logoUrl || settings.logoDarkUrl,
      heroUrl: isDark
        ? settings.heroDarkUrl || settings.heroUrl
        : settings.heroUrl || settings.heroDarkUrl,
      primaryColor: isDark ? settings.primaryColorDark : settings.primaryColorLight,
    };
  }, [isDark, settings]);

  const displaySuggestions = actionEnabled
    ? liveSuggestedMessages
    : settings.suggestedMessages;

  const keepShowing = actionEnabled
    ? action.keepShowingAfterFirst
    : settings.keepShowingSuggested;

  const visibleSuggestions = displaySuggestions.filter((s) => s.trim());
  const showSuggestions =
    !isEscalated &&
    shouldShowSuggestedMessages({
      hasMessages,
      keepShowingAfterFirst: keepShowing,
      suggestionCount: visibleSuggestions.length,
    });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || isBusy || isEscalated) return;
    sendMessage(text);
    setDraft("");
  };

  function handleSuggestedClick(text: string) {
    if (isBusy || isRecording || isEscalated) return;
    sendMessage(text);
  }

  const visibleCustomButtons = useMemo(
    () => getVisibleCustomButtons(settings.customButtonsAction),
    [settings.customButtonsAction],
  );

  function handleCustomButtonMessage(text: string) {
    if (isBusy || isRecording || isEscalated) return;
    sendMessage(text);
  }

  const handoffBannerText =
    escalationMessage ?? "Connecting you to an agent. Please wait.";

  const escalationBanner = isEscalated ? (
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
  ) : null;

  const customButtonsRow = (
    <ChatCustomButtonsRow
      buttons={visibleCustomButtons}
      appearance={theme}
      isBusy={isBusy || isEscalated}
      readOnly={isEscalated}
      onMessageClick={handleCustomButtonMessage}
    />
  );

  const inlineForm =
    activeForm && !isEscalated ? (
      <div className="mb-2 w-full max-w-xl">
        <ChatInlineForm
          form={activeForm}
          disabled={isBusy || formSubmitting}
          onSubmit={submitForm}
        />
      </div>
    ) : null;

  const emptyComposer = (
    <div className="mt-4 w-full max-w-xl">
      {escalationBanner}
      {customButtonsRow}
      {inlineForm}
      <ChatMessageComposer
        appearance={theme}
        primaryColor={primaryColor}
        primaryCssVar="--help-primary"
        placeholder={isEscalated ? "Waiting for an agent…" : settings.placeholder}
        value={draft}
        onChange={setDraft}
        onSubmit={handleSubmit}
        isBusy={isBusy || isEscalated}
        canSend={canSend}
        showSuggestions={showSuggestions}
        suggestedMessages={displaySuggestions}
        onSuggestedClick={handleSuggestedClick}
        suggestionsBelow
        voice={voiceProps}
      />
    </div>
  );

  const threadComposer = (
    <div className="shrink-0 px-3 pb-2 pt-1">
      <div className="mx-auto w-full max-w-3xl">
        {escalationBanner}
        {customButtonsRow}
        {inlineForm}
        <ChatMessageComposer
          appearance={theme}
          primaryColor={primaryColor}
          primaryCssVar="--help-primary"
          placeholder={isEscalated ? "Waiting for an agent…" : settings.placeholder}
          value={draft}
          onChange={setDraft}
          onSubmit={handleSubmit}
          isBusy={isBusy || isEscalated}
          canSend={canSend}
          showSuggestions={showSuggestions}
          suggestedMessages={displaySuggestions}
          onSuggestedClick={handleSuggestedClick}
          voice={voiceProps}
        />
        <div className="mt-2">
          <PoweredByVocally />
        </div>
      </div>
    </div>
  );

  const chatThread = (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mx-auto min-h-0 w-full max-w-3xl flex-1 space-y-3 overflow-y-auto px-3 py-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn("flex", msg.role === "USER" ? "justify-end" : "justify-start")}
          >
            {msg.role === "USER" ? (
              <div
                className="max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed text-white"
                style={{ backgroundColor: primaryColor }}
              >
                <ChatMarkdown content={msg.content} variant="user" />
              </div>
            ) : (
              <div
                className={cn(
                  "max-w-[90%] rounded-xl px-3 py-2 text-sm leading-relaxed",
                  isDark ? "bg-[#292524] text-[#fafaf9]" : "bg-surface-strong text-ink",
                )}
              >
                <ChatMarkdown content={msg.content} variant="assistant" />
              </div>
            )}
          </div>
        ))}

        {isBusy && (
          <div className="flex justify-start">
            <span className="flex items-center gap-1 py-1">
              <span className="size-1.5 animate-bounce rounded-full bg-muted" />
              <span className="size-1.5 animate-bounce rounded-full bg-muted [animation-delay:0.1s]" />
              <span className="size-1.5 animate-bounce rounded-full bg-muted [animation-delay:0.2s]" />
            </span>
          </div>
        )}

        {(error || voiceError) && (
          <div className="flex justify-center">
            <span className="rounded-full bg-error/10 px-3 py-1 text-xs text-error">
              {error ?? voiceError}
            </span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
      {threadComposer}
    </div>
  );

  return (
    <HelpPageShell
      sidebarLabel={sidebarLabel}
      headline={settings.headline}
      theme={theme}
      primaryColor={primaryColor}
      logoUrl={logoUrl}
      heroUrl={heroUrl}
      navLinks={settings.navLinks}
      sidebarOpen={sidebarOpen}
      onSidebarToggle={() => setSidebarOpen((o) => !o)}
      onNewChat={() => {
        clearMessages();
        setDraft("");
      }}
      themeSwitchEnabled={settings.themeSwitchEnabled}
      onThemeChange={settings.themeSwitchEnabled ? setTheme : undefined}
      showEmptyState={!hasMessages}
      className={cn("min-h-dvh", className)}
      emptyStateContent={
        <>
          {heroUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={heroUrl} alt="" className="mb-4 h-20 w-20 object-contain" />
          ) : null}
          <h1
            className={cn(
              "font-display text-display-md tracking-tight text-balance",
              isDark ? "text-[#fafaf9]" : "text-ink",
            )}
          >
            {settings.headline.trim() || "How can I help you today?"}
          </h1>
          {emptyComposer}
        </>
      }
    >
      {chatThread}
    </HelpPageShell>
  );
}
