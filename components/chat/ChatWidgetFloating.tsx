"use client";
import { AppIcon } from "@/components/ui/app-icon"
import { MessageCircle, XIcon } from "@/lib/icons/app-icons"

import { useEffect, useState, type ComponentProps } from "react";

import { ChatMarkdown } from "@/components/chat/ChatMarkdown";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { cn } from "@/lib/utils";

type ChatWidgetProps = ComponentProps<typeof ChatWidget>;

export type ChatWidgetLauncherSize = "md" | "lg";

export type ChatWidgetFloatingProps = Omit<
  ChatWidgetProps,
  "className" | "onClear" | "onMinimize"
> & {
  bubbleColor: string;
  autoShowWelcomePopup?: boolean;
  autoShowWelcomePopupMobile?: boolean;
  welcomePopupDelaySec?: number;
  /** When true, positions within the parent instead of the viewport (dashboard preview). */
  contained?: boolean;
  isMobile?: boolean;
  className?: string;
  context?: string;
  /** Default `md` (56px) matches customer embeds. `lg` is the first-party site launcher. */
  launcherSize?: ChatWidgetLauncherSize;
};

const POPUP_DISMISS_KEY = "vocally-widget-popup-dismissed";

const LAUNCHER_PX: Record<ChatWidgetLauncherSize, number> = {
  md: 56,
  lg: 64,
};

function getStoredPopupDismissed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(POPUP_DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

function setStoredPopupDismissed(): void {
  try {
    localStorage.setItem(POPUP_DISMISS_KEY, "1");
  } catch {
    // localStorage unavailable
  }
}

export function ChatWidgetFloating({
  bubbleColor,
  autoShowWelcomePopup = false,
  autoShowWelcomePopupMobile = false,
  welcomePopupDelaySec = 3,
  contained = false,
  isMobile,
  className,
  context,
  launcherSize = "md",
  ...chatWidgetProps
}: ChatWidgetFloatingProps) {
  const [open, setOpen] = useState(false);
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  const [popupDismissed, setPopupDismissed] = useState(getStoredPopupDismissed);
  const [mobileViewport, setMobileViewport] = useState(false);

  useEffect(() => {
    if (isMobile !== undefined) return;
    const mq = window.matchMedia("(max-width: 640px)");
    const update = () => setMobileViewport(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [isMobile]);

  const effectiveMobile = isMobile ?? mobileViewport;

  const popupEnabled = effectiveMobile ? autoShowWelcomePopupMobile : autoShowWelcomePopup;

  useEffect(() => {
    if (!popupEnabled || open || popupDismissed) {
      setShowWelcomePopup(false);
      return;
    }

    const delayMs = Math.max(1, welcomePopupDelaySec) * 1000;
    const timer = window.setTimeout(() => setShowWelcomePopup(true), delayMs);
    return () => window.clearTimeout(timer);
  }, [popupEnabled, open, popupDismissed, welcomePopupDelaySec]);

  function handleOpen() {
    setOpen(true);
    setShowWelcomePopup(false);
    setPopupDismissed(true);
    setStoredPopupDismissed();
  }

  function handleClose() {
    setOpen(false);
    setShowWelcomePopup(false);
  }

  function handleDismissPopup() {
    setShowWelcomePopup(false);
    setPopupDismissed(true);
    setStoredPopupDismissed();
  }

  function handleLauncherClick() {
    if (open) {
      handleClose();
    } else {
      handleOpen();
    }
  }

  const panelWidth = effectiveMobile ? "w-[min(100%,320px)]" : "w-[380px]";
  const panelHeight = effectiveMobile ? "h-[min(520px,70dvh)]" : "h-[540px]";
  const bubbleSize = LAUNCHER_PX[launcherSize];

  useEffect(() => {
    if (contained || window.parent === window) return;

    const panelW = effectiveMobile ? 320 : 380;
    const panelH = effectiveMobile
      ? Math.min(520, Math.round(window.innerHeight * 0.7))
      : 540;
    const gap = 12;

    let width: number;
    let height: number;

    if (open) {
      width = panelW;
      height = panelH + gap + bubbleSize;
    } else if (showWelcomePopup) {
      width = effectiveMobile ? 260 : 220;
      height = 120 + gap + bubbleSize;
    } else {
      width = bubbleSize + 24;
      height = bubbleSize + 24;
    }

    window.parent.postMessage(
      {
        type: "anselio-widget-resize",
        width: `${width}px`,
        height: `${height}px`,
      },
      "*",
    );
  }, [open, showWelcomePopup, contained, effectiveMobile, bubbleSize]);

  return (
    <div
      className={cn(
        contained ? "absolute" : "fixed",
        "bottom-6 end-6 z-50 flex flex-col items-end gap-3 pointer-events-none",
        className,
      )}
    >
      {showWelcomePopup && !open ? (
        <div
          className={cn(
            "pointer-events-auto relative rounded-xl border border-hairline bg-surface-card shadow-md animate-in fade-in slide-in-from-bottom-2 duration-200",
            effectiveMobile ? "max-w-[260px]" : "max-w-[220px]",
          )}
        >
          <button
            type="button"
            onClick={handleDismissPopup}
            aria-label="Dismiss"
            className="absolute top-1.5 end-1.5 z-10 flex size-6 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-strong hover:text-ink"
          >
            <AppIcon icon={XIcon} className="size-3.5" strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={handleOpen}
            className="w-full px-3 py-2 pe-8 text-left text-sm"
          >
            <ChatMarkdown
              content={chatWidgetProps.welcomeMessage ?? "Hello! How can I help you today?"}
              variant="assistant"
            />
          </button>
        </div>
      ) : null}

      {open ? (
        <div
          className={cn(
            "pointer-events-auto flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200",
            panelWidth,
            panelHeight,
          )}
        >
          <ChatWidget
            {...chatWidgetProps}
            onMinimize={handleClose}
            className="h-full min-h-0 max-h-full shadow-[0_8px_32px_rgba(0,0,0,0.12)]"
            context={context}
          />
        </div>
      ) : null}

      <button
        type="button"
        onClick={handleLauncherClick}
        style={{ backgroundColor: bubbleColor }}
        className={cn(
          "pointer-events-auto flex items-center justify-center rounded-full text-white shadow-lg transition-all hover:opacity-90 active:scale-95",
          launcherSize === "lg" ? "size-16" : "size-14",
        )}
        aria-label={open ? "Close chat" : "Open chat"}
      >
        {open ? (
          <AppIcon
            icon={XIcon}
            className={launcherSize === "lg" ? "size-7" : "size-5"}
            strokeWidth={2}
          />
        ) : (
          <AppIcon
            icon={MessageCircle}
            className={launcherSize === "lg" ? "size-7" : "size-5"}
            strokeWidth={2}
          />
        )}
      </button>
    </div>
  );
}
