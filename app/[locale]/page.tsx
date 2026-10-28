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

export default function HomePage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  return (
    <main className="min-h-dvh overflow-x-clip bg-canvas text-ink">
      <JsonLd data={softwareApplicationJsonLd(locale)} />
      <LandingHomeHeader />
      <LandingHero />
      <ScrollReveal id="solutions">
        <ThreeWaysSection />
      </ScrollReveal>
      <AgentLifecycle />
      <ScrollReveal>
        <SecuritySection />
      </ScrollReveal>
      <ScrollReveal>
        <IndustryStage />
      </ScrollReveal>
      <ScrollReveal>
        <LandingPricingSection />
      </ScrollReveal>
      <ScrollReveal>
        <FaqSection />
      </ScrollReveal>
      <ScrollReveal>
        <FinalCtaSection />
      </ScrollReveal>
      <ScrollReveal intensity="light">
        <MarketingFooter />
      </ScrollReveal>
    </main>
  );
}
