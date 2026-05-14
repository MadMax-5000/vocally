"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

export type BillingPlan = "FREE" | "STARTER" | "PRO" | "ENTERPRISE";

type PaidPlan = "STARTER" | "PRO" | "ENTERPRISE";

const PAID_PLANS: PaidPlan[] = ["STARTER", "PRO", "ENTERPRISE"];

const planDescription: Record<PaidPlan, string> = {
  STARTER: "Higher knowledge storage and room to grow.",
  PRO: "Full production capacity for teams.",
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
          {plansToShow.map((plan) => (
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
              <button
                type="button"
                className="btn-primary shrink-0 tracking-wide"
                disabled={loading !== null || initialPlan === plan}
                onClick={() => void startCheckout(plan)}
              >
                {loading === plan ? "Redirecting…" : initialPlan === plan ? "Current plan" : "Checkout"}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
