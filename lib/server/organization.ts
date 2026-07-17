import { auth } from "@clerk/nextjs/server";

import { prisma } from "@/lib/db/prisma";

/** Resolves the Prisma `Organization.id` for the current Clerk org (creates org if missing). */
export async function getOrgPrismaId(): Promise<string | null> {
  const session = await auth();
  const clerkOrgId = session.orgId;
  if (!clerkOrgId) return null;

  let org = await prisma.organization.findUnique({
    where: { clerkOrgId },
  });

  if (!org) {
    org = await prisma.organization.create({
      data: { clerkOrgId, name: "My Organization" },
    });
  }

  return org.id;
}

/** Returns the Plan (FREE / STARTER / PRO / ENTERPRISE) for the current Clerk org. */
export async function getOrgPlan(): Promise<string | null> {
  const session = await auth();
  const clerkOrgId = session.orgId;
  if (!clerkOrgId) return null;

  const org = await prisma.organization.findUnique({
    where: { clerkOrgId },
    select: { plan: true },
  });

  return org?.plan ?? null;
}
