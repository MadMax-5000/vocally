"use client";

import { ImageIcon, Moon, PanelLeft, Plus, Sun } from "lucide-react";

import type { HelpPageNavLink, WebChatHelpPageTheme } from "@/lib/deploy/web-chat-config";
import { cn } from "@/lib/utils";

function LogoMark({
  logoUrl,
  label,
  collapsed,
  isDark,
}: {
  logoUrl?: string;
  label: string;
  collapsed: boolean;
  isDark: boolean;
}) {
  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt=""
        className={cn(
          "object-contain object-left",
          collapsed ? "mx-auto size-8" : "h-6 max-w-[140px]",
        )}
      />
    );
  }

  if (collapsed) {
    return (
      <span
        className={cn(
          "mx-auto flex size-8 items-center justify-center rounded-lg",
          isDark ? "bg-white/5 text-white/50" : "bg-surface-strong text-muted",
        )}
      >
        <ImageIcon className="size-4" strokeWidth={1.75} />
      </span>
    );
  }

  return (
    <div className="flex min-w-0 items-center gap-2">
      <ImageIcon
        className={cn("size-4 shrink-0", isDark ? "text-white/50" : "text-muted")}
        strokeWidth={1.75}
      />
      <span
        className={cn(
          "truncate text-body-sm font-medium",
          isDark ? "text-white/90" : "text-ink",
        )}
      >
        {label}
      </span>
    </div>
  );
}

function NavLinkItem({
  link,
  isDark,
  staticPreview,
}: {
  link: HelpPageNavLink;
  isDark: boolean;
  staticPreview?: boolean;
}) {
  const external =
    link.href.startsWith("http://") || link.href.startsWith("https://");

  if (link.variant === "primary") {
    return (
      <a
        href={staticPreview ? undefined : link.href}
        target={external && !staticPreview ? "_blank" : undefined}
        rel={external && !staticPreview ? "noopener noreferrer" : undefined}
        onClick={staticPreview ? (e) => e.preventDefault() : undefined}
        className={cn(
          "flex w-full items-center justify-center rounded-md px-3 py-2 text-body-sm font-medium transition-colors",
          staticPreview && "pointer-events-none",
          isDark
            ? "bg-white/10 text-white hover:bg-white/15"
            : "bg-primary text-on-primary hover:bg-primary-active",
        )}
      >
        {link.label}
      </a>
    );
  }

  return (
    <a
      href={staticPreview ? undefined : link.href}
      target={external && !staticPreview ? "_blank" : undefined}
      rel={external && !staticPreview ? "noopener noreferrer" : undefined}
      onClick={staticPreview ? (e) => e.preventDefault() : undefined}
      className={cn(
        "block rounded-md px-3 py-2 text-body-sm transition-colors",
        staticPreview && "pointer-events-none",
        isDark
          ? "text-white/70 hover:bg-white/5 hover:text-white"
          : "text-muted hover:bg-canvas-soft hover:text-ink",
      )}
    >
      {link.label}
    </a>
  );
}

export type HelpPageShellProps = {
  sidebarLabel: string;
  headline: string;
  theme: WebChatHelpPageTheme;
  primaryColor: string;
  logoUrl?: string;
  heroUrl?: string;
  navLinks?: HelpPageNavLink[];
  sidebarOpen: boolean;
  onSidebarToggle: () => void;
  onNewChat?: () => void;
  themeSwitchEnabled?: boolean;
  onThemeChange?: (theme: WebChatHelpPageTheme) => void;
  staticPreview?: boolean;
  showEmptyState?: boolean;
  emptyStateContent?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
};

