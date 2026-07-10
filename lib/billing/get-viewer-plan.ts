import "server-only";

import type { Plan } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";

import { prisma } from "@/lib/db/prisma";
import { getOrgPrismaId } from "@/lib/server/organization";

export async function getViewerPlan(): Promise<Plan | null> {
  const { orgId } = await auth();
  if (!orgId) return null;

  const orgPk = await getOrgPrismaId();
  if (!orgPk) return null;

  const org = await prisma.organization.findUnique({
    where: { id: orgPk },
    select: { plan: true },
  });

  return org?.plan ?? null;
}
