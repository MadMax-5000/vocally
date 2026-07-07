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

const CLOSE_DELAY_MS = 160;

type LandingNavContextValue = {
  activeMega: MegaId | null;
  openMega: (id: MegaId) => void;
  scheduleClose: () => void;
  cancelClose: () => void;
  closeMega: () => void;
};

const LandingNavContext = createContext<LandingNavContextValue | null>(null);

export function useLandingNav() {
  const ctx = useContext(LandingNavContext);
  if (!ctx) {
    throw new Error("useLandingNav must be used within LandingNavProvider");
  }
  return ctx;
}

export function LandingNavProvider({ children }: { children: ReactNode }) {
  const [activeMega, setActiveMega] = useState<MegaId | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelClose = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const closeMega = useCallback(() => {
    cancelClose();
    setActiveMega(null);
  }, [cancelClose]);

  const openMega = useCallback(
    (id: MegaId) => {
      cancelClose();
      setActiveMega(id);
    },
    [cancelClose],
  );

  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimer.current = setTimeout(() => {
      setActiveMega(null);
    }, CLOSE_DELAY_MS);
  }, [cancelClose]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeMega();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeMega]);

  useEffect(() => {
    return () => cancelClose();
  }, [cancelClose]);

  return (
    <LandingNavContext.Provider
      value={{
        activeMega,
        openMega,
        scheduleClose,
        cancelClose,
        closeMega,
      }}
    >
      {children}
    </LandingNavContext.Provider>
  );
}
