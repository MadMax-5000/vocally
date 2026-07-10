import { auth } from "@clerk/nextjs/server";
import { getTranslations } from "next-intl/server";

import { PlanCtaButton } from "@/components/billing/PlanCtaButton";
import { HeaderAuth } from "@/components/marketing/HeaderAuth";
import { EnterprisePlanCard } from "@/components/marketing/EnterprisePlanCard";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { PlanPricingCard } from "@/components/marketing/PlanPricingCard";
import { getViewerPlan } from "@/lib/billing/get-viewer-plan";
import { formatPrice } from "@/lib/billing/currency";
import { getLocalizedPlanMeta } from "@/lib/billing/get-plan-meta";
import { variantIdForPlan } from "@/lib/billing/plan-map";
import { type PlanCtaLabelKey, resolvePlanCta } from "@/lib/billing/plan-cta";
import { PLAN_PRICES } from "@/lib/billing/plan-features";
import { planFromMetaKey } from "@/lib/billing/plan-rank";
import { getOverageRate } from "@/lib/billing/overage";

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

export default async function PricingPage() {
  const { userId, orgId } = await auth();
  const signedIn = !!userId;
  const hasOrg = !!orgId;
  const currentPlan = await getViewerPlan();
  const enterpriseCheckoutEnabled = variantIdForPlan("ENTERPRISE") !== null;

  const t = await getTranslations("pricing");
  const tc = await getTranslations("common");
  const tp = await getTranslations("plans");

  const localizedPlanMeta = getLocalizedPlanMeta(tp);
  const ctaLabels = buildCtaLabels(t, tc);

  const plans = PAID_CARD_PLANS.map((planKey) => ({
    planKey,
    ...localizedPlanMeta[planKey],
    price: PLAN_PRICES[planKey],
  }));

  function overageDisplay(planKey: string): string | null {
    const rate = getOverageRate(planKey);
    if (rate === 0) return null;
    return t("overage", { rate });
  }

  const enterpriseCta = resolvePlanCta({
    targetPlan: "ENTERPRISE",
    currentPlan,
    signedIn,
    hasOrg,
    enterpriseCheckoutEnabled,
  });

  return (
    <main className="min-h-dvh bg-canvas text-ink">
      <MarketingHeader>
        <HeaderAuth />
      </MarketingHeader>

      <div className={[container, "py-section"].join(" ")}>
        <p className="text-caption-uppercase text-muted">Pricing</p>
        <h1 className="mt-4 font-display text-display-xl tracking-tighter text-balance text-ink md:text-display-mega">
          {t("title")}
        </h1>
        <p className="mt-6 max-w-[62ch] text-body-md leading-relaxed text-body text-pretty rtl:text-start ltr:text-left">
          {tc("allPricesMad")}
        </p>

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
                overageText={overageDisplay(plan.key)}
              >
                <PlanCtaButton cta={cta} labels={ctaLabels} variant={isPro ? "pro" : "default"} />
              </PlanPricingCard>
            );
          })}
        </div>

        <EnterprisePlanCard
          className="mt-12"
          name={localizedPlanMeta.ENTERPRISE.name}
          blurb={localizedPlanMeta.ENTERPRISE.blurb}
          features={localizedPlanMeta.ENTERPRISE.features}
          customPricingLabel={t("customPricing")}
          customPricingHint={t("customPricingHint")}
          isCurrentPlan={currentPlan === "ENTERPRISE"}
          currentPlanBadgeLabel={t("currentPlanBadge")}
          cta={enterpriseCta}
          ctaLabels={ctaLabels}
        />
      </div>
    </main>
  );
}
