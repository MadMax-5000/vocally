import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { HeaderAuth } from "@/components/marketing/HeaderAuth";

import { LandingNavDesktop } from "./LandingNavDesktop";
import { LandingNavMobile } from "./LandingNavMobile";

export function LandingHomeHeader() {
  return (
    <MarketingHeader
      tone="overlay"
      center={<LandingNavDesktop tone="overlay" />}
    >
      <LandingNavMobile tone="overlay" />
      <HeaderAuth tone="overlay" />
    </MarketingHeader>
  );
}
