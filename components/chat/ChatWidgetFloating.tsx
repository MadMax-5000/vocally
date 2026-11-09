"use client";
import { AppIcon } from "@/components/ui/app-icon"
import { XIcon } from "@/lib/icons/app-icons"

import { useCallback, useEffect, useMemo, useRef, useState, type ComponentProps, type ReactNode } from "react";

import { ChatMarkdown } from "@/components/chat/ChatMarkdown";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { cn } from "@/lib/utils";

type ChatWidgetProps = ComponentProps<typeof ChatWidget>;

export type ChatWidgetLauncherSize = "md" | "lg";

export type ChatWidgetFloatingProps = Omit<
  ChatWidgetProps,
  | "className"
  | "onClear"
  | "onMinimize"
  | "dock"
  | "collapsed"
  | "panelOpen"
  | "onExpand"
  | "onOpenPanel"
  | "onCollapse"
  | "onDockWidthChange"
  | "launcherAccentColor"
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
  /** Default `md` (440px) matches customer embeds. `lg` (480px) is the first-party site launcher. */
  launcherSize?: ChatWidgetLauncherSize;
  privacyNote?: ReactNode;
};

type DockStage = "collapsed" | "launcher" | "chat";

const POPUP_DISMISS_KEY = "vocally-widget-popup-dismissed";

const LAUNCHER_MAX_WIDTH: Record<ChatWidgetLauncherSize, number> = {
  md: 440,
  lg: 480,
};

