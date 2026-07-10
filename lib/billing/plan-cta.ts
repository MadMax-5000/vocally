import type { Plan } from "@prisma/client";

import { comparePlans } from "./plan-rank";

export type PaidPlan = "STARTER" | "PRO" | "ENTERPRISE";

export type PlanCtaLabelKey =
  | "startFreeTrial"
  | "getStarted"
  | "upgrade"
  | "currentPlan"
  | "contactSales"
  | "checkout"
  | "redirecting";

export type PlanCta =
  | { kind: "link"; href: string; labelKey: PlanCtaLabelKey }
  | { kind: "checkout"; plan: PaidPlan; labelKey: PlanCtaLabelKey }
  | { kind: "disabled"; labelKey: PlanCtaLabelKey }
  | { kind: "mailto"; email: string; labelKey: PlanCtaLabelKey };

function defaultLabelForPlan(targetPlan: Plan): PlanCtaLabelKey {
  if (targetPlan === "FREE") return "startFreeTrial";
  if (targetPlan === "ENTERPRISE") return "contactSales";
  return "getStarted";
}

function enterpriseCta(
  enterpriseCheckoutEnabled: boolean,
  context: "marketing" | "billing",
): PlanCta {
  if (enterpriseCheckoutEnabled && context === "billing") {
    return { kind: "checkout", plan: "ENTERPRISE", labelKey: "contactSales" };
  }
  return { kind: "link", href: "/contact/sales", labelKey: "contactSales" };
}

export function resolvePlanCta({
  targetPlan,
  currentPlan,
  signedIn,
  hasOrg,
  enterpriseCheckoutEnabled,
  context = "marketing",
}: {
  targetPlan: Plan;
  currentPlan: Plan | null;
  signedIn: boolean;
  hasOrg: boolean;
  enterpriseCheckoutEnabled: boolean;
  context?: "marketing" | "billing";
}): PlanCta {
  const defaultLabel = defaultLabelForPlan(targetPlan);

  if (!signedIn) {
    if (targetPlan === "ENTERPRISE") {
      return enterpriseCta(enterpriseCheckoutEnabled, context);
    }
    return { kind: "link", href: "/sign-up", labelKey: defaultLabel };
  }

  if (!hasOrg) {
    if (targetPlan === "ENTERPRISE") {
      return enterpriseCta(enterpriseCheckoutEnabled, context);
    }
    return { kind: "link", href: "/onboarding", labelKey: defaultLabel };
  }

  if (!currentPlan) {
    if (targetPlan === "ENTERPRISE") {
      return enterpriseCta(enterpriseCheckoutEnabled, context);
    }
    if (targetPlan === "FREE") {
      return { kind: "disabled", labelKey: "currentPlan" };
    }
    const labelKey: PlanCtaLabelKey = context === "billing" ? "checkout" : "getStarted";
    return { kind: "checkout", plan: targetPlan as PaidPlan, labelKey };
  }

  const cmp = comparePlans(targetPlan, currentPlan);

  if (cmp === 0) {
    return { kind: "disabled", labelKey: "currentPlan" };
  }

  if (cmp < 0) {
    return { kind: "disabled", labelKey: defaultLabel };
  }

  if (targetPlan === "ENTERPRISE") {
    return enterpriseCta(enterpriseCheckoutEnabled, context);
  }

  const labelKey: PlanCtaLabelKey =
    context === "billing"
      ? "checkout"
      : currentPlan === "FREE"
        ? "getStarted"
        : "upgrade";

  return { kind: "checkout", plan: targetPlan as PaidPlan, labelKey };
}
