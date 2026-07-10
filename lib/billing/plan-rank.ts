import type { Plan } from "@prisma/client";

export const PLAN_RANK: Record<Plan, number> = {
  FREE: 0,
  STARTER: 1,
  PRO: 2,
  ENTERPRISE: 3,
};

const META_KEY_TO_PLAN: Record<string, Plan> = {
  free: "FREE",
  starter: "STARTER",
  pro: "PRO",
  enterprise: "ENTERPRISE",
};

export function planFromMetaKey(key: string): Plan | null {
  return META_KEY_TO_PLAN[key] ?? null;
}

export function comparePlans(a: Plan, b: Plan): -1 | 0 | 1 {
  const diff = PLAN_RANK[a] - PLAN_RANK[b];
  if (diff < 0) return -1;
  if (diff > 0) return 1;
  return 0;
}
