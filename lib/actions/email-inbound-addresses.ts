"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/db/prisma";
import { getOrgPrismaId } from "@/lib/server/organization";

export type OrgEmailRow = {
  id: string;
  email: string;
  isActive: boolean;
  agentId: string | null;
  agentName: string | null;
  createdAt: Date;
};

export type EmailInboundAgentOption = { id: string; name: string };

const emailSchema = z
  .string()
  .min(3)
  .max(254)
  .email("Enter a valid email address")
  .transform((s) => s.trim().toLowerCase());

const createSchema = z.object({
  email: emailSchema,
  agentId: z.string().min(1).optional().nullable(),
});

const updateSchema = z.object({
  id: z.string().min(1),
  isActive: z.boolean().optional(),
  agentId: z.string().nullable().optional(),
});

export async function getEmailInboundSettings(): Promise<
  | { success: true; data: { addresses: OrgEmailRow[]; agents: EmailInboundAgentOption[] } }
  | { success: false; error: string }
> {
  try {
    const orgId = await getOrgPrismaId();
    if (!orgId) {
      return { success: false, error: "Select an organization to manage inbound email." };
    }

    const [rows, agents] = await Promise.all([
      prisma.emailAddress.findMany({
        where: { orgId },
        orderBy: { createdAt: "desc" },
        include: { agent: { select: { name: true } } },
      }),
      prisma.agent.findMany({
        where: { orgId, status: "ACTIVE" },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
    ]);

    const addresses: OrgEmailRow[] = rows.map((r) => ({
      id: r.id,
      email: r.email,
      isActive: r.isActive,
      agentId: r.agentId,
      agentName: r.agent?.name ?? null,
      createdAt: r.createdAt,
    }));

    return { success: true, data: { addresses, agents } };
  } catch {
    return { success: false, error: "Could not load inbound email settings." };
  }
}

async function assertAgentBelongsToOrg(agentId: string | null | undefined, orgId: string) {
  if (!agentId) return;
  const a = await prisma.agent.findFirst({
    where: { id: agentId, orgId },
    select: { id: true },
  });
  if (!a) {
    throw new Error("Agent not found in this organization");
  }
}

export async function createOrgEmailAddress(input: unknown): Promise<
  { success: true } | { success: false; error: string }
> {
  const orgId = await getOrgPrismaId();
  if (!orgId) {
    return { success: false, error: "Select an organization first." };
  }

  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { success: false, error: first?.message ?? "Invalid input" };
  }

  const { email, agentId } = parsed.data;

  try {
    await assertAgentBelongsToOrg(agentId ?? null, orgId);
    await prisma.emailAddress.create({
      data: {
        orgId,
        email,
        agentId: agentId ?? null,
        isActive: true,
      },
    });
    revalidatePath("/dashboard/email");
    return { success: true };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return {
        success: false,
        error: "That address is already registered (in this workspace or globally). Each inbox must be unique.",
      };
    }
    if (e instanceof Error && e.message === "Agent not found in this organization") {
      return { success: false, error: e.message };
    }
    return { success: false, error: "Could not add email address." };
  }
}

export async function updateOrgEmailAddress(input: unknown): Promise<
  { success: true } | { success: false; error: string }
> {
  const orgId = await getOrgPrismaId();
  if (!orgId) {
    return { success: false, error: "Select an organization first." };
  }

  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { success: false, error: first?.message ?? "Invalid input" };
  }

  const { id, isActive, agentId } = parsed.data;

  const existing = await prisma.emailAddress.findFirst({
    where: { id, orgId },
    select: { id: true },
  });
  if (!existing) {
    return { success: false, error: "Address not found." };
  }

  try {
    if (agentId !== undefined) {
      await assertAgentBelongsToOrg(agentId, orgId);
    }

    await prisma.emailAddress.update({
      where: { id },
      data: {
        ...(typeof isActive === "boolean" ? { isActive } : {}),
        ...(agentId !== undefined ? { agentId } : {}),
      },
    });

    revalidatePath("/dashboard/email");
    return { success: true };
  } catch (e) {
    if (e instanceof Error && e.message === "Agent not found in this organization") {
      return { success: false, error: e.message };
    }
    return { success: false, error: "Could not update settings." };
  }
}

export async function deleteOrgEmailAddress(id: string): Promise<
  { success: true } | { success: false; error: string }
> {
  const orgId = await getOrgPrismaId();
  if (!orgId) {
    return { success: false, error: "Select an organization first." };
  }

  const existing = await prisma.emailAddress.findFirst({
    where: { id, orgId },
    select: { id: true },
  });
  if (!existing) {
    return { success: false, error: "Address not found." };
  }

  try {
    await prisma.emailAddress.delete({ where: { id } });
    revalidatePath("/dashboard/email");
    return { success: true };
  } catch {
    return { success: false, error: "Could not delete address." };
  }
}