const BAR_HEIGHT = 52;
const PANEL_HEIGHT = 440;
const PANEL_HEIGHT_MOBILE = 400;
const PANEL_GAP = 10;
const LAUNCHER_SUGGESTIONS_HEIGHT = 130;
const PRIVACY_HEIGHT = 32;
const DOCK_COLLAPSED_MIN_WIDTH = 340;
const GUTTER = 20;
const POPUP_HEIGHT = 130;
const POPUP_MAX_WIDTH = 240;

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
  privacyNote,
  ...chatWidgetProps
}: ChatWidgetFloatingProps) {
  const [stage, setStage] = useState<DockStage>("collapsed");
  const [collapsedContentWidth, setCollapsedContentWidth] = useState(0);
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  const [popupDismissed, setPopupDismissed] = useState(getStoredPopupDismissed);
  const [mobileViewport, setMobileViewport] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const frameRef = useRef<{ width: number; height: number } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isMobile !== undefined) return;
    const mq = window.matchMedia("(max-width: 640px)");
    const update = () => setMobileViewport(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [isMobile]);

  useEffect(() => {
    const update = () => setViewportWidth(window.innerWidth);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    if (!contained) return;
    const parent = rootRef.current?.parentElement;
    if (!parent) return;
    const update = () => setContainerWidth(parent.clientWidth);
    update();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", update);
      return () => window.removeEventListener("resize", update);
    }
    const observer = new ResizeObserver(update);
    observer.observe(parent);
    return () => observer.disconnect();
  }, [contained]);

  const effectiveMobile = isMobile ?? mobileViewport;

  const popupEnabled = effectiveMobile ? autoShowWelcomePopupMobile : autoShowWelcomePopup;

  useEffect(() => {
    if (!popupEnabled || stage !== "collapsed" || popupDismissed) {
      setShowWelcomePopup(false);
      return;
    }

    const delayMs = Math.max(1, welcomePopupDelaySec) * 1000;
    const timer = window.setTimeout(() => setShowWelcomePopup(true), delayMs);
    return () => window.clearTimeout(timer);
  }, [popupEnabled, stage, popupDismissed, welcomePopupDelaySec]);

  const handleExpand = useCallback(() => {
    setStage("launcher");
    setShowWelcomePopup(false);
    setPopupDismissed(true);
    setStoredPopupDismissed();
  }, []);

  const handleOpenPanel = useCallback(() => {
    setStage("chat");
    setShowWelcomePopup(false);
    setPopupDismissed(true);
    setStoredPopupDismissed();
  }, []);

  const handleMinimize = useCallback(() => {
    setStage("launcher");
  }, []);

  const handleCollapse = useCallback(() => {
    setStage("collapsed");
  }, []);

  const handleDismissPopup = useCallback(() => {
    setShowWelcomePopup(false);
    setPopupDismissed(true);
    setStoredPopupDismissed();
  }, []);

  useEffect(() => {
    if (stage === "collapsed") return;

    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current?.contains(event.target as Node)) return;
      setStage("collapsed");
      setShowWelcomePopup(false);
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    return () =>
      document.removeEventListener("pointerdown", onPointerDown, true);
  }, [stage]);

  useEffect(() => {
    if (!showWelcomePopup) return;

    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current?.contains(event.target as Node)) return;
      handleDismissPopup();
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    return () =>
      document.removeEventListener("pointerdown", onPointerDown, true);
  }, [showWelcomePopup, handleDismissPopup]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== window.parent) return;
      const data = event.data as { type?: unknown } | null;
      if (data?.type !== "anselio-widget-dismiss") return;

      setStage("collapsed");
      setShowWelcomePopup(false);
      setPopupDismissed(true);
      setStoredPopupDismissed();
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const maxWidth = LAUNCHER_MAX_WIDTH[launcherSize];

  const { dockWidth, panelHeight } = useMemo(() => {
    const availableSpace =
      contained && containerWidth > 0
        ? containerWidth
        : viewportWidth > 0
          ? viewportWidth
          : maxWidth + GUTTER * 2;
    const available = availableSpace - (contained ? 24 : GUTTER * 2);
    const baseWidth = Math.max(240, Math.min(maxWidth, available));
    return {
      dockWidth: effectiveMobile ? Math.min(baseWidth, 360) : baseWidth,
      panelHeight:
        effectiveMobile || available < 520 ? PANEL_HEIGHT_MOBILE : PANEL_HEIGHT,
    };
  }, [contained, containerWidth, maxWidth, viewportWidth, effectiveMobile]);

  const hasPrivacyNote = Boolean(privacyNote);
  const hasConfiguredSuggestions = Boolean(
    chatWidgetProps.suggestedMessagesAction?.enabled &&
      (chatWidgetProps.suggestedMessagesAction.staticStarters ?? []).some((starter) =>
        starter.trim(),
      ),
  );

  const measuredCollapsed =
    collapsedContentWidth > 0 ? collapsedContentWidth : DOCK_COLLAPSED_MIN_WIDTH;
  const collapsedWidth = Math.min(
    dockWidth,
    Math.max(DOCK_COLLAPSED_MIN_WIDTH, measuredCollapsed),
  );
  const contentWidth = stage === "collapsed" ? collapsedWidth : dockWidth;

  const privacyHeight = hasPrivacyNote ? PRIVACY_HEIGHT : 0;
  const contentHeight =
    stage === "collapsed"
      ? BAR_HEIGHT + privacyHeight
      : stage === "chat"
        ? panelHeight + PANEL_GAP + BAR_HEIGHT + privacyHeight
        : (hasConfiguredSuggestions ? LAUNCHER_SUGGESTIONS_HEIGHT : 0) +
          BAR_HEIGHT +
          privacyHeight;

  const popupExtra =
    stage === "collapsed" && showWelcomePopup ? POPUP_HEIGHT + 12 : 0;
  const frameWidth =
    Math.max(
      contentWidth,
      stage === "collapsed" && showWelcomePopup ? POPUP_MAX_WIDTH : 0,
    ) +
    GUTTER * 2;
  const frameHeight = contentHeight + popupExtra + GUTTER * 2;

  useEffect(() => {
    if (contained || typeof window === "undefined" || window.parent === window) {
      return;
    }

    const target = {
      width: Math.round(frameWidth),
      height: Math.round(frameHeight),
    };
    const previous = frameRef.current;

    const post = () => {
      window.parent.postMessage(
        {
          type: "anselio-widget-resize",
          width: `${target.width}px`,
          height: `${target.height}px`,
        },
        "*",
      );
      frameRef.current = target;
    };

    if (!previous) {
      post();
      return;
    }

    /* Keep the iframe at its old size until the closing animation finishes. */
    if (target.width < previous.width || target.height < previous.height) {
      const timer = window.setTimeout(post, 320);
      return () => window.clearTimeout(timer);
    }

    post();
  }, [contained, frameWidth, frameHeight]);

  return (
    <div
      ref={rootRef}
      className={cn(
        contained ? "absolute" : "fixed",
        "z-50 flex flex-col items-end gap-3 pointer-events-none",
        className,
      )}
      style={{
        bottom: contained ? 12 : GUTTER,
        insetInlineEnd: contained ? 12 : GUTTER,
      }}
    >
      {showWelcomePopup && stage === "collapsed" ? (
        <div
          className={cn(
            "pointer-events-auto relative rounded-2xl border border-hairline bg-surface-card shadow-[0_4px_16px_rgba(0,0,0,0.04)] animate-in fade-in slide-in-from-bottom-2 duration-200",
            effectiveMobile ? "max-w-[260px]" : "max-w-[240px]",
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
            onClick={handleExpand}
            dir="auto"
            className="w-full px-3 py-2 pe-8 text-start text-sm"
          >
            <ChatMarkdown
              content={chatWidgetProps.welcomeMessage ?? "Hello! How can I help you today?"}
              variant="assistant"
            />
          </button>
        </div>
      ) : null}

      <div
        className="pointer-events-auto transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
        style={{ width: `${contentWidth}px` }}
      >
        <ChatWidget
          {...chatWidgetProps}
          dock
          collapsed={stage === "collapsed"}
          panelOpen={stage === "chat"}
          onExpand={handleExpand}
          onOpenPanel={handleOpenPanel}
          onMinimize={handleMinimize}
          onCollapse={handleCollapse}
          onDockWidthChange={setCollapsedContentWidth}
          panelHeight={panelHeight}
          privacyNote={privacyNote}
          primaryColor={chatWidgetProps.primaryColor ?? bubbleColor}
          launcherAccentColor={bubbleColor}
          context={context}
        />
      </div>
    </div>
  );
}
