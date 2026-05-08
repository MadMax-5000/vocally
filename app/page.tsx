import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import {
  Gauge,
  Zap
} from "lucide-react";

import { RotatingWord } from "@/components/marketing/RotatingWord";
import { HeroVoiceSpheres } from "@/components/marketing/HeroVoiceSpheres";
import { BentoShowcase } from "@/components/marketing/BentoShowcase";
import { TrustShowcase } from "@/components/marketing/TrustShowcase";
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
      <header className="sticky top-0 z-50 border-b border-hairline bg-canvas/85 backdrop-blur">
        <div className={[container, "flex h-16 items-center justify-between"].join(" ")}>
          <a
            href="/"
            className="group inline-flex items-center gap-2 rounded-md px-2 py-1 transition hover:bg-surface-strong"
            aria-label="Vocally"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-strong">
              <Gauge className="h-4 w-4 text-ink" aria-hidden="true" />
            </span>
            <span className="font-display text-title-md tracking-tight">Vocally</span>
          </a>

          <div className="flex items-center gap-3">
            <SignedOut>
              <a className="btn-primary" href="/dashboard">
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
        </div>
      </header>

      <section className="min-h-[calc(100dvh-4rem)] py-12">
        <div className={[container, "relative flex min-h-[calc(100dvh-4rem-8rem)] items-center justify-center"].join(" ")}>
          <div className="flex max-w-[980px] flex-col items-center pb-24 text-center">
            <h1 className="font-display text-display-xl tracking-tighter text-balance md:text-display-mega">
              AI Agents that take care of your{" "}
              <span className="text-primary underline decoration-secondary/70 underline-offset-[0.18em]">
                <RotatingWord words={rotatingNouns} />
              </span>
            </h1>
            <p className="mt-5 max-w-[62ch] text-body-md leading-relaxed text-body text-pretty">
              Upfirst is the AI answering service that keeps your phone covered so you never miss a lead or leave a customer
              waiting.
            </p>

            <div className="mt-8 flex w-full flex-col items-center gap-2 sm:w-auto">
              <a className="btn-primary w-full justify-center sm:w-auto" href="/dashboard">
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

      <MarketingFooter />
    </main>
  );
}

