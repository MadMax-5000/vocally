import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Zap } from "lucide-react";

import { MarketingHeader } from "@/components/marketing/MarketingHeader";
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

export default function HomePage() {
  const rotatingNouns = [
    "bakery",
    "clinic",
    "agency",
    "salons",
    "lawyer",
    "stores"
  ];

  return (
    <main className="min-h-dvh overflow-x-clip bg-canvas text-ink">
      <MarketingHeader sticky>
        <div className="flex items-center gap-3">
          <SignedOut>
            <a className="btn-primary" href="/sign-up">
              Get started
            </a>
            <SignInButton>
              <button className="btn-outline" type="button">
                Sign in
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <a className="btn-outline" href="/dashboard">
              Dashboard
            </a>
            <UserButton />
          </SignedIn>
        </div>
      </MarketingHeader>

      <section className="min-h-[calc(100dvh-4rem)] py-12">
        <div className={[container, "relative flex min-h-[calc(100dvh-4rem-8rem)] items-center justify-center"].join(" ")}>
          <div className="flex max-w-[1000px] flex-col items-center pb-24 text-center">
            <h1 className="font-display text-display-xl tracking-tighter text-balance md:text-display-mega">
              AI Agents that take care of your{" "}
              <span className="text-primary underline decoration-secondary/70 underline-offset-[0.18em]">
                <RotatingWord words={rotatingNouns} />
              </span>
            </h1>
            <p className="mt-5 max-w-[62ch] text-body-md leading-relaxed text-body text-pretty">
              AI agents that deliver premium customer experiences — handling up to 80% of your support so you can focus on what matters.
            </p>

            <div className="mt-8 flex w-full flex-col items-center gap-2 sm:w-auto">
              <a className="btn-primary w-full justify-center sm:w-auto" href="/sign-up">
                Try for free
              </a>
              <div className="text-body-sm text-muted">No credit card required</div>
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

