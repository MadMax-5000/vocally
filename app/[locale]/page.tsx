import { LandingHomeHeader } from "@/components/marketing/landing-nav/LandingHomeHeader";
import { LandingHero } from "@/components/marketing/LandingHero";
import { BentoShowcase } from "@/components/marketing/BentoShowcase";
import { TrustShowcase } from "@/components/marketing/TrustShowcase";
import { AgentLifecycle } from "@/components/marketing/agent-lifecycle/AgentLifecycle";
import { DeployChannels } from "@/components/marketing/deploy-channels/DeployChannels";
import { Industries } from "@/components/marketing/industries/Industries";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

export default function HomePage() {
  return (
    <main className="min-h-dvh overflow-x-clip bg-canvas text-ink">
      <LandingHomeHeader />
      <LandingHero />
      <TrustShowcase />
      <AgentLifecycle />
      <DeployChannels />
      <Industries />
      <BentoShowcase />
      <MarketingFooter />
    </main>
  );
}