export function HelpPageShell({
  sidebarLabel,
  headline,
  theme,
  primaryColor,
  logoUrl,
  heroUrl,
  navLinks = [],
  sidebarOpen,
  onSidebarToggle,
  onNewChat,
  themeSwitchEnabled,
  onThemeChange,
  staticPreview = false,
  showEmptyState = true,
  emptyStateContent,
  children,
  className,
}: HelpPageShellProps) {
  const isDark = theme === "dark";
  const visibleNavLinks = navLinks.filter((l) => l.label.trim() && l.href.trim());

  return (
    <div
      className={cn(
        "flex h-full min-h-0 w-full overflow-hidden",
        isDark ? "bg-[#1c1917] text-[#fafaf9]" : "bg-canvas text-ink",
        className,
      )}
      style={{ "--help-primary": primaryColor } as React.CSSProperties}
    >
      <aside
        className={cn(
          "flex shrink-0 flex-col border-r transition-[width] duration-200 ease-out overflow-hidden",
          sidebarOpen ? "w-60" : "w-0 border-transparent",
          isDark ? "border-hairline-strong bg-[#292524]" : "border-hairline bg-surface-card",
        )}
      >
        <div className="flex w-60 min-w-60 flex-col">
          <div className="flex items-center justify-between gap-2 px-3 py-2.5">
            <LogoMark
              logoUrl={logoUrl}
              label={sidebarLabel}
              collapsed={false}
              isDark={isDark}
            />
            <button
              type="button"
              onClick={onSidebarToggle}
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-md transition-colors",
                isDark
                  ? "text-white/50 hover:bg-white/5 hover:text-white/80"
                  : "text-muted hover:bg-canvas-soft hover:text-ink",
              )}
              aria-label="Collapse sidebar"
            >
              <PanelLeft className="size-4" strokeWidth={1.75} />
            </button>
          </div>

          {onNewChat ? (
            <div className="px-3 pb-2">
              <button
                type="button"
                onClick={staticPreview ? undefined : onNewChat}
                disabled={staticPreview}
                className={cn(
                  "flex w-full items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-body-sm font-medium transition-colors",
                  staticPreview && "pointer-events-none opacity-80",
                  isDark
                    ? "border-white/10 bg-white/5 text-white/90 hover:bg-white/10"
                    : "border-hairline bg-canvas-soft text-ink hover:bg-surface-strong",
                )}
              >
                <Plus className="size-3.5" strokeWidth={2} />
                New chat
              </button>
            </div>
          ) : null}

          {visibleNavLinks.length > 0 ? (
            <nav className="flex flex-col gap-1 px-3 pb-3">
              {visibleNavLinks.map((link, i) => (
                <NavLinkItem
                  key={`${link.href}-${i}`}
                  link={link}
                  isDark={isDark}
                  staticPreview={staticPreview}
                />
              ))}
            </nav>
          ) : null}
        </div>
      </aside>

      <div className="relative flex min-w-0 flex-1 flex-col">
        <div className="flex shrink-0 items-center gap-2 px-3 py-2">
          {!sidebarOpen ? (
            <button
              type="button"
              onClick={onSidebarToggle}
              className={cn(
                "flex size-8 items-center justify-center rounded-md transition-colors",
                isDark
                  ? "text-white/50 hover:bg-white/5 hover:text-white/80"
                  : "text-muted hover:bg-canvas-soft hover:text-ink",
              )}
              aria-label="Open sidebar"
            >
              <PanelLeft className="size-4" strokeWidth={1.75} />
            </button>
          ) : null}

          {themeSwitchEnabled && onThemeChange ? (
            <button
              type="button"
              onClick={() => onThemeChange(isDark ? "light" : "dark")}
              className={cn(
                "ml-auto flex size-8 items-center justify-center rounded-md border transition-colors",
                isDark
                  ? "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                  : "border-hairline bg-surface-card text-muted hover:text-ink",
              )}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark ? (
                <Sun className="size-4" strokeWidth={1.75} />
              ) : (
                <Moon className="size-4" strokeWidth={1.75} />
              )}
            </button>
          ) : null}
        </div>

        {showEmptyState ? (
          <div className="flex flex-1 flex-col items-center justify-center px-4 py-6">
            <div className="flex w-full max-w-2xl flex-col items-center text-center">
              {emptyStateContent ?? (
                <>
                  {heroUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={heroUrl}
                      alt=""
                      className="mb-4 h-20 w-20 object-contain"
                    />
                  ) : (
                    <div
                      className={cn(
                        "mb-4 flex size-20 items-center justify-center rounded-xl",
                        isDark
                          ? "bg-white/5 text-white/30"
                          : "bg-surface-strong text-muted-soft",
                      )}
                    >
                      <ImageIcon className="size-9" strokeWidth={1.25} />
                    </div>
                  )}
                  <h1
                    className={cn(
                      "font-display text-display-md tracking-tight text-balance",
                      isDark ? "text-[#fafaf9]" : "text-ink",
                    )}
                  >
                    {headline.trim() || "How can I help you today?"}
                  </h1>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        )}
      </div>
    </div>
  );
}
