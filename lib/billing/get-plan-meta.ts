import { PlanMeta } from "./plan-features";

export function getLocalizedPlanMeta(t: any): Record<"FREE" | "STARTER" | "PRO" | "ENTERPRISE", PlanMeta> {
  const mapFeatures = (planKey: string, count: number, maxIncluded: number) => {
    return Array.from({ length: count }).map((_, i) => ({
      text: t(`${planKey}.features.${i}`),
      included: i < maxIncluded
    }));
  };

  return {
    FREE: {
      key: "free",
      name: t("free.name"),
      description: t("free.description"),
      blurb: t("free.blurb"),
      features: mapFeatures("free", 6, 3),
    },
    STARTER: {
      key: "starter",
      name: t("starter.name"),
      description: t("starter.description"),
      blurb: t("starter.blurb"),
      features: mapFeatures("starter", 8, 6),
    },
    PRO: {
      key: "pro",
      name: t("pro.name"),
      description: t("pro.description"),
      blurb: t("pro.blurb"),
      features: mapFeatures("pro", 8, 8),
    },
    ENTERPRISE: {
      key: "enterprise",
      name: t("enterprise.name"),
      description: t("enterprise.description"),
      blurb: t("enterprise.blurb"),
      features: mapFeatures("enterprise", 6, 6),
    }
  };
}