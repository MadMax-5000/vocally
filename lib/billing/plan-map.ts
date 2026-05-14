import type { Plan } from "@prisma/client";

function normId(id: string | number | null | undefined): string | null {
  if (id === null || id === undefined) return null;
  const s = String(id).trim();
  return s.length ? s : null;
}

/** Maps Lemon variant id (from env) to internal billing plan. */
export function planFromVariantId(
  variantId: string | number | null | undefined
): Plan | null {
  const v = normId(variantId);
  if (!v) return null;
  const starter = normId(process.env.LEMONSQUEEZY_VARIANT_ID_STARTER);
  const pro = normId(process.env.LEMONSQUEEZY_VARIANT_ID_PRO);
  const enterprise = normId(process.env.LEMONSQUEEZY_VARIANT_ID_ENTERPRISE);
  if (starter && v === starter) return "STARTER";
  if (pro && v === pro) return "PRO";
  if (enterprise && v === enterprise) return "ENTERPRISE";
  return null;
}

export function variantIdForPlan(plan: "STARTER" | "PRO" | "ENTERPRISE"): string | null {
  const id =
    plan === "STARTER"
      ? process.env.LEMONSQUEEZY_VARIANT_ID_STARTER
      : plan === "PRO"
        ? process.env.LEMONSQUEEZY_VARIANT_ID_PRO
        : process.env.LEMONSQUEEZY_VARIANT_ID_ENTERPRISE;
  return normId(id);
}
