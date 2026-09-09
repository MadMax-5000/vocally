import { LandingHomeHeader } from "@/components/marketing/landing-nav/LandingHomeHeader";
import { LandingHero } from "@/components/marketing/LandingHero";
import { TrustShowcase } from "@/components/marketing/TrustShowcase";
import { BoldStatsSection } from "@/components/marketing/BoldStatsSection";
import { StackSpreadSection } from "@/components/marketing/stack-spread/StackSpreadSection";
import { AgentLifecycle } from "@/components/marketing/agent-lifecycle/AgentLifecycle";
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
      <AgentLifecycle />
      <StackSpreadSection />
      <ScrollReveal minHeight={480}>
        <BoldStatsSection />
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
