"use server";

import { clerkClient } from "@clerk/nextjs/server";
import {
  AgentChannelType,
  AgentTone,
  AgentType,
  AgentVisibility,
  CreativityLevel,
  LlmProvider,
  KnowledgeSourceKind,
  Prisma,
  SupportedLanguage,
  VoiceProvider,
} from "@prisma/client";
import { z } from "zod";
import { revalidatePath } from "next/cache";

import {
  agentDetailInclude,
  type AgentDetailWithRelations,
} from "@/components/dashboard/agent-detail/agent-detail-types";
import {
  INTEGRATION_DEPLOYMENTS,
  isDeploymentImplemented,
} from "@/lib/constants/deploy-catalog";
import {
  parseWebChatConfig,
  type WebChatHelpPageConfig,
  type WebChatWidgetConfig,
} from "@/lib/deploy/web-chat-config";
import type { CustomButtonActionConfig } from "@/lib/deploy/custom-button-action";
import type { EscalationActionConfig } from "@/lib/deploy/escalation-action";
import type {
  BookAppointmentActionConfig,
  BookAppointmentWhenToOffer,
} from "@/lib/deploy/book-appointment-action";
import type {
  CollectLeadsActionConfig,
  CollectLeadsFieldsConfig,
  CollectLeadsWhenToAsk,
} from "@/lib/deploy/collect-leads-action";
import type { SuggestedMessagesActionConfig } from "@/lib/deploy/suggested-messages-action";
import type { CustomFormActionConfig } from "@/lib/deploy/custom-form-action";
import {
  MAX_FORM_FIELDS,
  MAX_FORM_DESCRIPTION,
  MAX_FORM_SUBMIT_LABEL,
  MAX_FORM_TITLE,
  CUSTOM_FORM_FIELD_TYPES,
} from "@/lib/deploy/custom-form-action";
import { isKnownLlmModelId, resolveLlmModelId } from "@/lib/ai/model-registry";
import { prisma } from "@/lib/db/prisma";
import { VOICE_PERSONAS } from "@/lib/voice/voice-catalog";
import { getOrgPrismaId } from "@/lib/server/organization";
import { MAX_AGENTS } from "@/lib/billing/plan-features";

export type GetAIAgentByIdErrorCode =
  | "UNAUTHORIZED"
  | "NOT_FOUND"
  | "DB_ERROR";

