"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

import { ChatMarkdown } from "@/components/chat/ChatMarkdown";
import { ChatMessageComposer } from "@/components/chat/ChatMessageComposer";
import { HelpPageShell } from "@/components/chat/HelpPageShell";
import { PoweredByVocally } from "@/components/chat/PoweredByVocally";
import { useChat } from "@/hooks/useChat";
import type { ResolvedWebChatHelpPageSettings } from "@/lib/deploy/web-chat-config";
import type { WebChatHelpPageTheme } from "@/lib/deploy/web-chat-config";
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
  const {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
  } = useChat({
    agentId,
    widgetToken,
    deployment: "help",
  });

  const bottomRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState("");
  const [theme, setTheme] = useState<WebChatHelpPageTheme>(settings.defaultTheme);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    setTheme(settings.defaultTheme);
  }, [settings.defaultTheme]);

  const hasMessages = messages.length > 0;
  const isBusy = isLoading;
  const canSend = draft.trim().length > 0 && !isBusy;
  const isDark = theme === "dark";

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

  const showSuggestions =
    !hasMessages || settings.keepShowingSuggested;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || isBusy) return;
    sendMessage(text);
    setDraft("");
  };

  function handleSuggestedClick(text: string) {
    if (isBusy) return;
    sendMessage(text);
  }

  const emptyComposer = (
    <div className="mt-4 w-full max-w-xl">
      <ChatMessageComposer
        appearance={theme}
        primaryColor={primaryColor}
        primaryCssVar="--help-primary"
        placeholder={settings.placeholder}
        value={draft}
        onChange={setDraft}
        onSubmit={handleSubmit}
        isBusy={isBusy}
        canSend={canSend}
        showSuggestions={showSuggestions}
        suggestedMessages={settings.suggestedMessages}
        onSuggestedClick={handleSuggestedClick}
        suggestionsBelow
        voice={
          settings.voiceToTextEnabled
            ? { show: true, disabled: true, comingSoon: true }
            : undefined
        }
      />
    </div>
  );

  const threadComposer = (
    <div className="shrink-0 px-3 pb-2 pt-1">
      <div className="mx-auto w-full max-w-3xl">
        <ChatMessageComposer
          appearance={theme}
          primaryColor={primaryColor}
          primaryCssVar="--help-primary"
          placeholder={settings.placeholder}
          value={draft}
          onChange={setDraft}
          onSubmit={handleSubmit}
          isBusy={isBusy}
          canSend={canSend}
          showSuggestions={showSuggestions}
          suggestedMessages={settings.suggestedMessages}
          onSuggestedClick={handleSuggestedClick}
          voice={
            settings.voiceToTextEnabled
              ? { show: true, disabled: true, comingSoon: true }
              : undefined
          }
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

        {error && (
          <div className="flex justify-center">
            <span className="rounded-full bg-error/10 px-3 py-1 text-xs text-error">
              {error}
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
