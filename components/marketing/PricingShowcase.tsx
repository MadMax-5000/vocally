import "server-only";
import { Link } from "@/i18n/routing";
import { auth } from "@clerk/nextjs/server";
import { getTranslations } from "next-intl/server";
import { AppIcon } from "@/components/ui/app-icon"
import { CheckIcon, ArrowUpRightIcon } from "@/lib/icons/app-icons"

import { PLAN_PRICES } from "@/lib/billing/plan-features";
import { getLocalizedPlanMeta } from "@/lib/billing/get-plan-meta";
import { formatPrice } from "@/lib/billing/currency";

const container = "mx-auto w-full max-w-[1200px] px-6";

export async function PricingShowcase() {
  const { userId } = await auth();
  const signedIn = !!userId;
  const t = await getTranslations("pricing");
  const tp = await getTranslations("plans");
  const tc = await getTranslations("common");

  const localizedPlanMeta = getLocalizedPlanMeta(tp);

  const plans = [
    {
      ...localizedPlanMeta.FREE,
      price: PLAN_PRICES.FREE,
    },
    {
      ...localizedPlanMeta.STARTER,
      price: PLAN_PRICES.STARTER,
    },
    {
      ...localizedPlanMeta.PRO,
      price: PLAN_PRICES.PRO,
    },
  ];

  const ctaHref = signedIn ? "/dashboard/billing" : "/sign-up";

  return (
    <section className="border-t border-hairline bg-canvas py-section">
      <div className={container}>
        <div className="max-w-[800px]">
          <div className="text-caption-uppercase text-muted">Pricing</div>
          <h2 className="mt-4 font-display text-display-lg tracking-tighter text-ink text-balance md:text-display-xl">
            {t("title")}
          </h2>
          <p className="mt-4 max-w-[62ch] text-body-md leading-relaxed text-body text-pretty">
            {tc("allPricesMad")}
          </p>
          <Link
            href="/pricing"
            className="mt-6 inline-flex h-9 items-center rounded-md bg-ink px-4 py-1.5 text-button text-on-primary transition-colors hover:bg-body-strong"
          >
            {tc("viewAllPlans")}
          </Link>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {plans.map((plan) => {
            const isPro = plan.key === "pro";
            const isFree = plan.key === "free";
            const rawPrice = plan.price !== null ? plan.price.madCents : null;
            const showPrice = isFree ? t("free") : (
              rawPrice !== null ? formatPrice(rawPrice) : null
            );

            return (
              <div
                key={plan.key}
                className={`flex flex-col rounded-xxl border p-8 ${
                  isPro
                    ? "border-2 border-white/20 bg-primary"
                    : "border-hairline bg-surface-card"
                }`}
              >
                {isPro && (
                  <span className="mb-4 inline-flex self-start items-center rounded-full bg-white/90 px-3 py-[2px] text-xs font-semibold text-primary ring-1 ring-inset ring-white/20">
                    {t("recommended")}
                  </span>
                )}

                <h3 className={`font-display text-display-sm tracking-tighter ${isPro ? "text-on-primary" : "text-ink"}`}>
                  {plan.name}
                </h3>
                <p className={`mt-2 text-body-sm leading-relaxed ${isPro ? "text-on-primary/80" : "text-body"}`}>
                  {plan.description}
                </p>

                <p className={`mt-6 font-display text-display-md tracking-tighter ${isPro ? "text-on-primary" : "text-ink"}`}>
                  {showPrice}
                </p>
                {!isFree && (
                  <p className={`mt-1 text-caption ${isPro ? "text-on-primary/70" : "text-muted"}`}>
                    {t("perMonth")}
                  </p>
                )}

                <div className="mt-8 flex-1">
                  <ul className="space-y-3">
                    {plan.features.map((feature: any) => (
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
                </div>

                <Link
                  href={ctaHref}
                  className={`mt-8 block w-full rounded-md px-4 py-2.5 text-center text-button tracking-wide transition-colors ${
                    isPro
                      ? "bg-white text-primary hover:bg-white/90"
                      : "bg-ink text-on-primary hover:bg-body-strong"
                  }`}
                >
                  {isFree ? t("startFreeTrial") : tc("getStarted")}
                </Link>
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex flex-col items-start gap-6 rounded-xxl border border-hairline bg-surface-card p-8 md:flex-row md:items-center md:justify-between md:p-10">
          <div>
            <h3 className="font-display text-display-sm tracking-tighter text-ink">{localizedPlanMeta.ENTERPRISE.name}</h3>
            <p className="mt-1 text-body-sm leading-relaxed text-body">
              {localizedPlanMeta.ENTERPRISE.blurb}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {localizedPlanMeta.ENTERPRISE.features.slice(0, 5).map((feature: any) => (
                <span
                  key={feature.text}
                  className="rounded-full border border-hairline bg-surface-strong px-3 py-1 text-caption text-ink"
                >
                  {feature.text}
                </span>
              ))}
            </div>
          </div>
          <Link
            href="/pricing"
            className="inline-flex shrink-0 items-center gap-2 rounded-md bg-ink px-6 py-3 text-button text-on-primary transition-colors hover:bg-body-strong"
          >
            {t("contactSales")}
            <AppIcon icon={ArrowUpRightIcon} className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
