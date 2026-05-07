"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const createAgentSchema = z.object({
  name: z.string().min(1, "Agent name is required").max(100, "Name is too long"),
  title: z.string().min(1, "Role is required").max(100, "Role is too long"),
  field: z.string().min(1, "Field is required").max(100, "Field is too long"),
  instructions: z.string().min(10, "Instructions must be at least 10 characters").max(5000, "Instructions are too long"),
});

export type CreateAgentInput = z.infer<typeof createAgentSchema>;

async function getOrgPrismaId() {
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

export async function createAIAgent(input: CreateAgentInput) {
  try {
    const dbOrgId = await getOrgPrismaId();
    if (!dbOrgId) {
      return { success: false, error: "Unauthorized" };
    }

    const validated = createAgentSchema.parse(input);

    const agent = await prisma.agent.create({
      data: {
        orgId: dbOrgId,
        name: validated.name,
        title: validated.title,
        field: validated.field,
        instructions: validated.instructions,
      },
    });

    revalidatePath("/dashboard/agents");

    return { success: true, data: { id: agent.id } };
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { success: false, error: err.issues[0].message };
    }
    Sentry.captureException(err);
    const msg = process.env.NODE_ENV === "development" && err instanceof Error ? err.message : "Failed to create agent";
    return { success: false, error: msg };
  }
}

export async function getUserAIAgents() {
  try {
    const dbOrgId = await getOrgPrismaId();
    if (!dbOrgId) {
      return { success: false, error: "Unauthorized", data: [] };
    }

    const agents = await prisma.agent.findMany({
      where: { orgId: dbOrgId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        title: true,
        field: true,
        createdAt: true,
      },
    });

    return { success: true, data: agents };
  } catch (err) {
    Sentry.captureException(err);
    return { success: false, error: "Failed to fetch agents", data: [] };
  }
}

export async function getAIAgentById(agentId: string) {
  try {
    const dbOrgId = await getOrgPrismaId();
    if (!dbOrgId) {
      return { success: false, error: "Unauthorized" };
    }

    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
    });

    if (!agent || agent.orgId !== dbOrgId) {
      return { success: false, error: "Agent not found" };
    }

    return { success: true, data: agent };
  } catch (err) {
    Sentry.captureException(err);
    return { success: false, error: "Failed to fetch agent" };
  }
}