export type GetAIAgentByIdResult =
  | { success: true; data: AgentDetailWithRelations }
  | {
      success: false;
      error: string;
      code: GetAIAgentByIdErrorCode;
    };

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
    knowledgeDocIds: z.array(z.string().min(1)).optional(),
    name: z.string().min(1, "Agent name is required").max(50, "Name is too long"),
    website: z.string().max(500).optional(),
    description: z
      .string()
      .min(1, "Main goal is required")
      .max(500, "Main goal is too long"),
    handoffEnabled: z.boolean(),
    agentType: z.nativeEnum(AgentType).optional(),
    channels: z.array(z.nativeEnum(AgentChannelType)).optional(),
    defaultLanguage: z.nativeEnum(SupportedLanguage).optional(),
    instructions: z.string().max(20000).optional(),
    welcomeMessage: z.string().max(4000).optional(),
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

    const org = await prisma.organization.findUnique({
      where: { id: dbOrgId },
      select: { plan: true },
    });
    if (!org) return { success: false as const, error: "Organization not found" };

    const maxAgents = MAX_AGENTS[org.plan as keyof typeof MAX_AGENTS] ?? 0;
    if (maxAgents !== Infinity) {
      const existingCount = await prisma.agent.count({ where: { orgId: dbOrgId } });
      if (existingCount >= maxAgents) {
        return {
          success: false as const,
          error: `You've reached the maximum number of agents for your ${org.plan} plan. Upgrade to add more.`,
        };
      }
    }

    const validated = createAgentFromOnboardingSchema.parse(input);
    const websiteUrl = websiteToDb(validated.website);
    const defaultLanguage =
      validated.defaultLanguage ?? validated.languages[0] ?? SupportedLanguage.ENGLISH;

    const agent = await prisma.$transaction(async (tx) => {
      const created = await tx.agent.create({
        data: {
          orgId: dbOrgId,
          name: validated.name,
          agentType: validated.agentType,
          tone: validated.tone,
          customTone: validated.customTone?.trim() || null,
          creativity: validated.creativity,
          description: validated.description,
          instructions: validated.instructions?.trim() || null,
          welcomeMessage: validated.welcomeMessage?.trim() || null,
          websiteUrl,
          handoffEnabled: validated.handoffEnabled,
          defaultLanguage,
          widgetToken: crypto.randomUUID(),
          apiToken: crypto.randomUUID(),
        },
      });

      await tx.agentLanguage.createMany({
        data: validated.languages.map((language) => ({
          agentId: created.id,
          language,
        })),
      });

      if (validated.channels && validated.channels.length > 0) {
        await tx.agentChannel.createMany({
          data: validated.channels.map((channel) => ({
            agentId: created.id,
            channel,
            enabled: true,
          })),
        });
      }

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

      const defaultPersona = VOICE_PERSONAS[0];
      if (defaultPersona) {
        await tx.agentVoice.create({
          data: {
            agentId: created.id,
            provider: VoiceProvider.OPENROUTER,
            voiceId: defaultPersona.voiceId,
            name: defaultPersona.name,
            isPrimary: true,
          },
        });
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
        status: true,
        channels: {
          where: { enabled: true },
          select: { channel: true, enabled: true },
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

export type SidebarAgentListItem = {
  id: string;
  name: string;
  lastActivityAt: Date;
  /** True when the org has at least one session for this agent. */
  hasSessions: boolean;
  activeSessionCount: number;
};

export async function getSidebarAgentsList(): Promise<{
  success: boolean;
  data: SidebarAgentListItem[];
  error?: string;
}> {
  try {
    const dbOrgId = await getOrgPrismaId();
    if (!dbOrgId) {
      return { success: false, error: "Unauthorized", data: [] };
    }

    const agents = await prisma.agent.findMany({
      where: { orgId: dbOrgId },
      select: { id: true, name: true, createdAt: true },
    });

    if (agents.length === 0) {
      return { success: true, data: [] };
    }

    const agentIds = agents.map((a) => a.id);

    const sessions = await prisma.session.findMany({
      where: { orgId: dbOrgId, agentId: { in: agentIds } },
      select: { agentId: true, startedAt: true, status: true },
    });

    const lastActivity = new Map<string, Date>();
    const activeCounts = new Map<string, number>();
    const hasSessions = new Set<string>();

    for (const session of sessions) {
      if (!session.agentId) continue;

      hasSessions.add(session.agentId);

      const prev = lastActivity.get(session.agentId);
      if (!prev || session.startedAt > prev) {
        lastActivity.set(session.agentId, session.startedAt);
      }

      if (
        session.status !== "RESOLVED" &&
        session.status !== "ABANDONED"
      ) {
        activeCounts.set(
          session.agentId,
          (activeCounts.get(session.agentId) ?? 0) + 1,
        );
      }
    }

    const data: SidebarAgentListItem[] = agents
      .map((agent) => ({
        id: agent.id,
        name: agent.name,
        lastActivityAt: lastActivity.get(agent.id) ?? agent.createdAt,
        hasSessions: hasSessions.has(agent.id),
        activeSessionCount: activeCounts.get(agent.id) ?? 0,
      }))
      .sort((a, b) => b.lastActivityAt.getTime() - a.lastActivityAt.getTime());

    return { success: true, data };
  } catch {
    return { success: false, error: "Failed to fetch agents", data: [] };
  }
}

export async function getAIAgentById(
  agentId: string,
): Promise<GetAIAgentByIdResult> {
  if (!agentId?.trim()) {
    return {
      success: false,
      error: "Agent not found",
      code: "NOT_FOUND",
    };
  }

  try {
    const dbOrgId = await getOrgPrismaId();
    if (!dbOrgId) {
      return {
        success: false,
        error: "Unauthorized",
        code: "UNAUTHORIZED",
      };
    }

    const agent = await prisma.agent.findFirst({
      where: { id: agentId, orgId: dbOrgId },
      include: agentDetailInclude,
    });

    if (!agent) {
      return {
        success: false,
        error: "Agent not found",
        code: "NOT_FOUND",
      };
    }

    const { ensureSuggestedMessagesMigrated } = await import(
      "@/lib/deploy/migrate-suggested-messages"
    );
    const migrated = await ensureSuggestedMessagesMigrated(agentId);
    if (migrated) {
      const refreshed = await prisma.agent.findFirst({
        where: { id: agentId, orgId: dbOrgId },
        include: agentDetailInclude,
      });
      if (refreshed) {
        return { success: true, data: refreshed };
      }
    }

    return { success: true, data: agent };
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console -- dev-only diagnostics for masked 404s
      console.error("[getAIAgentById]", agentId, err);
    }
    return {
      success: false,
      error: "Failed to fetch agent",
      code: "DB_ERROR",
    };
  }
}

const updateAgentDeploymentSchema = z.object({
  webChatEnabled: z.boolean().optional(),
  helpPageEnabled: z.boolean().optional(),
  integrationId: z.string().min(1).optional(),
  integrationEnabled: z.boolean().optional(),
});

export async function updateAgentDeployment(
  agentId: string,
  input: z.infer<typeof updateAgentDeploymentSchema>,
) {
  try {
    const dbOrgId = await getOrgPrismaId();
    if (!dbOrgId) {
      return { success: false as const, error: "Unauthorized" };
    }

    const parsed = updateAgentDeploymentSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false as const, error: "Invalid request" };
    }

    const agent = await prisma.agent.findFirst({
      where: { id: agentId, orgId: dbOrgId },
      select: { id: true },
    });

    if (!agent) {
      return { success: false as const, error: "Agent not found" };
    }

    if (
      parsed.data.integrationId !== undefined &&
      parsed.data.integrationEnabled !== undefined
    ) {
      const entry = INTEGRATION_DEPLOYMENTS.find(
        (d) => d.id === parsed.data.integrationId,
      );
      if (!entry) {
        return { success: false as const, error: "Unknown deployment" };
      }

      if (!isDeploymentImplemented(parsed.data.integrationId)) {
        return {
          success: false as const,
          error: "This integration is not available yet",
        };
      }

      if (entry.channelType) {
        await prisma.agentChannel.upsert({
          where: {
            agentId_channel: { agentId, channel: entry.channelType },
          },
          create: {
            agentId,
            channel: entry.channelType,
            enabled: parsed.data.integrationEnabled,
          },
          update: { enabled: parsed.data.integrationEnabled },
        });
      } else {
        const existing = await prisma.agentChannel.findUnique({
          where: {
            agentId_channel: { agentId, channel: "WEB_CHAT" },
          },
        });

        const existingConfig =
          existing?.config &&
          typeof existing.config === "object" &&
          !Array.isArray(existing.config)
            ? (existing.config as Record<string, unknown>)
            : {};

        const integrations =
          existingConfig.integrations &&
          typeof existingConfig.integrations === "object" &&
          !Array.isArray(existingConfig.integrations)
            ? {
                ...(existingConfig.integrations as Record<string, unknown>),
              }
            : {};

        integrations[parsed.data.integrationId] = {
          enabled: parsed.data.integrationEnabled,
        };

        const nextConfig = {
          ...existingConfig,
          integrations,
        } as Prisma.InputJsonValue;

        await prisma.agentChannel.upsert({
          where: {
            agentId_channel: { agentId, channel: "WEB_CHAT" },
          },
          create: {
            agentId,
            channel: "WEB_CHAT",
            enabled: existing?.enabled ?? true,
            config: nextConfig,
          },
          update: { config: nextConfig },
        });
      }

      revalidatePath(`/dashboard/agents/${agentId}`);
      revalidatePath(
        `/dashboard/agents/${agentId}/deploy/${parsed.data.integrationId}`,
      );
      return { success: true as const };
    }

    const existing = await prisma.agentChannel.findUnique({
      where: {
        agentId_channel: { agentId, channel: "WEB_CHAT" },
      },
    });

    const existingConfig =
      existing?.config &&
      typeof existing.config === "object" &&
      !Array.isArray(existing.config)
        ? (existing.config as Record<string, unknown>)
        : {};

    const helpPage =
      existingConfig.helpPage &&
      typeof existingConfig.helpPage === "object" &&
      !Array.isArray(existingConfig.helpPage)
        ? { ...(existingConfig.helpPage as Record<string, unknown>) }
        : {};

    if (parsed.data.helpPageEnabled !== undefined) {
      helpPage.enabled = parsed.data.helpPageEnabled;
    }

    const nextConfig = { ...existingConfig } as Prisma.InputJsonValue;
    if (parsed.data.helpPageEnabled !== undefined) {
      (nextConfig as Record<string, unknown>).helpPage = helpPage;
    }

    const enabled =
      parsed.data.webChatEnabled ?? existing?.enabled ?? true;

    const configPayload =
      parsed.data.helpPageEnabled !== undefined ? nextConfig : undefined;

    await prisma.agentChannel.upsert({
      where: {
        agentId_channel: { agentId, channel: "WEB_CHAT" },
      },
      create: {
        agentId,
        channel: "WEB_CHAT",
        enabled,
        config: (configPayload ?? {}) as Prisma.InputJsonValue,
      },
      update: {
        ...(parsed.data.webChatEnabled !== undefined
          ? { enabled: parsed.data.webChatEnabled }
          : {}),
        ...(configPayload !== undefined ? { config: configPayload } : {}),
      },
    });

    if (parsed.data.webChatEnabled !== undefined) {
      await prisma.agent.update({
        where: { id: agentId, orgId: dbOrgId },
        data: {
          visibility: parsed.data.webChatEnabled
            ? AgentVisibility.PUBLIC
            : AgentVisibility.PRIVATE,
        },
      });
    }

    revalidatePath(`/dashboard/agents/${agentId}`);
    revalidatePath(`/dashboard/agents/${agentId}/deploy/chat-widget`);
    revalidatePath(`/dashboard/agents/${agentId}/deploy/help-page`);

    return { success: true as const };
  } catch {
    return { success: false as const, error: "Failed to update deployment" };
  }
}

const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color")
  .optional();

const updateChatWidgetSettingsSchema = z.object({
  welcomeMessage: z.string().max(4000).nullable().optional(),
  widget: z
    .object({
      displayName: z.string().max(120).nullable().optional(),
      useMobileWelcome: z.boolean().optional(),
      welcomeMessageMobile: z.string().max(4000).nullable().optional(),
      autoShowWelcomePopup: z.boolean().optional(),
      welcomePopupDelaySec: z.number().int().min(1).max(60).optional(),
      autoShowWelcomePopupMobile: z.boolean().optional(),
      placeholder: z.string().max(120).nullable().optional(),
      voiceToTextEnabled: z.boolean().optional(),
      attachmentsEnabled: z.boolean().optional(),
      appearance: z.enum(["light", "dark"]).optional(),
      primaryColor: hexColorSchema,
      bubbleColor: hexColorSchema,
    })
    .optional(),
});

export async function updateChatWidgetSettings(
  agentId: string,
  input: z.infer<typeof updateChatWidgetSettingsSchema>,
) {
  try {
    const dbOrgId = await getOrgPrismaId();
    if (!dbOrgId) return { success: false as const, error: "Unauthorized" };

    const validated = updateChatWidgetSettingsSchema.parse(input);

    const agent = await prisma.agent.findFirst({
      where: { id: agentId, orgId: dbOrgId },
      select: { id: true },
    });

    if (!agent) {
      return { success: false as const, error: "Agent not found" };
    }

    if (validated.welcomeMessage !== undefined) {
      await prisma.agent.update({
        where: { id: agentId },
        data: {
          welcomeMessage: validated.welcomeMessage?.trim() || null,
        },
      });
    }

    if (validated.widget !== undefined) {
      const existing = await prisma.agentChannel.findUnique({
        where: {
          agentId_channel: { agentId, channel: "WEB_CHAT" },
        },
      });

      const existingConfig =
        existing?.config &&
        typeof existing.config === "object" &&
        !Array.isArray(existing.config)
          ? (existing.config as Record<string, unknown>)
          : {};

      const parsed = parseWebChatConfig(existingConfig);
      const currentWidget = parsed.widget ?? {};
      const incoming = validated.widget;

      const nextWidget: WebChatWidgetConfig = { ...currentWidget };

      if (incoming.displayName !== undefined) {
        nextWidget.displayName = incoming.displayName?.trim() || undefined;
      }
      if (incoming.useMobileWelcome !== undefined) {
        nextWidget.useMobileWelcome = incoming.useMobileWelcome;
      }
      if (incoming.welcomeMessageMobile !== undefined) {
        nextWidget.welcomeMessageMobile =
          incoming.welcomeMessageMobile?.trim() || undefined;
      }
      if (incoming.autoShowWelcomePopup !== undefined) {
        nextWidget.autoShowWelcomePopup = incoming.autoShowWelcomePopup;
      }
      if (incoming.welcomePopupDelaySec !== undefined) {
        nextWidget.welcomePopupDelaySec = incoming.welcomePopupDelaySec;
      }
      if (incoming.autoShowWelcomePopupMobile !== undefined) {
        nextWidget.autoShowWelcomePopupMobile = incoming.autoShowWelcomePopupMobile;
      }
      if (incoming.placeholder !== undefined) {
        nextWidget.placeholder = incoming.placeholder?.trim() || undefined;
      }
      if (incoming.voiceToTextEnabled !== undefined) {
        nextWidget.voiceToTextEnabled = incoming.voiceToTextEnabled;
      }
      if (incoming.attachmentsEnabled !== undefined) {
        nextWidget.attachmentsEnabled = incoming.attachmentsEnabled;
      }
      if (incoming.appearance !== undefined) {
        nextWidget.appearance = incoming.appearance;
      }
      if (incoming.primaryColor !== undefined) {
        nextWidget.primaryColor = incoming.primaryColor;
      }
      if (incoming.bubbleColor !== undefined) {
        nextWidget.bubbleColor = incoming.bubbleColor;
      }

      const nextConfig = {
        ...existingConfig,
        widget: nextWidget,
      } as Prisma.InputJsonValue;

      await prisma.agentChannel.upsert({
        where: {
          agentId_channel: { agentId, channel: "WEB_CHAT" },
        },
        create: {
          agentId,
          channel: "WEB_CHAT",
          enabled: true,
          config: nextConfig,
        },
        update: { config: nextConfig },
      });
    }

    revalidatePath(`/dashboard/agents/${agentId}`);
    revalidatePath(`/dashboard/agents/${agentId}/deploy/chat-widget`);
    revalidatePath(`/dashboard/agents/${agentId}/deploy/wordpress`);
    revalidatePath(`/widget/${agentId}`);

    const updated = await prisma.agent.findFirst({
      where: { id: agentId, orgId: dbOrgId },
      include: agentDetailInclude,
    });

    if (!updated) {
      return { success: false as const, error: "Agent not found" };
    }

    return { success: true as const, data: updated };
  } catch (err) {
    if (err instanceof z.ZodError) {
      return {
        success: false as const,
        error: err.issues[0]?.message ?? "Invalid input",
      };
    }
    return { success: false as const, error: "Failed to update chat widget settings" };
  }
}

const updateSuggestedMessagesActionSettingsSchema = z.object({
  enabled: z.boolean().optional(),
  staticStarters: z.array(z.string().max(200)).max(20).optional(),
  keepShowingAfterFirst: z.boolean().optional(),
  dynamicEnabled: z.boolean().optional(),
});

export async function updateSuggestedMessagesActionSettings(
  agentId: string,
  input: z.infer<typeof updateSuggestedMessagesActionSettingsSchema>,
) {
  try {
    const dbOrgId = await getOrgPrismaId();
    if (!dbOrgId) return { success: false as const, error: "Unauthorized" };

    const validated = updateSuggestedMessagesActionSettingsSchema.parse(input);

    const agent = await prisma.agent.findFirst({
      where: { id: agentId, orgId: dbOrgId },
      select: { id: true },
    });

    if (!agent) {
      return { success: false as const, error: "Agent not found" };
    }

    const existing = await prisma.agentChannel.findUnique({
      where: {
        agentId_channel: { agentId, channel: "WEB_CHAT" },
      },
    });

    const existingConfig =
      existing?.config &&
      typeof existing.config === "object" &&
      !Array.isArray(existing.config)
        ? (existing.config as Record<string, unknown>)
        : {};

    const parsed = parseWebChatConfig(existingConfig);
    const current = parsed.actions?.suggestedMessages ?? {};
    const incoming = validated;

    const nextAction: SuggestedMessagesActionConfig = { ...current };

    if (incoming.enabled !== undefined) {
      nextAction.enabled = incoming.enabled;
    }
    if (incoming.staticStarters !== undefined) {
      nextAction.staticStarters = incoming.staticStarters
        .map((s) => s.trim())
        .filter(Boolean);
    }
    if (incoming.keepShowingAfterFirst !== undefined) {
      nextAction.keepShowingAfterFirst = incoming.keepShowingAfterFirst;
    }
    if (incoming.dynamicEnabled !== undefined) {
      nextAction.dynamicEnabled = incoming.dynamicEnabled;
    }

    const nextConfig = {
      ...existingConfig,
      actions: {
        ...(parsed.actions ?? {}),
        suggestedMessages: nextAction,
      },
    } as Prisma.InputJsonValue;

    await prisma.agentChannel.upsert({
      where: {
        agentId_channel: { agentId, channel: "WEB_CHAT" },
      },
      create: {
        agentId,
        channel: "WEB_CHAT",
        enabled: true,
        config: nextConfig,
      },
      update: { config: nextConfig },
    });

    revalidatePath(`/dashboard/agents/${agentId}`);
    revalidatePath(`/dashboard/agents/${agentId}/deploy/chat-widget`);
    revalidatePath(`/dashboard/agents/${agentId}/deploy/help-page`);
    revalidatePath(`/widget/${agentId}`);

    const updated = await prisma.agent.findFirst({
      where: { id: agentId, orgId: dbOrgId },
      include: agentDetailInclude,
    });

    if (!updated) {
      return { success: false as const, error: "Agent not found" };
    }

    return { success: true as const, data: updated };
  } catch (err) {
    if (err instanceof z.ZodError) {
      return {
        success: false as const,
        error: err.issues[0]?.message ?? "Invalid input",
      };
    }
    return {
      success: false as const,
      error: "Failed to update suggested messages action",
    };
  }
}

const leadFieldRequirementSchema = z.enum(["required", "optional", "off"]);

const collectLeadsFieldsSchema = z
  .object({
    name: leadFieldRequirementSchema.optional(),
    email: leadFieldRequirementSchema.optional(),
    phone: leadFieldRequirementSchema.optional(),
    company: leadFieldRequirementSchema.optional(),
    notes: leadFieldRequirementSchema.optional(),
  })
  .optional();

const updateCollectLeadsActionSettingsSchema = z.object({
  enabled: z.boolean().optional(),
  whenToAsk: z.enum(["proactive", "intent_only"]).optional(),
  fields: collectLeadsFieldsSchema,
  consentText: z.string().max(2000).optional(),
  notifyEmail: z.union([z.string().email().max(320), z.literal("")]).optional(),
});

export async function updateCollectLeadsActionSettings(
  agentId: string,
  input: z.infer<typeof updateCollectLeadsActionSettingsSchema>,
) {
  try {
    const dbOrgId = await getOrgPrismaId();
    if (!dbOrgId) return { success: false as const, error: "Unauthorized" };

    const validated = updateCollectLeadsActionSettingsSchema.parse(input);

    const agent = await prisma.agent.findFirst({
      where: { id: agentId, orgId: dbOrgId },
      select: { id: true },
    });

    if (!agent) {
      return { success: false as const, error: "Agent not found" };
    }

    const existing = await prisma.agentChannel.findUnique({
      where: {
        agentId_channel: { agentId, channel: "WEB_CHAT" },
      },
    });

    const existingConfig =
      existing?.config &&
      typeof existing.config === "object" &&
      !Array.isArray(existing.config)
        ? (existing.config as Record<string, unknown>)
        : {};

    const parsed = parseWebChatConfig(existingConfig);
    const current = parsed.actions?.collectLeads ?? {};
    const incoming = validated;

    const nextAction: CollectLeadsActionConfig = { ...current };

    if (incoming.enabled !== undefined) {
      nextAction.enabled = incoming.enabled;
    }
    if (incoming.whenToAsk !== undefined) {
      nextAction.whenToAsk = incoming.whenToAsk as CollectLeadsWhenToAsk;
    }
    if (incoming.fields !== undefined) {
      nextAction.fields = incoming.fields as CollectLeadsFieldsConfig;
    }
    if (incoming.consentText !== undefined) {
      const trimmed = incoming.consentText.trim();
      if (trimmed) nextAction.consentText = trimmed;
    }
    if (incoming.notifyEmail !== undefined) {
      const trimmed = incoming.notifyEmail.trim();
      nextAction.notifyEmail = trimmed || undefined;
    }

    const nextConfig = {
      ...existingConfig,
      actions: {
        ...(parsed.actions ?? {}),
        collectLeads: nextAction,
      },
    } as Prisma.InputJsonValue;

    await prisma.agentChannel.upsert({
      where: {
        agentId_channel: { agentId, channel: "WEB_CHAT" },
      },
      create: {
        agentId,
        channel: "WEB_CHAT",
        enabled: true,
        config: nextConfig,
      },
      update: { config: nextConfig },
    });

    revalidatePath(`/dashboard/agents/${agentId}`);
    revalidatePath("/dashboard/leads");

    const updated = await prisma.agent.findFirst({
      where: { id: agentId, orgId: dbOrgId },
      include: agentDetailInclude,
    });

    if (!updated) {
      return { success: false as const, error: "Agent not found" };
    }

    return { success: true as const, data: updated };
  } catch (err) {
    if (err instanceof z.ZodError) {
      return {
        success: false as const,
        error: err.issues[0]?.message ?? "Invalid input",
      };
    }
    return {
      success: false as const,
      error: "Failed to update collect leads action",
    };
  }
}

export type AgentLeadListItem = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  source: string;
  createdAt: string;
};

