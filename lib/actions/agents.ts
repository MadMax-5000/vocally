"use server";

import { clerkClient } from "@clerk/nextjs/server";
import {
  AgentChannelType,
  AgentTone,
  AgentVisibility,
  CreativityLevel,
  LlmProvider,
  KnowledgeSourceKind,
  SupportedLanguage,
  VoiceProvider,
} from "@prisma/client";
import { z } from "zod";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db/prisma";
import { getOrgPrismaId } from "@/lib/server/organization";

function formatCreator(clerkUserId: string | null): string {
  if (!clerkUserId) return "—";
  if (clerkUserId.length <= 12) return clerkUserId;
  return `${clerkUserId.slice(0, 8)}…`;
}

async function getCreatorEmailsByClerkUserId(
  clerkUserIds: string[],
): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const ids = Array.from(new Set(clerkUserIds));
  if (ids.length === 0) return out;

  try {
    const client = await clerkClient();
    const usersRes = await client.users.getUserList({
      userId: ids,
      limit: ids.length,
    });
    for (const u of usersRes.data) {
      out.set(u.id, u.primaryEmailAddress?.emailAddress ?? "—");
    }
  } catch (err) {
    console.error("Failed to fetch some user emails:", err);
  }

  return out;
}

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
        voices: true,
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
    return { success: false as const, error: "Failed to update visibility" };
  }
}

const updateAgentLlmSettingsSchema = z.object({
  llmProvider: z.nativeEnum(LlmProvider),
  llmModel: z.string().min(1).max(120),
});

export async function updateAgentLlmSettings(
  agentId: string,
  input: z.infer<typeof updateAgentLlmSettingsSchema>,
) {
  try {
    const dbOrgId = await getOrgPrismaId();
    if (!dbOrgId) return { success: false as const, error: "Unauthorized" };

    const validated = updateAgentLlmSettingsSchema.parse(input);

    const updated = await prisma.agent.updateMany({
      where: { id: agentId, orgId: dbOrgId },
      data: {
        llmProvider: validated.llmProvider,
        llmModel: validated.llmModel.trim(),
      },
    });

    if (updated.count === 0) {
      return { success: false as const, error: "Agent not found" };
    }

    revalidatePath(`/dashboard/agents/${agentId}`);
    return { success: true as const };
  } catch (err) {
    if (err instanceof z.ZodError) {
      return {
        success: false as const,
        error: err.issues[0]?.message ?? "Invalid input",
      };
    }
    return { success: false as const, error: "Failed to update LLM settings" };
  }
}

const updateAgentLanguageSettingsSchema = z.object({
  defaultLanguage: z.nativeEnum(SupportedLanguage),
  languages: z.array(z.nativeEnum(SupportedLanguage)).min(1),
});

