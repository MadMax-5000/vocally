import { z } from "zod";
import type { Channel } from "@prisma/client";

import {
  getRequiredLeadFields,
  LEAD_FIELD_KEYS,
  type LeadFieldKey,
  type ResolvedCollectLeadsAction,
} from "@/lib/deploy/collect-leads-action";
import { prisma } from "@/lib/db/prisma";
import { sendEmail } from "@/lib/email/send";
import { logServerWarning } from "@/lib/logger";
import type { ToolContext } from "@/lib/ai/tools/types";

const saveLeadArgsSchema = z.object({
  name: z.string().max(200).optional(),
  email: z.string().max(320).optional(),
  phone: z.string().max(50).optional(),
  company: z.string().max(200).optional(),
  notes: z.string().max(4000).optional(),
});

function trimOrNull(value: string | undefined): string | null {
  if (value === undefined) return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function mergeLeadField(
  current: string | null | undefined,
  incoming: string | null,
): string | null | undefined {
  if (incoming === null) return current;
  return incoming;
}

function computeMissingRequired(
  action: ResolvedCollectLeadsAction,
  lead: Record<LeadFieldKey, string | null | undefined>,
): LeadFieldKey[] {
  return getRequiredLeadFields(action).filter((key) => {
    const val = lead[key];
    return !val || !String(val).trim();
  });
}

async function resolveSourceChannel(
  ctx: ToolContext,
): Promise<Channel> {
  if (ctx.channel) return ctx.channel;
  const session = await prisma.session.findFirst({
    where: { id: ctx.sessionId, orgId: ctx.orgId },
    select: { channel: true },
  });
  return session?.channel ?? "CHAT";
}

async function maybeNotifyNewLead(input: {
  notifyEmail: string;
  agentName: string;
  leadId: string;
  savedFields: LeadFieldKey[];
}): Promise<void> {
  if (!process.env.RESEND_API_KEY) return;
  try {
    await sendEmail({
      to: input.notifyEmail,
      subject: `New lead for ${input.agentName}`,
      body: [
        `A new lead was captured for agent "${input.agentName}".`,
        `Lead ID: ${input.leadId}`,
        `Fields provided: ${input.savedFields.join(", ") || "none yet"}`,
      ].join("\n"),
    });
  } catch {
    logServerWarning("collect_leads_notify_email_failed", {
      leadId: input.leadId,
      agentNameLength: input.agentName.length,
    });
  }
}

export async function handleSaveLead(
  args: Record<string, unknown>,
  ctx: ToolContext,
): Promise<string> {
  const action = ctx.collectLeads;
  if (!action?.enabled) {
    return JSON.stringify({ error: "Lead collection is not enabled for this agent" });
  }
  if (!ctx.agentId) {
    return JSON.stringify({ error: "Agent context is required" });
  }

  const parsed = saveLeadArgsSchema.safeParse(args);
  if (!parsed.success) {
    return JSON.stringify({
      error: "Invalid lead data",
      details: parsed.error.issues[0]?.message,
    });
  }

  const incoming: Partial<Record<LeadFieldKey, string | null>> = {};
  for (const key of LEAD_FIELD_KEYS) {
    if (parsed.data[key] !== undefined) {
      if (action.fields[key] === "off") {
        return JSON.stringify({ error: `Field "${key}" is not collected for this agent` });
      }
      incoming[key] = trimOrNull(parsed.data[key]);
    }
  }

  if (Object.keys(incoming).length === 0) {
    return JSON.stringify({ error: "Provide at least one lead field to save" });
  }

  const source = await resolveSourceChannel(ctx);

  const existing = await prisma.agentLead.findUnique({
    where: {
      agentId_sessionId: {
        agentId: ctx.agentId,
        sessionId: ctx.sessionId,
      },
    },
  });

  const merged: Record<LeadFieldKey, string | null> = {
    name: existing?.name ?? null,
    email: existing?.email ?? null,
    phone: existing?.phone ?? null,
    company: existing?.company ?? null,
    notes: existing?.notes ?? null,
  };

  const savedFields: LeadFieldKey[] = [];
  for (const key of LEAD_FIELD_KEYS) {
    if (incoming[key] !== undefined) {
      const next = mergeLeadField(merged[key], incoming[key] ?? null);
      if (next !== undefined && next !== merged[key]) {
        savedFields.push(key);
      }
      if (next !== undefined) merged[key] = next as string | null;
    }
  }

  const missingRequired = computeMissingRequired(action, merged);
  const isComplete = missingRequired.length === 0;

  const lead = await prisma.agentLead.upsert({
    where: {
      agentId_sessionId: {
        agentId: ctx.agentId,
        sessionId: ctx.sessionId,
      },
    },
    create: {
      orgId: ctx.orgId,
      agentId: ctx.agentId,
      sessionId: ctx.sessionId,
      name: merged.name,
      email: merged.email,
      phone: merged.phone,
      company: merged.company,
      notes: merged.notes,
      source,
    },
    update: {
      name: merged.name,
      email: merged.email,
      phone: merged.phone,
      company: merged.company,
      notes: merged.notes,
      source,
    },
  });

  if (!existing && action.notifyEmail) {
    const agent = await prisma.agent.findFirst({
      where: { id: ctx.agentId, orgId: ctx.orgId },
      select: { name: true },
    });
    void maybeNotifyNewLead({
      notifyEmail: action.notifyEmail,
      agentName: agent?.name ?? "Agent",
      leadId: lead.id,
      savedFields,
    });
  }

  return JSON.stringify({
    success: true,
    leadId: lead.id,
    savedFields,
    missingRequired,
    complete: isComplete,
    message: isComplete
      ? "Lead saved with all required fields."
      : `Lead saved. Still need: ${missingRequired.join(", ")}`,
  });
}
