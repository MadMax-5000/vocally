import { getTranslations } from "next-intl/server";

import { formatPrice } from "@/lib/billing/currency";
import { getLocalizedPlanMeta } from "@/lib/billing/get-plan-meta";
import { PLAN_PRICES } from "@/lib/billing/plan-features";

import { PricingCards, type PricingPlan } from "./PricingCards";

/** Yearly billing takes 15% off the monthly digital price. */
function yearlyPrice(cents: number) {
  return formatPrice(Math.round(cents * 0.85));
}

export async function LandingPricingSection() {
  const t = await getTranslations("landing.pricing");
  const tc = await getTranslations("common");
  const tp = await getTranslations("plans");
  const meta = getLocalizedPlanMeta(tp);

  const included = (plan: keyof typeof meta) =>
    meta[plan].features.filter((feature) => feature.included).map((feature) => feature.text);

  const plans: PricingPlan[] = [
    {
      key: "starter",
      name: meta.STARTER.name,
      description: meta.STARTER.description,
      priceMonthly: formatPrice(PLAN_PRICES.STARTER.madCents),
      priceYearly: yearlyPrice(PLAN_PRICES.STARTER.madCents),
      features: included("STARTER"),
      ctaLabel: tc("getStarted"),
      ctaHref: "/sign-up",
    },
    {
      key: "pro",
      name: meta.PRO.name,
      description: meta.PRO.description,
      priceMonthly: formatPrice(PLAN_PRICES.PRO.madCents),
      priceYearly: yearlyPrice(PLAN_PRICES.PRO.madCents),
      features: included("PRO"),
      ctaLabel: tc("getStarted"),
      ctaHref: "/sign-up",
      featured: true,
    },
    {
      key: "enterprise",
      name: meta.ENTERPRISE.name,
      description: meta.ENTERPRISE.description,
      priceMonthly: t("custom"),
      priceYearly: t("custom"),
      features: included("ENTERPRISE"),
      ctaLabel: t("contactSales"),
      ctaHref: "/contact/sales",
      customPrice: true,
    },
  ];

  return (
    <section className="bg-canvas-warm py-section">
      <div className="mx-auto w-full max-w-[1200px] px-6">
        <div className="mx-auto max-w-[760px] text-center">
          <p className="flex items-center justify-center gap-2 text-[13px] font-medium leading-none text-warm-body">
            <span aria-hidden className="size-1 rounded-full bg-warm-body" />
            {t("eyebrow")}
          </p>
          <h2 className="mt-4 font-display text-[38px] leading-[1.06] tracking-[-2.4px] text-black sm:text-[52px]">
            <span className="block">{t("title")}</span>
            <span className="block text-warm-body">{t("titleMuted")}</span>
          </h2>
        </div>

        <PricingCards
          plans={plans}
          labels={{
            monthly: t("monthly"),
            yearly: t("yearly"),
            yearlyBadge: t("yearlyBadge"),
            yearlyNote: t("yearlyNote"),
            popular: t("popular"),
            includes: t("includes"),
            perMonth: t("perMonth"),
            note: tc("allPricesMad"),
          }}
        />
      </div>
    </section>
  );
}
