import { LandingHomeHeader } from "@/components/marketing/landing-nav/LandingHomeHeader";
import { LandingHero } from "@/components/marketing/LandingHero";
import { ThreeWaysSection } from "@/components/marketing/three-ways/ThreeWaysSection";
import { AgentLifecycle } from "@/components/marketing/agent-lifecycle/AgentLifecycle";
import { IndustryStage } from "@/components/marketing/industry-stage/IndustryStage";
import { LandingPricingSection } from "@/components/marketing/pricing/LandingPricingSection";
import { SecuritySection } from "@/components/marketing/security/SecuritySection";
import { FaqSection } from "@/components/marketing/faq/FaqSection";
import { FinalCtaSection } from "@/components/marketing/cta/FinalCtaSection";
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
      <ScrollReveal id="solutions" minHeight={720}>
        <ThreeWaysSection />
      </ScrollReveal>
      <AgentLifecycle />
      <ScrollReveal minHeight={560}>
        <SecuritySection />
      </ScrollReveal>
      <ScrollReveal minHeight={900}>
        <IndustryStage />
      </ScrollReveal>
      <ScrollReveal minHeight={860}>
        <LandingPricingSection />
      </ScrollReveal>
      <ScrollReveal minHeight={560}>
        <FaqSection />
      </ScrollReveal>
      <ScrollReveal minHeight={520}>
        <FinalCtaSection />
      </ScrollReveal>
      <ScrollReveal minHeight={360} intensity="light">
        <MarketingFooter />
      </ScrollReveal>
    </main>
  );
}