export async function updateAgentLanguageSettings(
  agentId: string,
  input: z.infer<typeof updateAgentLanguageSettingsSchema>,
) {
  try {
    const dbOrgId = await getOrgPrismaId();
    if (!dbOrgId) return { success: false as const, error: "Unauthorized" };

    const validated = updateAgentLanguageSettingsSchema.parse(input);

    const languages = Array.from(
      new Set<SupportedLanguage>([validated.defaultLanguage, ...validated.languages]),
    );

    const agent = await prisma.agent.findFirst({
      where: { id: agentId, orgId: dbOrgId },
      select: { id: true },
    });
    if (!agent) return { success: false as const, error: "Agent not found" };

    await prisma.$transaction(async (tx) => {
      await tx.agent.update({
        where: { id: agentId },
        data: { defaultLanguage: validated.defaultLanguage },
      });

      await tx.agentLanguage.deleteMany({
        where: {
          agentId,
          language: { notIn: languages },
        },
      });

      await tx.agentLanguage.createMany({
        data: languages.map((language) => ({ agentId, language })),
        skipDuplicates: true,
      });
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
    return { success: false as const, error: "Failed to update language settings" };
  }
}

const agentVoiceSchema = z.object({
  provider: z.nativeEnum(VoiceProvider),
  voiceId: z.string().min(1).max(120),
  name: z.string().min(1).max(120),
});

const updateAgentVoiceSettingsSchema = z.object({
  primaryVoice: agentVoiceSchema,
  additionalVoices: z.array(agentVoiceSchema).default([]),
});

export async function updateAgentVoiceSettings(
  agentId: string,
  input: z.infer<typeof updateAgentVoiceSettingsSchema>,
) {
  try {
    const dbOrgId = await getOrgPrismaId();
    if (!dbOrgId) return { success: false as const, error: "Unauthorized" };

    const validated = updateAgentVoiceSettingsSchema.parse(input);

    const agent = await prisma.agent.findFirst({
      where: { id: agentId, orgId: dbOrgId },
      select: { id: true },
    });
    if (!agent) return { success: false as const, error: "Agent not found" };

    const desired = [
      { ...validated.primaryVoice, isPrimary: true },
      ...validated.additionalVoices.map((v) => ({ ...v, isPrimary: false })),
    ];

    await prisma.$transaction(async (tx) => {
      await tx.agentVoice.deleteMany({ where: { agentId } });
      await tx.agentVoice.createMany({
        data: desired.map((v) => ({
          agentId,
          provider: v.provider,
          voiceId: v.voiceId,
          name: v.name,
          isPrimary: v.isPrimary,
        })),
      });
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
    return { success: false as const, error: "Failed to update voice settings" };
  }
}

const updateAgentPromptSettingsSchema = z.object({
  welcomeMessage: z.string().max(4000).nullable().optional(),
  instructions: z.string().max(20000).nullable().optional(),
});

export async function updateAgentPromptSettings(
  agentId: string,
  input: z.infer<typeof updateAgentPromptSettingsSchema>,
) {
  try {
    const dbOrgId = await getOrgPrismaId();
    if (!dbOrgId) return { success: false as const, error: "Unauthorized" };

    const validated = updateAgentPromptSettingsSchema.parse(input);

    const updated = await prisma.agent.updateMany({
      where: { id: agentId, orgId: dbOrgId },
      data: {
        welcomeMessage:
          validated.welcomeMessage === undefined
            ? undefined
            : validated.welcomeMessage?.trim() || null,
        instructions:
          validated.instructions === undefined
            ? undefined
            : validated.instructions?.trim() || null,
      },
    });

    if (updated.count === 0) {
      return { success: false as const, error: "Agent not found" };
    }

    revalidatePath(`/dashboard/agents/${agentId}`);
    return { success: true as const };
  } catch (err) {
    if (err instanceof z.ZodError) {
      return {
        success: false as const,
        error: err.issues[0]?.message ?? "Invalid input",
      };
    }
    return { success: false as const, error: "Failed to update prompt settings" };
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
        data: [] as OrgDocRow[],
      };
    }

    const docs = await prisma.knowledgeDoc.findMany({
      where: { orgId: dbOrgId },
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true, sourceKind: true, createdByClerkUserId: true, sizeBytes: true },
    });

    const creatorEmailById = await getCreatorEmailsByClerkUserId(
      docs.map((d) => d.createdByClerkUserId).filter((id): id is string => Boolean(id)),
    );

    const data: OrgDocRow[] = docs.map((d) => ({
      id: d.id,
      title: d.title,
      sourceKind: d.sourceKind,
      sizeBytes: d.sizeBytes,
      creatorEmail: d.createdByClerkUserId
        ? (creatorEmailById.get(d.createdByClerkUserId) ?? d.createdByClerkUserId)
        : "—",
    }));

    return { success: true as const, data };
  } catch (err) {
    return {
      success: false as const,
      error: "Failed to fetch knowledge documents",
      data: [] as OrgDocRow[],
    };
  }
}

type OrgDocRow = {
  id: string;
  title: string;
  sourceKind: KnowledgeSourceKind;
  creatorEmail: string;
  sizeBytes: number;
};

export async function getAgentKnowledgeDocs(agentId: string) {
  try {
    const dbOrgId = await getOrgPrismaId();
    if (!dbOrgId) {
      return {
        success: false as const,
        error: "Unauthorized",
        data: { rows: [] as AttachedAgentKnowledgeRow[] },
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
        data: { rows: [] as AttachedAgentKnowledgeRow[] },
      };
    }

    const attached = await prisma.agentKnowledgeDoc.findMany({
      where: { agentId },
      include: {
        knowledgeDoc: {
          select: {
            id: true,
            title: true,
            sourceKind: true,
            sizeBytes: true,
            updatedAt: true,
            createdByClerkUserId: true,
          },
        },
      },
    });

    const creatorEmailById = await getCreatorEmailsByClerkUserId(
      attached
        .map((r) => r.knowledgeDoc.createdByClerkUserId)
        .filter((id): id is string => Boolean(id)),
    );

    const rows: AttachedAgentKnowledgeRow[] = attached
      .map((r) => r.knowledgeDoc)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .map((d) => ({
        id: d.id,
        title: d.title,
        sourceKind: d.sourceKind,
        sizeBytes: d.sizeBytes,
        updatedAt: d.updatedAt.toISOString(),
        creatorEmail: d.createdByClerkUserId
          ? (creatorEmailById.get(d.createdByClerkUserId) ??
            formatCreator(d.createdByClerkUserId))
          : "—",
      }));

    return { success: true as const, data: { rows } };
  } catch (err) {
    return {
      success: false as const,
      error: "Failed to load agent knowledge base",
      data: { rows: [] as AttachedAgentKnowledgeRow[] },
    };
  }
}

type AttachedAgentKnowledgeRow = {
  id: string;
  title: string;
  sourceKind: KnowledgeSourceKind;
  creatorEmail: string;
  updatedAt: string;
  sizeBytes: number;
};

export async function attachKnowledgeDocToAgent(
  agentId: string,
  knowledgeDocId: string,
) {
  try {
    const dbOrgId = await getOrgPrismaId();
    if (!dbOrgId) return { success: false as const, error: "Unauthorized" };

    const [agent, doc] = await Promise.all([
      prisma.agent.findFirst({
        where: { id: agentId, orgId: dbOrgId },
        select: { id: true },
      }),
      prisma.knowledgeDoc.findFirst({
        where: { id: knowledgeDocId, orgId: dbOrgId },
        select: { id: true },
      }),
    ]);

    if (!agent) return { success: false as const, error: "Agent not found" };
    if (!doc) return { success: false as const, error: "Document not found" };

    await prisma.agentKnowledgeDoc.createMany({
      data: [{ agentId, knowledgeDocId }],
      skipDuplicates: true,
    });

    revalidatePath(`/dashboard/agents/${agentId}`);
    return { success: true as const };
  } catch (err) {
    return { success: false as const, error: "Failed to attach document" };
  }
}

export async function detachKnowledgeDocFromAgent(
  agentId: string,
  knowledgeDocId: string,
) {
  try {
    const dbOrgId = await getOrgPrismaId();
    if (!dbOrgId) return { success: false as const, error: "Unauthorized" };

    const agent = await prisma.agent.findFirst({
      where: { id: agentId, orgId: dbOrgId },
      select: { id: true },
    });
    if (!agent) return { success: false as const, error: "Agent not found" };

    await prisma.agentKnowledgeDoc.deleteMany({
      where: { agentId, knowledgeDocId },
    });

    revalidatePath(`/dashboard/agents/${agentId}`);
    return { success: true as const };
  } catch (err) {
    return { success: false as const, error: "Failed to detach document" };
  }
}