export async function listAgentLeads(
  agentId: string,
  options?: { limit?: number },
): Promise<
  | { success: true; data: AgentLeadListItem[] }
  | { success: false; error: string }
> {
  try {
    const dbOrgId = await getOrgPrismaId();
    if (!dbOrgId) return { success: false, error: "Unauthorized" };

    const agent = await prisma.agent.findFirst({
      where: { id: agentId, orgId: dbOrgId },
      select: { id: true },
    });

    if (!agent) {
      return { success: false, error: "Agent not found" };
    }

    const limit = Math.min(options?.limit ?? 20, 50);

    const leads = await prisma.agentLead.findMany({
      where: { orgId: dbOrgId, agentId },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        company: true,
        source: true,
        createdAt: true,
      },
    });

    return {
      success: true,
      data: leads.map((lead) => ({
        id: lead.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        source: lead.source,
        createdAt: lead.createdAt.toISOString(),
      })),
    };
  } catch {
    return { success: false, error: "Failed to load leads" };
  }
}

const updateBookAppointmentActionSettingsSchema = z.object({
  enabled: z.boolean().optional(),
  whenToOffer: z.enum(["proactive", "intent_only"]).optional(),
  departments: z
    .array(z.string().trim().min(1).max(80))
    .max(12)
    .optional(),
  notifyEmail: z.union([z.string().email().max(320), z.literal("")]).optional(),
});

