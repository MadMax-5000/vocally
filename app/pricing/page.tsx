import Link from "next/link";
import { Check } from "lucide-react";

import { auth } from "@clerk/nextjs/server";
import { PLAN_META, PLAN_PRICES } from "@/lib/billing/plan-features";
import { formatPrice } from "@/lib/billing/currency";
import { detectCurrency } from "@/lib/billing/detect-currency";
import { HeaderAuth } from "@/components/marketing/HeaderAuth";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";

const container = "mx-auto w-full max-w-[1200px] px-6";

export default async function PricingPage() {
  const { userId, orgId } = await auth();
  const signedIn = !!userId;

  const currency = detectCurrency();

  const plans = [
    {
      ...PLAN_META.STARTER,
      price: PLAN_PRICES.STARTER,
    },
    {
      ...PLAN_META.PRO,
      price: PLAN_PRICES.PRO,
    },
    {
      ...PLAN_META.ENTERPRISE,
      price: null,
    },
  ];

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
          Simple plans for AI-first contact centers
        </h1>
        <p className="mt-6 max-w-[62ch] text-body-md leading-relaxed text-body text-pretty">
          Prices are shown in {currency.code === "MAD" ? "Moroccan Dirham (MAD)" : "USD"}.
          All plans include a 14-day free trial — no credit card required.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {plans.map((plan) => {
            const isPro = plan.key === "pro";
            const rawPrice = plan.price !== null
              ? (currency.code === "MAD" ? plan.price.madCents : plan.price.usdCents)
              : null;
            const formattedPrice = rawPrice !== null ? formatPrice(rawPrice, currency.code) : null;

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
                  {plan.key === "enterprise" && !rawPrice ? "Custom" : formattedPrice}
                </p>
                {plan.key !== "enterprise" && (
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
                          <Check className="h-3 w-3" aria-hidden="true" />
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
                </div>

                <Link
                  href={ctaHref()}
                  className={`mt-8 block w-full rounded-md px-4 py-2.5 text-center text-button tracking-wide transition-colors ${
                    isPro
                      ? "bg-white text-primary hover:bg-white/90"
                      : "bg-ink text-on-primary hover:bg-body-strong"
                  }`}
                >
                  Get started
                </Link>
              </article>
            );
          })}
        </div>
      </div>
    </main>
  );
}
