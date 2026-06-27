"use client";

import { useState } from "react";
import { ImageIcon } from "lucide-react";

import { ChatMessageComposer } from "@/components/chat/ChatMessageComposer";
import { HelpPageShell } from "@/components/chat/HelpPageShell";
import type { HelpPageNavLink, WebChatHelpPageTheme } from "@/lib/deploy/web-chat-config";

export type HelpPageFrameProps = {
  sidebarLabel: string;
  headline: string;
  theme: WebChatHelpPageTheme;
  primaryColor: string;
  logoUrl?: string;
  heroUrl?: string;
  placeholder?: string;
  voiceToTextEnabled?: boolean;
  themeSwitchEnabled?: boolean;
  suggestedMessages?: string[];
  showSuggestions?: boolean;
  navLinks?: HelpPageNavLink[];
  onThemeChange?: (theme: WebChatHelpPageTheme) => void;
  staticPreview?: boolean;
  className?: string;
};

/** Static preview wrapper for dashboard — uses HelpPageShell + read-only composer. */
export function HelpPagePreviewFrame({
  sidebarLabel,
  headline,
  theme,
  primaryColor,
  logoUrl,
  heroUrl,
  placeholder = "Ask me anything...",
  voiceToTextEnabled = false,
  themeSwitchEnabled = false,
  suggestedMessages = [],
  showSuggestions = true,
  navLinks = [],
  onThemeChange,
  staticPreview = true,
  className,
}: HelpPageFrameProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const composer = (
    <div className="mt-4 w-full max-w-xl">
      <ChatMessageComposer
        appearance={theme}
        primaryColor={primaryColor}
        primaryCssVar="--help-primary"
        placeholder={placeholder}
        value=""
        onChange={() => {}}
        onSubmit={(e) => e.preventDefault()}
        readOnly
        showSuggestions={showSuggestions}
        suggestedMessages={suggestedMessages}
        suggestionsBelow
        voice={
          voiceToTextEnabled
            ? { show: true, disabled: true }
            : undefined
        }
      />
    </div>
  );

  return (
    <HelpPageShell
      sidebarLabel={sidebarLabel}
      headline={headline}
      theme={theme}
      primaryColor={primaryColor}
      logoUrl={logoUrl}
      heroUrl={heroUrl}
      navLinks={navLinks}
      sidebarOpen={sidebarOpen}
      onSidebarToggle={() => setSidebarOpen((o) => !o)}
      themeSwitchEnabled={themeSwitchEnabled}
      onThemeChange={onThemeChange}
      staticPreview={staticPreview}
      showEmptyState
      className={className}
      emptyStateContent={
        <>
          {heroUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={heroUrl} alt="" className="mb-4 h-20 w-20 object-contain" />
          ) : (
            <div
              className={
                theme === "dark"
                  ? "mb-4 flex size-20 items-center justify-center rounded-xl bg-white/5 text-white/30"
                  : "mb-4 flex size-20 items-center justify-center rounded-xl bg-surface-strong text-muted-soft"
              }
            >
              <ImageIcon className="size-9" strokeWidth={1.25} />
            </div>
          )}
          <h1
            className={
              theme === "dark"
                ? "font-display text-display-md tracking-tight text-balance text-[#fafaf9]"
                : "font-display text-display-md tracking-tight text-balance text-ink"
            }
          >
            {headline.trim() || "How can I help you today?"}
          </h1>
          {composer}
        </>
      }
    />
  );
}
