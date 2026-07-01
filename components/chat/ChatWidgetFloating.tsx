"use client";
import { AppIcon } from "@/components/ui/app-icon"
import { MessageCircle, XIcon } from "@/lib/icons/app-icons"

import { useEffect, useState, type ComponentProps } from "react";

import { ChatMarkdown } from "@/components/chat/ChatMarkdown";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { cn } from "@/lib/utils";

type ChatWidgetProps = ComponentProps<typeof ChatWidget>;

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
};

export function ChatWidgetFloating({
  bubbleColor,
  autoShowWelcomePopup = false,
  autoShowWelcomePopupMobile = false,
  welcomePopupDelaySec = 3,
  contained = false,
  isMobile,
  className,
  ...chatWidgetProps
}: ChatWidgetFloatingProps) {
  const [open, setOpen] = useState(false);
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  const [popupDismissed, setPopupDismissed] = useState(false);
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
  }

  function handleClose() {
    setOpen(false);
    setShowWelcomePopup(false);
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

  useEffect(() => {
    if (contained || window.parent === window) return;

    const panelW = effectiveMobile ? 320 : 380;
    const panelH = effectiveMobile
      ? Math.min(520, Math.round(window.innerHeight * 0.7))
      : 540;
    const bubbleSize = 56;
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
        type: "vocally-widget-resize",
        width: `${width}px`,
        height: `${height}px`,
      },
      "*",
    );
  }, [open, showWelcomePopup, contained, effectiveMobile]);

  return (
    <div
      className={cn(
        contained ? "absolute" : "fixed",
        "bottom-6 right-6 z-50 flex flex-col items-end gap-3 pointer-events-none",
        className,
      )}
    >
      {showWelcomePopup && !open ? (
        <button
          type="button"
          onClick={handleOpen}
          className={cn(
            "pointer-events-auto rounded-xl border border-hairline bg-surface-card px-3 py-2 text-left text-sm shadow-md transition-opacity animate-in fade-in slide-in-from-bottom-2 duration-200",
            effectiveMobile ? "max-w-[260px]" : "max-w-[220px]",
          )}
        >
          <ChatMarkdown
            content={chatWidgetProps.welcomeMessage ?? "Hello! How can I help you today?"}
            variant="assistant"
          />
        </button>
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
          />
        </div>
      ) : null}

      <button
        type="button"
        onClick={handleLauncherClick}
        style={{ backgroundColor: bubbleColor }}
        className="pointer-events-auto flex size-14 items-center justify-center rounded-full text-white shadow-lg transition-all hover:opacity-90 active:scale-95"
        aria-label={open ? "Close chat" : "Open chat"}
      >
        {open ? (
          <AppIcon icon={XIcon} className="size-5" strokeWidth={2} />
        ) : (
          <AppIcon icon={MessageCircle} className="size-5" strokeWidth={2} />
        )}
      </button>
    </div>
  );
}
