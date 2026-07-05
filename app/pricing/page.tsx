import { BRAND_EMAILS } from "@/lib/constants/brand";
import Link from "next/link";
import { AppIcon } from "@/components/ui/app-icon"
import { CheckIcon, ArrowUpRightIcon } from "@/lib/icons/app-icons"

import { auth } from "@clerk/nextjs/server";
import { PLAN_META, PLAN_PRICES } from "@/lib/billing/plan-features";
import { formatPrice } from "@/lib/billing/currency";
import { getOverageRate } from "@/lib/billing/overage";
import { HeaderAuth } from "@/components/marketing/HeaderAuth";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";

const container = "mx-auto w-full max-w-[1200px] px-6";

export default async function PricingPage() {
  const { userId, orgId } = await auth();
  const signedIn = !!userId;

  const plans = [
    {
      ...PLAN_META.FREE,
      price: PLAN_PRICES.FREE,
    },
    {
      ...PLAN_META.STARTER,
      price: PLAN_PRICES.STARTER,
    },
    {
      ...PLAN_META.PRO,
      price: PLAN_PRICES.PRO,
    },
  ];

  function overageDisplay(planKey: string): string | null {
    const rate = getOverageRate(planKey);
    if (rate === 0) return null;
    return `+ ${rate} DH/min after plan limit`;
  }

  function ctaHref(): string {
    if (!signedIn) return "/sign-up";
    return orgId ? "/dashboard/billing" : "/onboarding";
  }

  return (
    <main className="min-h-dvh bg-canvas text-ink">
      <MarketingHeader>
        <HeaderAuth />
      </MarketingHeader>

      <div className={[container, "py-section"].join(" ")}>
        <p className="text-caption-uppercase text-muted">Pricing</p>
        <h1 className="mt-4 font-display text-display-xl tracking-tighter text-balance text-ink md:text-display-mega">
          Simple plans for premium AI-powered customer experiences
        </h1>
        <p className="mt-6 max-w-[62ch] text-body-md leading-relaxed text-body text-pretty">
          All prices in Moroccan Dirham (MAD). Includes a 14-day free trial — no credit card required.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {plans.map((plan) => {
            const isPro = plan.key === "pro";
            const isFree = plan.key === "free";
            const rawPrice = plan.price !== null ? plan.price.madCents : null;
            const showPrice = isFree ? "Free" : (
              rawPrice !== null ? formatPrice(rawPrice) : null
            );

            return (
              <article
                key={plan.key}
                className={`flex flex-col rounded-xxl border p-8 ${
                  isPro
                    ? "border-2 border-white/20 bg-primary"
                    : "border-hairline bg-surface-card"
                }`}
              >
                {isPro && (
                  <span className="mb-4 inline-flex self-start items-center rounded-full bg-white/90 px-3 py-[2px] text-xs font-semibold text-primary ring-1 ring-inset ring-white/20">
                    Recommended
                  </span>
                )}

                <h2 className={`font-display text-display-sm tracking-tighter ${isPro ? "text-on-primary" : "text-ink"}`}>
                  {plan.name}
                </h2>
                <p className={`mt-2 text-body-sm leading-relaxed ${isPro ? "text-on-primary/80" : "text-body"}`}>
                  {plan.description}
                </p>

                <p className={`mt-6 font-display text-display-md tracking-tighter ${isPro ? "text-on-primary" : "text-ink"}`}>
                  {showPrice}
                </p>
                {!isFree && (
                  <p className={`mt-1 text-caption ${isPro ? "text-on-primary/70" : "text-muted"}`}>
                    per month, billed monthly
                  </p>
                )}

                <div className="mt-8 flex-1">
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature.text} className="flex items-start gap-3">
                        <span
                          className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                            isPro
                              ? feature.included
                                ? "bg-white/20 text-on-primary"
                                : "bg-white/10 text-on-primary/40"
                              : feature.included
                                ? "bg-primary/10 text-primary"
                                : "bg-surface-strong text-muted-soft"
                          }`}
                        >
                          <AppIcon icon={CheckIcon} className="h-3 w-3" aria-hidden="true" />
                        </span>
                        <span
                          className={`text-body-sm leading-snug ${
                            isPro
                              ? feature.included
                                ? "text-on-primary/90"
                                : "text-on-primary/50"
                              : feature.included
                                ? "text-body"
                                : "text-muted-soft"
                          }`}
                        >
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {overageDisplay(plan.key) && (
                    <p className={`mt-4 text-caption leading-relaxed ${isPro ? "text-on-primary/60" : "text-muted-soft"}`}>
                      {overageDisplay(plan.key)}
                    </p>
                  )}
                </div>

                <Link
                  href={ctaHref()}
                  className={`mt-8 block w-full rounded-md px-4 py-2.5 text-center text-button tracking-wide transition-colors ${
                    isPro
                      ? "bg-white text-primary hover:bg-white/90"
                      : "bg-ink text-on-primary hover:bg-body-strong"
                  }`}
                >
                  {isFree ? "Start free trial" : "Get started"}
                </Link>
              </article>
            );
          })}
        </div>

        <section className="mt-12 flex flex-col items-start gap-6 rounded-xxl border border-hairline bg-surface-card p-8 md:flex-row md:items-center md:justify-between md:p-10">
          <div>
            <h2 className="font-display text-display-sm tracking-tighter text-ink">Enterprise</h2>
            <p className="mt-1 text-body-sm leading-relaxed text-body">
              Custom plan for your organization.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                "Unlimited agents",
                "Custom call volume",
                "On-premise",
                "Law 09-08 compliance",
                "Dedicated manager",
              ].map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-hairline bg-surface-strong px-3 py-1 text-caption text-ink"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <Link
            href={`mailto:${BRAND_EMAILS.sales}`}
            className="inline-flex shrink-0 items-center gap-2 rounded-md bg-ink px-6 py-3 text-button text-on-primary transition-colors hover:bg-body-strong"
          >
            Contact sales
            <AppIcon icon={ArrowUpRightIcon} className="h-4 w-4" />
          </Link>
        </section>
      </div>
    </main>
  );
}
