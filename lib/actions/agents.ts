"use server";

import { auth } from "@clerk/nextjs/server";
import {
  AgentChannelType,
  AgentTone,
  AgentVisibility,
  CreativityLevel,
  SupportedLanguage,
} from "@prisma/client";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db/prisma";

const agentVariableUpsertSchema = z.object({
  key: z
    .string()
    .min(1)
    .max(40)
    .regex(
      /^[a-z][a-z0-9_]*$/,
      "Key must start with a lowercase letter and use only a-z, 0-9, or _",
    ),
  value: z.string().min(1).max(500),
  description: z.string().max(200).optional(),
});

const createAgentFromOnboardingSchema = z
  .object({
    tone: z.nativeEnum(AgentTone),
    customTone: z.string().max(120).optional(),
    creativity: z.nativeEnum(CreativityLevel),
    languages: z
      .array(z.nativeEnum(SupportedLanguage))
      .min(1, "Select at least one language"),
    channels: z
      .array(z.nativeEnum(AgentChannelType))
      .min(1, "Select at least one channel"),
    knowledgeDocIds: z.array(z.string().min(1)).optional(),
    name: z.string().min(1, "Agent name is required").max(50, "Name is too long"),
    website: z.string().max(500).optional(),
    description: z
      .string()
      .min(1, "Main goal is required")
      .max(500, "Main goal is too long"),
    handoffEnabled: z.boolean(),
  })
  .superRefine((data, ctx) => {
    const site = data.website?.trim();
    if (site && site.length > 0 && !isValidHttpUrl(site)) {
      ctx.addIssue({
        code: "custom",
        message: "Invalid website URL (use https://…)",
        path: ["website"],
      });
    }
  });

export type CreateAgentFromOnboardingInput = z.infer<
  typeof createAgentFromOnboardingSchema
>;

function isValidHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

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

function websiteToDb(raw: string | undefined): string | null {
  if (raw === undefined || raw === null) return null;
  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;
  return trimmed;
}

export async function createAIAgentFromOnboarding(
  input: CreateAgentFromOnboardingInput
) {
  try {
    const dbOrgId = await getOrgPrismaId();
    if (!dbOrgId) {
      return { success: false as const, error: "Unauthorized" };
    }

    const validated = createAgentFromOnboardingSchema.parse(input);
    const websiteUrl = websiteToDb(validated.website);

    const agent = await prisma.$transaction(async (tx) => {
      const created = await tx.agent.create({
        data: {
          orgId: dbOrgId,
          name: validated.name,
          tone: validated.tone,
          customTone: validated.customTone?.trim() || null,
          creativity: validated.creativity,
          description: validated.description,
          websiteUrl,
          handoffEnabled: validated.handoffEnabled,
        },
      });

      await tx.agentLanguage.createMany({
        data: validated.languages.map((language) => ({
          agentId: created.id,
          language,
        })),
      });

      await tx.agentChannel.createMany({
        data: validated.channels.map((channel) => ({
          agentId: created.id,
          channel,
          enabled: true,
        })),
      });

      if (validated.knowledgeDocIds && validated.knowledgeDocIds.length > 0) {
        const docs = await tx.knowledgeDoc.findMany({
          where: {
            orgId: dbOrgId,
            id: { in: validated.knowledgeDocIds },
          },
          select: { id: true },
        });
        const validIds = docs.map((d) => d.id);
        if (validIds.length > 0) {
          await tx.agentKnowledgeDoc.createMany({
            data: validIds.map((knowledgeDocId) => ({
              agentId: created.id,
              knowledgeDocId,
            })),
            skipDuplicates: true,
          });
        }
      }

      return created;
    });

    revalidatePath("/dashboard/agents");
    revalidatePath(`/dashboard/agents/${agent.id}`);

    return { success: true as const, data: { id: agent.id } };
  } catch (err) {
    if (err instanceof z.ZodError) {
      return {
        success: false as const,
        error: err.issues[0]?.message ?? "Invalid input",
      };
    }
    Sentry.captureException(err);
    const msg =
      process.env.NODE_ENV === "development" && err instanceof Error
        ? err.message
        : "Failed to create agent";
    return { success: false as const, error: msg };
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
        agentType: true,
        tone: true,
        customRole: true,
        channels: {
          where: { enabled: true },
          select: { channel: true },
        },
        languages: { select: { language: true } },
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

    const agent = await prisma.agent.findFirst({
      where: { id: agentId, orgId: dbOrgId },
      include: {
        languages: true,
        channels: true,
        knowledgeDocs: {
          include: {
            knowledgeDoc: { select: { id: true, title: true } },
          },
        },
        variables: true,
      },
    });

    if (!agent) {
      return { success: false, error: "Agent not found" };
    }

    return { success: true, data: agent };
  } catch (err) {
    Sentry.captureException(err);
    return { success: false, error: "Failed to fetch agent" };
  }
}

