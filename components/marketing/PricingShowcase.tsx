import "server-only";

import { Link } from "@/i18n/routing";
import { auth } from "@clerk/nextjs/server";
import { getTranslations } from "next-intl/server";

import { PlanCtaButton } from "@/components/billing/PlanCtaButton";
import { EnterprisePlanCard } from "@/components/marketing/EnterprisePlanCard";
import { PlanPricingCard } from "@/components/marketing/PlanPricingCard";
import { getViewerPlan } from "@/lib/billing/get-viewer-plan";
import { formatPrice } from "@/lib/billing/currency";
import { getLocalizedPlanMeta } from "@/lib/billing/get-plan-meta";
import { variantIdForPlan } from "@/lib/billing/plan-map";
import { type PlanCtaLabelKey, resolvePlanCta } from "@/lib/billing/plan-cta";
import { PLAN_PRICES } from "@/lib/billing/plan-features";
import { planFromMetaKey } from "@/lib/billing/plan-rank";

const container = "mx-auto w-full max-w-[1200px] px-6";

const PAID_CARD_PLANS = ["FREE", "STARTER", "PRO"] as const;

function buildCtaLabels(
  t: Awaited<ReturnType<typeof getTranslations<"pricing">>>,
  tc: Awaited<ReturnType<typeof getTranslations<"common">>>
): Record<PlanCtaLabelKey, string> {
  return {
    startFreeTrial: t("startFreeTrial"),
    getStarted: tc("getStarted"),
    upgrade: t("upgrade"),
    currentPlan: t("currentPlan"),
    contactSales: t("contactSales"),
    checkout: t("checkout"),
    redirecting: t("redirecting"),
  };
}

export async function PricingShowcase() {
  const { userId, orgId } = await auth();
  const signedIn = !!userId;
  const hasOrg = !!orgId;
  const currentPlan = await getViewerPlan();
  const enterpriseCheckoutEnabled = variantIdForPlan("ENTERPRISE") !== null;

  const t = await getTranslations("pricing");
  const tp = await getTranslations("plans");
  const tc = await getTranslations("common");

  const localizedPlanMeta = getLocalizedPlanMeta(tp);
  const ctaLabels = buildCtaLabels(t, tc);

  const plans = PAID_CARD_PLANS.map((planKey) => ({
    planKey,
    ...localizedPlanMeta[planKey],
    price: PLAN_PRICES[planKey],
  }));

  const enterpriseCta = resolvePlanCta({
    targetPlan: "ENTERPRISE",
    currentPlan,
    signedIn,
    hasOrg,
    enterpriseCheckoutEnabled,
  });

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
            const targetPlan = planFromMetaKey(plan.key);
            if (!targetPlan) return null;

            const isPro = plan.key === "pro";
            const isFree = plan.key === "free";
            const isCurrentPlan = currentPlan === targetPlan;
            const rawPrice = plan.price !== null ? plan.price.madCents : null;
            const showPrice = isFree ? t("free") : rawPrice !== null ? formatPrice(rawPrice) : null;
            const cta = resolvePlanCta({
              targetPlan,
              currentPlan,
              signedIn,
              hasOrg,
              enterpriseCheckoutEnabled,
            });

            return (
              <PlanPricingCard
                key={plan.key}
                name={plan.name}
                description={plan.description}
                showPrice={showPrice}
                isFree={isFree}
                isPro={isPro}
                isCurrentPlan={isCurrentPlan}
                recommendedLabel={t("recommended")}
                currentPlanBadgeLabel={t("currentPlanBadge")}
                perMonthLabel={t("perMonth")}
                features={plan.features}
                headingLevel="h3"
              >
                <PlanCtaButton cta={cta} labels={ctaLabels} variant={isPro ? "pro" : "default"} />
              </PlanPricingCard>
            );
          })}
        </div>

        <EnterprisePlanCard
          className="mt-8"
          name={localizedPlanMeta.ENTERPRISE.name}
          blurb={localizedPlanMeta.ENTERPRISE.blurb}
          features={localizedPlanMeta.ENTERPRISE.features}
          customPricingLabel={t("customPricing")}
          customPricingHint={t("customPricingHint")}
          isCurrentPlan={currentPlan === "ENTERPRISE"}
          currentPlanBadgeLabel={t("currentPlanBadge")}
          cta={enterpriseCta}
          ctaLabels={ctaLabels}
          headingLevel="h3"
        />
      </div>
    </section>
  );
}