export async function updateBookAppointmentActionSettings(
  agentId: string,
  input: z.infer<typeof updateBookAppointmentActionSettingsSchema>,
) {
  try {
    const dbOrgId = await getOrgPrismaId();
    if (!dbOrgId) return { success: false as const, error: "Unauthorized" };

    const validated = updateBookAppointmentActionSettingsSchema.parse(input);

    const agent = await prisma.agent.findFirst({
      where: { id: agentId, orgId: dbOrgId },
      select: { id: true },
    });

    if (!agent) {
      return { success: false as const, error: "Agent not found" };
    }

    const existing = await prisma.agentChannel.findUnique({
      where: {
        agentId_channel: { agentId, channel: "WEB_CHAT" },
      },
    });

    const existingConfig =
      existing?.config &&
      typeof existing.config === "object" &&
      !Array.isArray(existing.config)
        ? (existing.config as Record<string, unknown>)
        : {};

    const parsed = parseWebChatConfig(existingConfig);
    const current = parsed.actions?.bookAppointment ?? {};
    const incoming = validated;

    const nextAction: BookAppointmentActionConfig = { ...current };

    if (incoming.enabled !== undefined) {
      nextAction.enabled = incoming.enabled;
    }
    if (incoming.whenToOffer !== undefined) {
      nextAction.whenToOffer = incoming.whenToOffer as BookAppointmentWhenToOffer;
    }
    if (incoming.departments !== undefined) {
      const normalized = incoming.departments
        .map((d) => d.trim().toLowerCase())
        .filter(Boolean);
      nextAction.departments = Array.from(new Set(normalized));
    }
    if (incoming.notifyEmail !== undefined) {
      const trimmed = incoming.notifyEmail.trim();
      nextAction.notifyEmail = trimmed || undefined;
    }

    const nextConfig = {
      ...existingConfig,
      actions: {
        ...(parsed.actions ?? {}),
        bookAppointment: nextAction,
      },
    } as Prisma.InputJsonValue;

    await prisma.agentChannel.upsert({
      where: {
        agentId_channel: { agentId, channel: "WEB_CHAT" },
      },
      create: {
        agentId,
        channel: "WEB_CHAT",
        enabled: true,
        config: nextConfig,
      },
      update: { config: nextConfig },
    });

    revalidatePath(`/dashboard/agents/${agentId}`);

    const updated = await prisma.agent.findFirst({
      where: { id: agentId, orgId: dbOrgId },
      include: agentDetailInclude,
    });

    if (!updated) {
      return { success: false as const, error: "Agent not found" };
    }

    return { success: true as const, data: updated };
  } catch (err) {
    if (err instanceof z.ZodError) {
      return {
        success: false as const,
        error: err.issues[0]?.message ?? "Invalid input",
      };
    }
    return {
      success: false as const,
      error: "Failed to update book appointment action",
    };
  }
}

