"use client";

import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { HeaderAuth } from "@/components/marketing/HeaderAuth";
import { LanguageSwitcher } from "@/components/marketing/LanguageSwitcher";

import { LandingNavProvider } from "./LandingNavContext";
import { LandingNavDesktop } from "./LandingNavDesktop";
import { LandingNavMegaPanel } from "./LandingNavMegaPanel";
import { LandingNavMobile } from "./LandingNavMobile";

export function LandingHomeHeader() {
  return (
    <LandingNavProvider>
      <MarketingHeader
        sticky
        center={<LandingNavDesktop />}
        megaMenu={<LandingNavMegaPanel />}
      >
        <LandingNavMobile />
        <LanguageSwitcher />
        <HeaderAuth />
      </MarketingHeader>
    </LandingNavProvider>
  );
}
