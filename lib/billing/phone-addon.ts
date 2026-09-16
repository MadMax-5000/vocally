import { MAX_PHONE_NUMBERS } from "./plan-features";

/**
 * Morocco telephony (Téléphonie Maroc) is sold per number via SIPTRUNK.ma DIDs,
 * not a hardware gateway. Pro includes 1 number + 300 AI voice minutes.
 * Checkout is sales-led until Deploy → Phone + fulfillment are live.
 *
 * Packs and extras (all MAD HT / month):
 *  - Extra number pack 1,500: 1 number + 1 concurrent line + 300 AI minutes
 *  - Extra concurrent line 200: one more slot on a number
 *  - Extra WhatsApp / Meta account 100
 *  - Voice overage 3 DH HT/min after plan + pack minutes
 */
export const PHONE_PACK_MONTHLY_MAD_CENTS = 150_000;
export const PHONE_PACK_INCLUDED_MINUTES = 300;
export const PHONE_EXTRA_CONCURRENT_LINE_MONTHLY_MAD_CENTS = 20_000;
export const PHONE_EXTRA_SOCIAL_ACCOUNT_MONTHLY_MAD_CENTS = 10_000;
/** MAD HT per minute after the included minutes. Must stay above ~2.0 COGS. */
export const PHONE_OVERAGE_MAD = 3;

export const PHONE_ADDON_ELIGIBLE: Record<
  "FREE" | "STARTER" | "PRO" | "ENTERPRISE",
  boolean
> = {
  FREE: false,
  STARTER: false,
  PRO: true,
  ENTERPRISE: true,
};

export function isPhoneAddonEligible(plan: string): boolean {
  return PHONE_ADDON_ELIGIBLE[plan as keyof typeof PHONE_ADDON_ELIGIBLE] ?? false;
}

/**
 * Deploy → Phone slots. The plan's included number is the baseline
 * (Pro: 1, Enterprise: unlimited). Extra packs and concurrent lines are
 * ordered via sales and provisioned outside this self-serve slot limit.
 */
export function phoneNumberSlotLimit(plan: string): number {
  return MAX_PHONE_NUMBERS[plan as keyof typeof MAX_PHONE_NUMBERS] ?? 0;
}

/**
 * Inbound voice minute cap used at webhook time.
 * Pro ships 300 minutes in the plan; each extra pack adds 300 (sales-tracked).
 * Enterprise remains unlimited.
 */
export function monthlyCallMinuteCap(
  plan: string,
  digitalMax: number,
): number {
  if (digitalMax === Number.POSITIVE_INFINITY || plan === "ENTERPRISE") {
    return Number.POSITIVE_INFINITY;
  }
  if (isPhoneAddonEligible(plan)) {
    return Math.max(digitalMax, PHONE_PACK_INCLUDED_MINUTES);
  }
  return digitalMax;
}