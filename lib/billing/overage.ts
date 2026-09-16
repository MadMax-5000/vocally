/**
 * Digital conversation overage billed at cost per 100 conversations beyond the
 * plan's included `MAX_CONVERSATIONS` (see plan-features.ts). Sales-led.
 */
export const CONVERSATION_OVERAGE_MAD_PER_100 = 10;

/**
 * Digital SaaS plans have no voice-minute overage — voice overage lives on
 * the Téléphonie Maroc packs (`PHONE_OVERAGE_MAD`).
 */
export const OVERAGE_RATES: Record<string, number> = {};

export function getOverageRate(plan: string): number {
  return OVERAGE_RATES[plan] ?? 0;
}