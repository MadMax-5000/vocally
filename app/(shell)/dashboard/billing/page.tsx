import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { BillingView, type BillingPlan } from "@/components/dashboard/billing/BillingView";
import { prisma } from "@/lib/db/prisma";
import { getOrgPrismaId } from "@/lib/server/organization";
import { variantIdForPlan } from "@/lib/billing/plan-map";

type Props = {
  searchParams: Record<string, string | string[] | undefined>;
};

export default async function BillingPage({ searchParams }: Props) {
  const { orgId } = await auth();
  if (!orgId) {
    redirect("/sign-in");
  }

  const orgPk = await getOrgPrismaId();
  if (!orgPk) {
    redirect("/onboarding");
  }

  const org = await prisma.organization.findUnique({
    where: { id: orgPk },
    select: { plan: true },
  });
  if (!org) {
    redirect("/onboarding");
  }

  const checkoutRaw = searchParams.checkout;
  const checkoutSuccess = checkoutRaw === "success" || (Array.isArray(checkoutRaw) && checkoutRaw[0] === "success");

  const enterpriseCheckoutEnabled = variantIdForPlan("ENTERPRISE") !== null;

  return (
    <BillingView
      initialPlan={org.plan as BillingPlan}
      checkoutSuccess={checkoutSuccess}
      enterpriseCheckoutEnabled={enterpriseCheckoutEnabled}
    />
  );
}
