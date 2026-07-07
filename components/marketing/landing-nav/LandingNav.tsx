"use client";

import type { ReactNode } from "react";

import { LandingNavProvider } from "./LandingNavContext";
import { LandingNavDesktop } from "./LandingNavDesktop";
import { LandingNavMegaPanel } from "./LandingNavMegaPanel";
import { LandingNavMobile } from "./LandingNavMobile";

type LandingNavShellProps = {
  children: ReactNode;
};

export function LandingNavShell({ children }: LandingNavShellProps) {
  return (
    <LandingNavProvider>
      <LandingNavDesktop />
      <LandingNavMegaPanel />
      <LandingNavMobile />
      {children}
    </LandingNavProvider>
  );
}

export { LandingNavDesktop } from "./LandingNavDesktop";
export { LandingNavMegaPanel } from "./LandingNavMegaPanel";
export { LandingNavMobile } from "./LandingNavMobile";
export { LandingNavProvider } from "./LandingNavContext";