export type AgentAppointmentListItem = {
  id: string;
  customerName: string;
  customerEmail: string | null;
  department: string;
  date: string;
  time: string;
  status: string;
  createdAt: string;
};

export async function listAgentAppointments(
  agentId: string,
  options?: { limit?: number },
): Promise<
  | { success: true; data: AgentAppointmentListItem[] }
  | { success: false; error: string }
> {
  try {
    const dbOrgId = await getOrgPrismaId();
    if (!dbOrgId) return { success: false, error: "Unauthorized" };

    const agent = await prisma.agent.findFirst({
      where: { id: agentId, orgId: dbOrgId },
      select: { id: true },
    });

    if (!agent) {
      return { success: false, error: "Agent not found" };
    }

    const limit = Math.min(options?.limit ?? 20, 50);

    const sessions = await prisma.session.findMany({
      where: { agentId, orgId: dbOrgId },
      select: { id: true },
    });
    const sessionIds = sessions.map((s) => s.id);

    if (sessionIds.length === 0) {
      return { success: true, data: [] };
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        orgId: dbOrgId,
        sessionId: { in: sessionIds },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        customerName: true,
        customerEmail: true,
        department: true,
        date: true,
        time: true,
        status: true,
        createdAt: true,
      },
    });

    return {
      success: true,
      data: appointments.map((item) => ({
        id: item.id,
        customerName: item.customerName,
        customerEmail: item.customerEmail,
        department: item.department,
        date: item.date.toISOString(),
        time: item.time,
        status: item.status,
        createdAt: item.createdAt.toISOString(),
      })),
    };
  } catch {
    return { success: false, error: "Failed to load appointments" };
  }
}

const escalationTriggersSchema = z.object({
  userRequested: z.boolean().optional(),
  negativeSentiment: z.boolean().optional(),
  aiFailure: z.boolean().optional(),
  unsupportedRequest: z.boolean().optional(),
});

const updateEscalationActionSettingsSchema = z.object({
  enabled: z.boolean().optional(),
  triggers: escalationTriggersSchema.optional(),
  customerMessage: z.string().max(500).optional(),
  createTicketOnEscalate: z.boolean().optional(),
  allowCreateTicketTool: z.boolean().optional(),
  ticketPriority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  requireEmailForTicket: z.boolean().optional(),
});

export async function updateEscalationActionSettings(
  agentId: string,
  input: z.infer<typeof updateEscalationActionSettingsSchema>,
) {
  try {
    const dbOrgId = await getOrgPrismaId();
    if (!dbOrgId) return { success: false as const, error: "Unauthorized" };

    const validated = updateEscalationActionSettingsSchema.parse(input);

    const agent = await prisma.agent.findFirst({
      where: { id: agentId, orgId: dbOrgId },
      select: { id: true },
    });

    if (!agent) {
      return { success: false as const, error: "Agent not found" };
    }

    const existing = await prisma.agentChannel.findUnique({
      where: {
        agentId_channel: { agentId, channel: "WEB_CHAT" },
      },
    });

    const existingConfig =
      existing?.config &&
      typeof existing.config === "object" &&
      !Array.isArray(existing.config)
        ? (existing.config as Record<string, unknown>)
        : {};

    const parsed = parseWebChatConfig(existingConfig);
    const current = parsed.actions?.escalations ?? {};
    const incoming = validated;

    const nextAction: EscalationActionConfig = { ...current };

    if (incoming.enabled !== undefined) {
      nextAction.enabled = incoming.enabled;
    }
    if (incoming.triggers !== undefined) {
      nextAction.triggers = {
        ...(current.triggers ?? {}),
        ...incoming.triggers,
      };
    }
    if (incoming.customerMessage !== undefined) {
      const trimmed = incoming.customerMessage.trim();
      nextAction.customerMessage = trimmed || undefined;
    }
    if (incoming.createTicketOnEscalate !== undefined) {
      nextAction.createTicketOnEscalate = incoming.createTicketOnEscalate;
    }
    if (incoming.allowCreateTicketTool !== undefined) {
      nextAction.allowCreateTicketTool = incoming.allowCreateTicketTool;
    }
    if (incoming.ticketPriority !== undefined) {
      nextAction.ticketPriority = incoming.ticketPriority;
    }
    if (incoming.requireEmailForTicket !== undefined) {
      nextAction.requireEmailForTicket = incoming.requireEmailForTicket;
    }

    const nextConfig = {
      ...existingConfig,
      actions: {
        ...(parsed.actions ?? {}),
        escalations: nextAction,
      },
    } as Prisma.InputJsonValue;

    await prisma.agentChannel.upsert({
      where: {
        agentId_channel: { agentId, channel: "WEB_CHAT" },
      },
      create: {
        agentId,
        channel: "WEB_CHAT",
        enabled: true,
        config: nextConfig,
      },
      update: { config: nextConfig },
    });

    if (incoming.enabled !== undefined) {
      await prisma.agent.update({
        where: { id: agentId },
        data: { handoffEnabled: incoming.enabled },
      });
    }

    revalidatePath(`/dashboard/agents/${agentId}`);
    revalidatePath(`/widget/${agentId}`);

    const updated = await prisma.agent.findFirst({
      where: { id: agentId, orgId: dbOrgId },
      include: agentDetailInclude,
    });

    if (!updated) {
      return { success: false as const, error: "Agent not found" };
    }

    return { success: true as const, data: updated };
  } catch (err) {
    if (err instanceof z.ZodError) {
      return {
        success: false as const,
        error: err.issues[0]?.message ?? "Invalid input",
      };
    }
    return {
      success: false as const,
      error: "Failed to update escalation action",
    };
  }
}

