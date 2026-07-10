"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PlanCtaInlineButton } from "@/components/billing/PlanCtaButton";
import { type PaidPlan, type PlanCtaLabelKey, resolvePlanCta } from "@/lib/billing/plan-cta";

export type BillingPlan = "FREE" | "STARTER" | "PRO" | "ENTERPRISE";

const PAID_PLANS: PaidPlan[] = ["STARTER", "PRO", "ENTERPRISE"];

const planDescription: Record<PaidPlan, string> = {
  STARTER: "3 AI agents, 2,000 min/mo, and knowledge base — for small teams.",
  PRO: "8 AI agents, 10,000 min/mo, all channels, and co-pilot — for scaling teams.",
  ENTERPRISE: "Volume, compliance, and dedicated support.",
};

function planLabel(plan: BillingPlan): string {
  switch (plan) {
    case "FREE":
      return "Free";
    case "STARTER":
      return "Starter";
    case "PRO":
      return "Pro";
    case "ENTERPRISE":
      return "Enterprise";
    default:
      return plan;
  }
}

export function BillingView({
  initialPlan,
  checkoutSuccess,
  enterpriseCheckoutEnabled,
}: {
  initialPlan: BillingPlan;
  checkoutSuccess: boolean;
  enterpriseCheckoutEnabled: boolean;
}) {
  const [loading, setLoading] = useState<PaidPlan | null>(null);

  const ctaLabels: Record<PlanCtaLabelKey, string> = {
    startFreeTrial: "Start free trial",
    getStarted: "Get started",
    upgrade: "Upgrade",
    currentPlan: "Current plan",
    contactSales: "Contact sales",
    checkout: "Checkout",
    redirecting: "Redirecting…",
  };

  useEffect(() => {
    if (checkoutSuccess) {
      toast.success(
        "Checkout completed. Your plan will update when Lemon Squeezy confirms the subscription."
      );
    }
  }, [checkoutSuccess]);

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
        toast.error(json.error ?? "Could not start checkout.");
        return;
      }
      window.location.href = json.data.checkoutUrl;
    } catch {
      toast.error("Could not start checkout.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header>
        <p className="text-caption-uppercase text-muted">Billing</p>
        <h1 className="font-display text-display-md tracking-tighter text-ink">Plan &amp; subscription</h1>
        <p className="mt-3 max-w-[60ch] text-body-md leading-relaxed text-body text-pretty">
          Your current plan is{" "}
          <span className="text-body-strong text-ink">{planLabel(initialPlan)}</span>. Upgrade
          through our secure Lemon Squeezy checkout; changes sync automatically after payment.
        </p>
      </header>

      <section className="rounded-xl border border-hairline bg-surface-card p-6 shadow-sm">
        <h2 className="font-display text-display-sm tracking-tighter text-ink">Upgrade</h2>
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
                  <p className="text-title-sm text-ink">{planLabel(plan)}</p>
                  <p className="mt-1 text-body-sm leading-relaxed text-body text-pretty">
                    {planDescription[plan]}
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
