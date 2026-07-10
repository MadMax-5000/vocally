"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import type { MegaId } from "./landing-nav-data";

const CLOSE_DELAY_MS = 120;

type LandingNavContextValue = {
  /** Which mega panel is currently showing content (null only briefly during close). */
  activeMega: MegaId | null;
  /** Whether the panel shell is visible. Separate from activeMega so the shell
   *  stays mounted while content fades out, preventing layout jumps. */
  isOpen: boolean;
  /** Slide direction for content swap: +1 = right, -1 = left, 0 = first open */
  direction: number;
  openMega: (id: MegaId) => void;
  scheduleClose: () => void;
  cancelClose: () => void;
  closeMega: () => void;
};

const LandingNavContext = createContext<LandingNavContextValue | null>(null);

export function useLandingNav(): LandingNavContextValue {
  const ctx = useContext(LandingNavContext);
  if (!ctx) throw new Error("useLandingNav must be used within LandingNavProvider");
  return ctx;
}

const MEGA_ORDER: MegaId[] = ["solutions", "resources"];

export function LandingNavProvider({ children }: { children: ReactNode }) {
  const [activeMega, setActiveMega] = useState<MegaId | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [direction, setDirection] = useState(0);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelClose = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const closeMega = useCallback(() => {
    cancelClose();
    setIsOpen(false);
    // Keep activeMega set a moment longer so exit animation can play with content
    setTimeout(() => setActiveMega(null), 200);
  }, [cancelClose]);

  const openMega = useCallback(
    (id: MegaId) => {
      cancelClose();
      setDirection((prev) => {
        if (!activeMega) return 0;
        const prevIdx = MEGA_ORDER.indexOf(activeMega);
        const nextIdx = MEGA_ORDER.indexOf(id);
        return nextIdx > prevIdx ? 1 : -1;
      });
      setActiveMega(id);
      setIsOpen(true);
    },
    [cancelClose, activeMega],
  );

  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimer.current = setTimeout(closeMega, CLOSE_DELAY_MS);
  }, [cancelClose, closeMega]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeMega();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeMega]);

  useEffect(() => {
    return () => cancelClose();
  }, [cancelClose]);

  return (
    <LandingNavContext.Provider
      value={{ activeMega, isOpen, direction, openMega, scheduleClose, cancelClose, closeMega }}
    >
      {children}
    </LandingNavContext.Provider>
  );
}