const customButtonItemSchema = z.discriminatedUnion("kind", [
  z.object({
    label: z.string().min(1).max(80),
    kind: z.literal("message"),
    message: z.string().min(1).max(200),
  }),
  z.object({
    label: z.string().min(1).max(80),
    kind: z.literal("link"),
    href: z
      .string()
      .url()
      .max(2048)
      .refine((v) => v.startsWith("https://"), "Link must use HTTPS"),
    openInNewTab: z.boolean().optional(),
  }),
]);

const customFormFieldSchema = z.object({
  id: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-zA-Z0-9_-]+$/, "Invalid field id"),
  type: z.enum(CUSTOM_FORM_FIELD_TYPES),
  label: z.string().min(1).max(80),
  placeholder: z.string().max(120).optional(),
  required: z.boolean(),
  options: z.array(z.string().min(1).max(80)).max(20).optional(),
});

const updateCustomFormActionSettingsSchema = z.object({
  enabled: z.boolean().optional(),
  formId: z.string().min(1).max(64).optional(),
  title: z.string().max(MAX_FORM_TITLE).optional(),
  description: z.string().max(MAX_FORM_DESCRIPTION).optional(),
  submitLabel: z.string().max(MAX_FORM_SUBMIT_LABEL).optional(),
  fields: z.array(customFormFieldSchema).max(MAX_FORM_FIELDS).optional(),
  showAfterUserMessages: z.number().int().min(1).max(100).nullable().optional(),
  allowLlmTrigger: z.boolean().optional(),
  notifyEmail: z.union([z.string().email().max(320), z.literal("")]).optional(),
});

const updateCustomButtonActionSettingsSchema = z.object({
  enabled: z.boolean().optional(),
  buttons: z.array(customButtonItemSchema).max(8).optional(),
});

export async function updateCustomButtonActionSettings(
  agentId: string,
  input: z.infer<typeof updateCustomButtonActionSettingsSchema>,
) {
  try {
    const dbOrgId = await getOrgPrismaId();
    if (!dbOrgId) return { success: false as const, error: "Unauthorized" };

    const validated = updateCustomButtonActionSettingsSchema.parse(input);

    const agent = await prisma.agent.findFirst({
      where: { id: agentId, orgId: dbOrgId },
      select: { id: true },
    });

    if (!agent) {
      return { success: false as const, error: "Agent not found" };
    }

    const existing = await prisma.agentChannel.findUnique({
      where: {
        agentId_channel: { agentId, channel: "WEB_CHAT" },
      },
    });

    const existingConfig =
      existing?.config &&
      typeof existing.config === "object" &&
      !Array.isArray(existing.config)
        ? (existing.config as Record<string, unknown>)
        : {};

    const parsed = parseWebChatConfig(existingConfig);
    const current = parsed.actions?.customButtons ?? {};
    const incoming = validated;

    const nextAction: CustomButtonActionConfig = { ...current };

    if (incoming.enabled !== undefined) {
      nextAction.enabled = incoming.enabled;
    }
    if (incoming.buttons !== undefined) {
      nextAction.buttons = incoming.buttons.map((b) => {
        if (b.kind === "message") {
          return {
            label: b.label.trim(),
            kind: b.kind,
            message: b.message.trim(),
          };
        }
        return {
          label: b.label.trim(),
          kind: b.kind,
          href: b.href.trim(),
          openInNewTab: b.openInNewTab ?? true,
        };
      });
    }

    const nextConfig = {
      ...existingConfig,
      actions: {
        ...(parsed.actions ?? {}),
        customButtons: nextAction,
      },
    } as Prisma.InputJsonValue;

    await prisma.agentChannel.upsert({
      where: {
        agentId_channel: { agentId, channel: "WEB_CHAT" },
      },
      create: {
        agentId,
        channel: "WEB_CHAT",
        enabled: true,
        config: nextConfig,
      },
      update: { config: nextConfig },
    });

    revalidatePath(`/dashboard/agents/${agentId}`);
    revalidatePath(`/dashboard/agents/${agentId}/deploy/chat-widget`);
    revalidatePath(`/dashboard/agents/${agentId}/deploy/help-page`);
    revalidatePath(`/widget/${agentId}`);
    revalidatePath(`/help/${agentId}`);

    const updated = await prisma.agent.findFirst({
      where: { id: agentId, orgId: dbOrgId },
      include: agentDetailInclude,
    });

    if (!updated) {
      return { success: false as const, error: "Agent not found" };
    }

    return { success: true as const, data: updated };
  } catch (err) {
    if (err instanceof z.ZodError) {
      return {
        success: false as const,
        error: err.issues[0]?.message ?? "Invalid input",
      };
    }
    return {
      success: false as const,
      error: "Failed to update custom button action",
    };
  }
}

export async function updateCustomFormActionSettings(
  agentId: string,
  input: z.infer<typeof updateCustomFormActionSettingsSchema>,
) {
  try {
    const dbOrgId = await getOrgPrismaId();
    if (!dbOrgId) return { success: false as const, error: "Unauthorized" };

    const validated = updateCustomFormActionSettingsSchema.parse(input);

    const agent = await prisma.agent.findFirst({
      where: { id: agentId, orgId: dbOrgId },
      select: { id: true },
    });

    if (!agent) {
      return { success: false as const, error: "Agent not found" };
    }

    const existing = await prisma.agentChannel.findUnique({
      where: {
        agentId_channel: { agentId, channel: "WEB_CHAT" },
      },
    });

    const existingConfig =
      existing?.config &&
      typeof existing.config === "object" &&
      !Array.isArray(existing.config)
        ? (existing.config as Record<string, unknown>)
        : {};

    const parsed = parseWebChatConfig(existingConfig);
    const current = parsed.actions?.customForm ?? {};
    const incoming = validated;

    const nextAction: CustomFormActionConfig = { ...current };

    if (incoming.enabled !== undefined) {
      nextAction.enabled = incoming.enabled;
    }
    if (incoming.formId !== undefined) {
      nextAction.formId = incoming.formId;
    } else if (!nextAction.formId) {
      nextAction.formId = crypto.randomUUID().replace(/-/g, "").slice(0, 24);
    }
    if (incoming.title !== undefined) {
      const trimmed = incoming.title.trim();
      nextAction.title = trimmed || undefined;
    }
    if (incoming.description !== undefined) {
      const trimmed = incoming.description.trim();
      nextAction.description = trimmed || undefined;
    }
    if (incoming.submitLabel !== undefined) {
      const trimmed = incoming.submitLabel.trim();
      nextAction.submitLabel = trimmed || undefined;
    }
    if (incoming.fields !== undefined) {
      nextAction.fields = incoming.fields.map((f) => {
        const base = {
          id: f.id,
          type: f.type,
          label: f.label.trim(),
          required: f.required,
          ...(f.placeholder?.trim()
            ? { placeholder: f.placeholder.trim() }
            : {}),
        };
        if (f.type === "select" && f.options?.length) {
          return { ...base, options: f.options.map((o) => o.trim()) };
        }
        return base;
      });
    }
    if (incoming.showAfterUserMessages !== undefined) {
      nextAction.showAfterUserMessages = incoming.showAfterUserMessages;
    }
    if (incoming.allowLlmTrigger !== undefined) {
      nextAction.allowLlmTrigger = incoming.allowLlmTrigger;
    }
    if (incoming.notifyEmail !== undefined) {
      nextAction.notifyEmail = incoming.notifyEmail?.trim() || undefined;
    }

    const nextConfig = {
      ...existingConfig,
      actions: {
        ...(parsed.actions ?? {}),
        customForm: nextAction,
      },
    } as Prisma.InputJsonValue;

    await prisma.agentChannel.upsert({
      where: {
        agentId_channel: { agentId, channel: "WEB_CHAT" },
      },
      create: {
        agentId,
        channel: "WEB_CHAT",
        enabled: true,
        config: nextConfig,
      },
      update: { config: nextConfig },
    });

    revalidatePath(`/dashboard/agents/${agentId}`);
    revalidatePath(`/widget/${agentId}`);
    revalidatePath(`/help/${agentId}`);
    revalidatePath("/dashboard/leads");

    const updated = await prisma.agent.findFirst({
      where: { id: agentId, orgId: dbOrgId },
      include: agentDetailInclude,
    });

    if (!updated) {
      return { success: false as const, error: "Agent not found" };
    }

    return { success: true as const, data: updated };
  } catch (err) {
    if (err instanceof z.ZodError) {
      return {
        success: false as const,
        error: err.issues[0]?.message ?? "Invalid input",
      };
    }
    return {
      success: false as const,
      error: "Failed to update custom form action",
    };
  }
}

