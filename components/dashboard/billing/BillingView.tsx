"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { PlanCtaInlineButton } from "@/components/billing/PlanCtaButton";
import { type PaidPlan, type PlanCtaLabelKey, resolvePlanCta } from "@/lib/billing/plan-cta";

export type BillingPlan = "FREE" | "STARTER" | "PRO" | "ENTERPRISE";

const PAID_PLANS: PaidPlan[] = ["STARTER", "PRO", "ENTERPRISE"];

export function BillingView({
  initialPlan,
  checkoutSuccess,
  enterpriseCheckoutEnabled,
}: {
  initialPlan: BillingPlan;
  checkoutSuccess: boolean;
  enterpriseCheckoutEnabled: boolean;
}) {
  const t = useTranslations("dashboard.billing");
  const [loading, setLoading] = useState<PaidPlan | null>(null);

  const ctaLabels: Record<PlanCtaLabelKey, string> = {
    startFreeTrial: t("cta.startFreeTrial"),
    getStarted: t("cta.getStarted"),
    upgrade: t("cta.upgrade"),
    currentPlan: t("cta.currentPlan"),
    contactSales: t("cta.contactSales"),
    checkout: t("cta.checkout"),
    redirecting: t("cta.redirecting"),
  };

  useEffect(() => {
    if (checkoutSuccess) {
      toast.success(
        t("checkoutCompleted")
      );
    }
  }, [checkoutSuccess, t]);

  const plansToShow: PaidPlan[] = enterpriseCheckoutEnabled
    ? PAID_PLANS
    : PAID_PLANS.filter((p) => p !== "ENTERPRISE");

  async function startCheckout(plan: PaidPlan) {
    setLoading(plan);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const json = (await res.json()) as { success?: boolean; data?: { checkoutUrl?: string }; error?: string };
      if (!res.ok || !json.success || !json.data?.checkoutUrl) {
        toast.error(json.error ?? t("checkoutFailed"));
        return;
      }
      window.location.href = json.data.checkoutUrl;
    } catch {
      toast.error(t("checkoutFailed"));
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header>
        <p className="text-caption-uppercase text-muted">{t("eyebrow")}</p>
        <h1 className="font-display text-display-md tracking-tighter text-ink">{t("title")}</h1>
        <p className="mt-3 max-w-[60ch] text-body-md leading-relaxed text-body text-pretty">
          {t.rich("description", {
            plan: () => <span className="text-body-strong text-ink">{t(`plans.${initialPlan}`)}</span>,
          })}
        </p>
      </header>

      <section className="rounded-xl border border-hairline bg-surface-card p-6 shadow-sm">
        <h2 className="font-display text-display-sm tracking-tighter text-ink">{t("upgradeTitle")}</h2>
        <ul className="mt-4 space-y-4">
          {plansToShow.map((plan) => {
            const cta = resolvePlanCta({
              targetPlan: plan,
              currentPlan: initialPlan,
              signedIn: true,
              hasOrg: true,
              enterpriseCheckoutEnabled,
              context: "billing",
            });

            return (
              <li
                key={plan}
                className="flex flex-col gap-3 border-b border-hairline-soft pb-4 last:border-b-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-title-sm text-ink">{t(`plans.${plan}`)}</p>
                  <p className="mt-1 text-body-sm leading-relaxed text-body text-pretty">
                    {t(`descriptions.${plan}`)}
                  </p>
                </div>
                <PlanCtaInlineButton
                  cta={cta}
                  labels={ctaLabels}
                  loading={loading === plan}
                  checkoutBlocked={loading !== null && loading !== plan}
                  onCheckout={(checkoutPlan) => void startCheckout(checkoutPlan)}
                />
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