export async function updateAgentVisibility(
  agentId: string,
  visibility: AgentVisibility,
) {
  try {
    const dbOrgId = await getOrgPrismaId();
    if (!dbOrgId) {
      return { success: false as const, error: "Unauthorized" };
    }

    if (!Object.values(AgentVisibility).includes(visibility)) {
      return { success: false as const, error: "Invalid visibility" };
    }

    const updated = await prisma.agent.updateMany({
      where: { id: agentId, orgId: dbOrgId },
      data: { visibility },
    });

    if (updated.count === 0) {
      return { success: false as const, error: "Agent not found" };
    }

    revalidatePath(`/dashboard/agents/${agentId}`);
    return { success: true as const };
  } catch (err) {
    Sentry.captureException(err);
    return { success: false as const, error: "Failed to update visibility" };
  }
}

export async function listAgentVariables(agentId: string) {
  try {
    const dbOrgId = await getOrgPrismaId();
    if (!dbOrgId) {
      return {
        success: false as const,
        error: "Unauthorized",
        data: [] as { id: string; key: string; value: string; description: string | null }[],
      };
    }

    const agent = await prisma.agent.findFirst({
      where: { id: agentId, orgId: dbOrgId },
      select: { id: true },
    });
    if (!agent) {
      return {
        success: false as const,
        error: "Agent not found",
        data: [] as { id: string; key: string; value: string; description: string | null }[],
      };
    }

    const rows = await prisma.agentVariable.findMany({
      where: { agentId },
      orderBy: { key: "asc" },
      select: { id: true, key: true, value: true, description: true },
    });

    return { success: true as const, data: rows };
  } catch (err) {
    Sentry.captureException(err);
    return {
      success: false as const,
      error: "Failed to list variables",
      data: [] as { id: string; key: string; value: string; description: string | null }[],
    };
  }
}

export async function upsertAgentVariable(
  agentId: string,
  input: z.infer<typeof agentVariableUpsertSchema>,
) {
  try {
    const dbOrgId = await getOrgPrismaId();
    if (!dbOrgId) {
      return { success: false as const, error: "Unauthorized" };
    }

    const validated = agentVariableUpsertSchema.parse(input);
    const key = validated.key.trim();

    const agent = await prisma.agent.findFirst({
      where: { id: agentId, orgId: dbOrgId },
      select: { id: true },
    });
    if (!agent) {
      return { success: false as const, error: "Agent not found" };
    }

    const description =
      validated.description?.trim() === ""
        ? null
        : validated.description?.trim() ?? null;

    await prisma.agentVariable.upsert({
      where: {
        agentId_key: {
          agentId,
          key,
        },
      },
      create: {
        agentId,
        key,
        value: validated.value,
        description,
      },
      update: {
        value: validated.value,
        description,
      },
    });

    revalidatePath(`/dashboard/agents/${agentId}`);
    return { success: true as const };
  } catch (err) {
    if (err instanceof z.ZodError) {
      return {
        success: false as const,
        error: err.issues[0]?.message ?? "Invalid input",
      };
    }
    Sentry.captureException(err);
    return { success: false as const, error: "Failed to save variable" };
  }
}

export async function deleteAgentVariable(variableId: string) {
  try {
    const dbOrgId = await getOrgPrismaId();
    if (!dbOrgId) {
      return { success: false as const, error: "Unauthorized" };
    }

    const row = await prisma.agentVariable.findFirst({
      where: { id: variableId },
      include: { agent: { select: { orgId: true, id: true } } },
    });

    if (!row || row.agent.orgId !== dbOrgId) {
      return { success: false as const, error: "Variable not found" };
    }

    await prisma.agentVariable.delete({ where: { id: variableId } });

    revalidatePath(`/dashboard/agents/${row.agent.id}`);
    return { success: true as const };
  } catch (err) {
    Sentry.captureException(err);
    return { success: false as const, error: "Failed to delete variable" };
  }
}

export async function getOrgKnowledgeDocs() {
  try {
    const dbOrgId = await getOrgPrismaId();
    if (!dbOrgId) {
      return {
        success: false as const,
        error: "Unauthorized",
        data: [] as { id: string; title: string }[],
      };
    }

    const docs = await prisma.knowledgeDoc.findMany({
      where: { orgId: dbOrgId },
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true },
    });

    return { success: true as const, data: docs };
  } catch (err) {
    Sentry.captureException(err);
    return {
      success: false as const,
      error: "Failed to fetch knowledge documents",
      data: [] as { id: string; title: string }[],
    };
  }
}