export type FormSubmissionListItem = {
  id: string;
  formId: string;
  sessionId: string | null;
  values: Record<string, string>;
  createdAt: string;
};

export async function listFormSubmissions(
  agentId: string,
  options?: { limit?: number },
): Promise<
  | { success: true; data: FormSubmissionListItem[] }
  | { success: false; error: string }
> {
  try {
    const dbOrgId = await getOrgPrismaId();
    if (!dbOrgId) return { success: false, error: "Unauthorized" };

    const agent = await prisma.agent.findFirst({
      where: { id: agentId, orgId: dbOrgId },
      select: { id: true },
    });

    if (!agent) {
      return { success: false, error: "Agent not found" };
    }

    const limit = Math.min(options?.limit ?? 20, 50);

    const submissions = await prisma.formSubmission.findMany({
      where: { orgId: dbOrgId, agentId },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        formId: true,
        sessionId: true,
        values: true,
        createdAt: true,
      },
    });

    return {
      success: true,
      data: submissions.map((row) => ({
        id: row.id,
        formId: row.formId,
        sessionId: row.sessionId,
        values:
          row.values &&
          typeof row.values === "object" &&
          !Array.isArray(row.values)
            ? (row.values as Record<string, string>)
            : {},
        createdAt: row.createdAt.toISOString(),
      })),
    };
  } catch {
    return { success: false, error: "Failed to load form submissions" };
  }
}

const urlSchema = z.string().url().max(2048).nullable().optional();

const updateHelpPageSettingsSchema = z.object({
  helpPage: z
    .object({
      pageTitle: z.string().max(120).nullable().optional(),
      headline: z.string().max(200).nullable().optional(),
      faviconUrl: urlSchema,
      themeSwitchEnabled: z.boolean().optional(),
      defaultTheme: z.enum(["light", "dark"]).optional(),
      primaryColorLight: hexColorSchema,
      primaryColorDark: hexColorSchema,
      voiceToTextEnabled: z.boolean().optional(),
      logoUrl: urlSchema,
      logoDarkUrl: urlSchema,
      heroUrl: urlSchema,
      heroDarkUrl: urlSchema,
      placeholder: z.string().max(120).nullable().optional(),
      navLinks: z
        .array(
          z.object({
            label: z.string().max(80),
            href: z
              .string()
              .max(2048)
              .refine(
                (v) =>
                  v.startsWith("/") ||
                  v.startsWith("http://") ||
                  v.startsWith("https://"),
                "Link must be a path or URL",
              ),
            variant: z.enum(["primary", "default"]),
          }),
        )
        .max(8)
        .optional(),
    })
    .optional(),
});

