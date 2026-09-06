import { LandingHomeHeader } from "@/components/marketing/landing-nav/LandingHomeHeader";
import { LandingHero } from "@/components/marketing/LandingHero";
import { TrustShowcase } from "@/components/marketing/TrustShowcase";
import { AgentLifecycle } from "@/components/marketing/agent-lifecycle/AgentLifecycle";
import { DeployChannels } from "@/components/marketing/deploy-channels/DeployChannels";
import { Industries } from "@/components/marketing/industries/Industries";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";
import { JsonLd } from "@/components/seo/JsonLd";
import { softwareApplicationJsonLd } from "@/lib/seo/json-ld";
import { localizedPageMetadata } from "@/lib/seo/metadata";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  return localizedPageMetadata(locale, "home");
}

export default function HomePage() {
  return (
    <main className="min-h-dvh overflow-x-clip bg-canvas text-ink">
      <JsonLd data={softwareApplicationJsonLd()} />
      <LandingHomeHeader />
      <LandingHero />
      <ScrollReveal minHeight={720}>
        <TrustShowcase />
      </ScrollReveal>
      <ScrollReveal minHeight={640}>
        <AgentLifecycle />
      </ScrollReveal>
      <ScrollReveal minHeight={680}>
        <DeployChannels />
      </ScrollReveal>
      <ScrollReveal minHeight={640}>
        <Industries />
      </ScrollReveal>
      <ScrollReveal minHeight={360} intensity="light">
        <MarketingFooter />
      </ScrollReveal>
    </main>
  );
}
