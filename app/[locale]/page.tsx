import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";

import { LandingHomeHeader } from "@/components/marketing/landing-nav/LandingHomeHeader";
import { RotatingWord } from "@/components/marketing/RotatingWord";
import { HeroVoiceSpheres } from "@/components/marketing/HeroVoiceSpheres";
import { BentoShowcase } from "@/components/marketing/BentoShowcase";
import { TrustShowcase } from "@/components/marketing/TrustShowcase";
import { PricingShowcase } from "@/components/marketing/PricingShowcase";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

const container = "mx-auto w-full max-w-[1200px] px-4";

function SectionLabel({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="text-caption-uppercase text-muted">
      {children}
    </div>
  );
}

function Card({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "rounded-xl border border-hairline bg-surface-card",
        "shadow-[0_1px_0_rgba(12,10,9,0.02)]",
        className ?? ""
      ].join(" ")}
    >
      {children}
    </div>
  );
}

export default async function HomePage() {
  const t = await getTranslations("landing.hero");
  const c = await getTranslations("common");
  const tw = await getTranslations("landing.rotatingWords");

  const rotatingNouns = [
    tw("bakery"),
    tw("clinic"),
    tw("agency"),
    tw("salons"),
    tw("lawyer"),
    tw("stores")
  ];

  return (
    <main className="min-h-dvh overflow-x-clip bg-canvas text-ink">
      <LandingHomeHeader />

      <section className="min-h-[calc(100dvh-4rem)] py-12">
        <div className={[container, "relative flex min-h-[calc(100dvh-4rem-8rem)] items-center justify-center"].join(" ")}>
          <div className="flex max-w-[1000px] flex-col items-center pb-24 text-center">
            <h1 className="font-display text-display-xl tracking-tighter text-balance md:text-display-mega">
              {t("titlePart1")}{" "}
              <span className="text-primary underline decoration-secondary/70 underline-offset-[0.18em]">
                <RotatingWord words={rotatingNouns} />
              </span>
            </h1>
            <p className="mt-5 max-w-[62ch] text-body-md leading-relaxed text-body text-pretty">
              {t("subtitle")}
            </p>

            <div className="mt-8 flex w-full flex-col items-center gap-2 sm:w-auto">
              <Link className="btn-primary w-full justify-center sm:w-auto" href="/sign-up">
                {t("tryForFree")}
              </Link>
              <div className="text-body-sm text-muted">{t("noCreditCard")}</div>
            </div>

            <HeroVoiceSpheres />
          </div>
        </div>
      </section>

      <BentoShowcase />
      <TrustShowcase />
      <PricingShowcase />

      <MarketingFooter />
    </main>
  );
}