export async function updateHelpPageSettings(
  agentId: string,
  input: z.infer<typeof updateHelpPageSettingsSchema>,
) {
  try {
    const dbOrgId = await getOrgPrismaId();
    if (!dbOrgId) return { success: false as const, error: "Unauthorized" };

    const validated = updateHelpPageSettingsSchema.parse(input);

    const agent = await prisma.agent.findFirst({
      where: { id: agentId, orgId: dbOrgId },
      select: { id: true },
    });

    if (!agent) {
      return { success: false as const, error: "Agent not found" };
    }

    if (validated.helpPage !== undefined) {
      const existing = await prisma.agentChannel.findUnique({
        where: {
          agentId_channel: { agentId, channel: "WEB_CHAT" },
        },
      });

      const existingConfig =
        existing?.config &&
        typeof existing.config === "object" &&
        !Array.isArray(existing.config)
          ? (existing.config as Record<string, unknown>)
          : {};

      const parsed = parseWebChatConfig(existingConfig);
      const currentHelpPage = parsed.helpPage ?? {};
      const incoming = validated.helpPage;

      const nextHelpPage: WebChatHelpPageConfig = { ...currentHelpPage };

      if (incoming.pageTitle !== undefined) {
        nextHelpPage.pageTitle = incoming.pageTitle?.trim() || undefined;
      }
      if (incoming.headline !== undefined) {
        nextHelpPage.headline = incoming.headline?.trim() || undefined;
      }
      if (incoming.faviconUrl !== undefined) {
        nextHelpPage.faviconUrl = incoming.faviconUrl?.trim() || undefined;
      }
      if (incoming.themeSwitchEnabled !== undefined) {
        nextHelpPage.themeSwitchEnabled = incoming.themeSwitchEnabled;
      }
      if (incoming.defaultTheme !== undefined) {
        nextHelpPage.defaultTheme = incoming.defaultTheme;
      }
      if (incoming.primaryColorLight !== undefined) {
        nextHelpPage.primaryColorLight = incoming.primaryColorLight;
      }
      if (incoming.primaryColorDark !== undefined) {
        nextHelpPage.primaryColorDark = incoming.primaryColorDark;
      }
      if (incoming.voiceToTextEnabled !== undefined) {
        nextHelpPage.voiceToTextEnabled = incoming.voiceToTextEnabled;
      }
      if (incoming.logoUrl !== undefined) {
        nextHelpPage.logoUrl = incoming.logoUrl?.trim() || undefined;
      }
      if (incoming.logoDarkUrl !== undefined) {
        nextHelpPage.logoDarkUrl = incoming.logoDarkUrl?.trim() || undefined;
      }
      if (incoming.heroUrl !== undefined) {
        nextHelpPage.heroUrl = incoming.heroUrl?.trim() || undefined;
      }
      if (incoming.heroDarkUrl !== undefined) {
        nextHelpPage.heroDarkUrl = incoming.heroDarkUrl?.trim() || undefined;
      }
      if (incoming.placeholder !== undefined) {
        nextHelpPage.placeholder = incoming.placeholder?.trim() || undefined;
      }
      if (incoming.navLinks !== undefined) {
        nextHelpPage.navLinks = incoming.navLinks.map((l) => ({
          label: l.label.trim(),
          href: l.href.trim(),
          variant: l.variant,
        }));
      }

      const nextConfig = {
        ...existingConfig,
        helpPage: nextHelpPage,
      } as Prisma.InputJsonValue;

      await prisma.agentChannel.upsert({
        where: {
          agentId_channel: { agentId, channel: "WEB_CHAT" },
        },
        create: {
          agentId,
          channel: "WEB_CHAT",
          enabled: true,
          config: nextConfig,
        },
        update: { config: nextConfig },
      });
    }

    revalidatePath(`/dashboard/agents/${agentId}`);
    revalidatePath(`/dashboard/agents/${agentId}/deploy/help-page`);
    revalidatePath(`/help/${agentId}`);

    const updated = await prisma.agent.findFirst({
      where: { id: agentId, orgId: dbOrgId },
      include: agentDetailInclude,
    });

    if (!updated) {
      return { success: false as const, error: "Agent not found" };
    }

    return { success: true as const, data: updated };
  } catch (err) {
    if (err instanceof z.ZodError) {
      return {
        success: false as const,
        error: err.issues[0]?.message ?? "Invalid input",
      };
    }
    return { success: false as const, error: "Failed to update help page settings" };
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
    const llmModel = resolveLlmModelId(validated.llmModel);
    if (!isKnownLlmModelId(llmModel)) {
      return { success: false as const, error: "Unknown LLM model" };
    }

    const updated = await prisma.agent.updateMany({
      where: { id: agentId, orgId: dbOrgId },
      data: {
        llmProvider: validated.llmProvider,
        llmModel,
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

/* ------------------------------------------------------------------ */
/*  Agent Actions — Archive / Duplicate / Delete                       */
/* ------------------------------------------------------------------ */

export async function archiveAgent(agentId: string) {
  try {
    const dbOrgId = await getOrgPrismaId();
    if (!dbOrgId) return { success: false as const, error: "Unauthorized" };

    const agent = await prisma.agent.findFirst({
      where: { id: agentId, orgId: dbOrgId },
      select: { status: true },
    });
    if (!agent) return { success: false as const, error: "Agent not found" };

    const newStatus = agent.status === "PAUSED" ? "ACTIVE" : "PAUSED";

    await prisma.agent.updateMany({
      where: { id: agentId, orgId: dbOrgId },
      data: { status: newStatus },
    });

    revalidatePath("/dashboard/agents");
    return { success: true as const, status: newStatus };
  } catch (err) {
    return { success: false as const, error: "Failed to update agent" };
  }
}

export async function duplicateAgent(agentId: string) {
  try {
    const dbOrgId = await getOrgPrismaId();
    if (!dbOrgId) return { success: false as const, error: "Unauthorized" };

    const original = await prisma.agent.findFirst({
      where: { id: agentId, orgId: dbOrgId },
      include: { languages: true, channels: true, voices: true, variables: true },
    });
    if (!original) return { success: false as const, error: "Agent not found" };

    const copy = await prisma.agent.create({
      data: {
        orgId: dbOrgId,
        name: `${original.name} (Copy)`,
        avatarUrl: original.avatarUrl,
        agentType: original.agentType,
        customRole: original.customRole,
        tone: original.tone,
        customTone: original.customTone,
        creativity: original.creativity,
        instructions: original.instructions,
        description: original.description,
        websiteUrl: original.websiteUrl,
        welcomeMessage: original.welcomeMessage,
        handoffEnabled: original.handoffEnabled,
        status: "DRAFT",
        visibility: original.visibility,
        defaultLanguage: original.defaultLanguage,
        llmProvider: original.llmProvider,
        llmModel: original.llmModel,
        widgetToken: crypto.randomUUID(),
        apiToken: crypto.randomUUID(),
        languages: {
          create: original.languages.map((l) => ({ language: l.language })),
        },
        channels: {
          create: original.channels.map((c) => ({
            channel: c.channel,
            enabled: c.enabled,
            config: c.config ?? undefined,
          })),
        },
        voices: {
          create: original.voices.map((v) => ({
            provider: v.provider,
            voiceId: v.voiceId,
            name: v.name,
            isPrimary: v.isPrimary,
          })),
        },
        variables: {
          create: original.variables.map((v) => ({
            key: v.key,
            value: v.value,
          })),
        },
      },
    });

    revalidatePath("/dashboard/agents");
    return { success: true as const, data: { id: copy.id } };
  } catch (err) {
    return { success: false as const, error: "Failed to duplicate agent" };
  }
}

export async function deleteAgent(agentId: string) {
  try {
    const dbOrgId = await getOrgPrismaId();
    if (!dbOrgId) return { success: false as const, error: "Unauthorized" };

    const agent = await prisma.agent.findFirst({
      where: { id: agentId, orgId: dbOrgId },
      select: { id: true },
    });
    if (!agent) return { success: false as const, error: "Agent not found" };

    await prisma.agent.delete({ where: { id: agentId } });

    revalidatePath("/dashboard/agents");
    return { success: true as const };
  } catch (err) {
    return { success: false as const, error: "Failed to delete agent" };
  }
}

export async function ensureAgentApiToken(agentId: string) {
  try {
    const dbOrgId = await getOrgPrismaId();
    if (!dbOrgId) return { success: false as const, error: "Unauthorized" };

    const agent = await prisma.agent.findFirst({
      where: { id: agentId, orgId: dbOrgId },
      select: { id: true, apiToken: true },
    });
    if (!agent) return { success: false as const, error: "Agent not found" };

    if (agent.apiToken) {
      return { success: true as const, data: { apiToken: agent.apiToken } };
    }

    const apiToken = crypto.randomUUID();
    await prisma.agent.update({
      where: { id: agentId },
      data: { apiToken },
    });

    revalidatePath(`/dashboard/agents/${agentId}/deploy/api`);
    return { success: true as const, data: { apiToken } };
  } catch {
    return { success: false as const, error: "Failed to ensure API token" };
  }
}

export async function regenerateAgentApiToken(agentId: string) {
  try {
    const dbOrgId = await getOrgPrismaId();
    if (!dbOrgId) return { success: false as const, error: "Unauthorized" };

    const agent = await prisma.agent.findFirst({
      where: { id: agentId, orgId: dbOrgId },
      select: { id: true },
    });
    if (!agent) return { success: false as const, error: "Agent not found" };

    const apiToken = crypto.randomUUID();
    await prisma.agent.update({
      where: { id: agentId },
      data: { apiToken },
    });

    revalidatePath(`/dashboard/agents/${agentId}/deploy/api`);
    return { success: true as const, data: { apiToken } };
  } catch {
    return { success: false as const, error: "Failed to regenerate API token" };
  }
}
