export const OVERAGE_RATES: Record<string, number> = {
  STARTER: 0.5,
  PRO: 0.4,
};

export function getOverageRate(plan: string): number {
  return OVERAGE_RATES[plan] ?? 0;
}
