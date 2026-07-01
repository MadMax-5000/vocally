import type { Channel } from "@prisma/client";

import type { CustomFormField } from "@/lib/deploy/custom-form-action";
import { parseCustomFormActionConfig } from "@/lib/deploy/custom-form-action";
import { parseWebChatConfig } from "@/lib/deploy/web-chat-config";
import { prisma } from "@/lib/db/prisma";

export type LeadCaptureType = "collect_leads" | "custom_form";

export type OrgLeadRow = {
  id: string;
  captureType: LeadCaptureType;
  agentId: string;
  agentName: string;
  sessionId: string | null;
  channel: Channel | null;
  label: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  notes: string | null;
  formTitle: string | null;
  createdAt: string;
  detail?: Record<string, string>;
};

export type ListOrgLeadsFilters = {
  agentId?: string;
  captureType?: LeadCaptureType;
  limit?: number;
  offset?: number;
};

function formatCollectLeadLabel(lead: {
  name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
}): string {
  if (lead.name?.trim()) return lead.name.trim();
  if (lead.email?.trim()) return lead.email.trim();
  if (lead.phone?.trim()) return lead.phone.trim();
  if (lead.company?.trim()) return lead.company.trim();
  return "Unknown";
}

function extractFormContact(
  values: Record<string, string>,
  fields: CustomFormField[],
): { label: string; email: string | null; phone: string | null; name: string | null } {
  let email: string | null = null;
  let phone: string | null = null;
  let name: string | null = null;

  for (const field of fields) {
    const val = values[field.id]?.trim();
    if (!val) continue;
    if (field.type === "email" && !email) email = val;
    if (field.type === "phone" && !phone) phone = val;
    if (field.type === "text" && !name && /name/i.test(field.label)) name = val;
  }

  const firstValue = Object.values(values).find((v) => v?.trim())?.trim() ?? null;
  const label = name ?? email ?? phone ?? firstValue ?? "Unknown";
  return { label, email, phone, name };
}

function mapFormValuesToLabels(
  values: Record<string, string>,
  fields: CustomFormField[],
): Record<string, string> {
  const detail: Record<string, string> = {};
  for (const field of fields) {
    const val = values[field.id]?.trim();
    if (val) detail[field.label] = val;
  }
  if (Object.keys(detail).length === 0) {
    for (const [key, value] of Object.entries(values)) {
      if (value?.trim()) detail[key] = value.trim();
    }
  }
  return detail;
}

type AgentFormConfig = {
  fields: CustomFormField[];
  title: string;
};

function buildAgentFormConfigMap(
  agents: {
    id: string;
    channels: { config: unknown }[];
  }[],
): Map<string, AgentFormConfig> {
  const map = new Map<string, AgentFormConfig>();
  for (const agent of agents) {
    const row = agent.channels[0];
    const parsed = row
      ? parseWebChatConfig(
          row.config && typeof row.config === "object" && !Array.isArray(row.config)
            ? (row.config as Record<string, unknown>)
            : {},
        )
      : {};
    const formAction = parseCustomFormActionConfig(parsed.actions?.customForm);
    map.set(agent.id, {
      fields: formAction.fields ?? [],
      title: formAction.title?.trim() || "Contact form",
    });
  }
  return map;
}

export async function listOrgLeadsFromDb(
  orgId: string,
  filters: ListOrgLeadsFilters = {},
): Promise<{ rows: OrgLeadRow[]; total: number }> {
  const limit = Math.min(filters.limit ?? 50, 100);
  const offset = Math.max(filters.offset ?? 0, 0);
  const fetchSize = limit + offset;
  const agentWhere = filters.agentId ? { agentId: filters.agentId } : {};

  const shouldFetchCollect =
    !filters.captureType || filters.captureType === "collect_leads";
  const shouldFetchForm =
    !filters.captureType || filters.captureType === "custom_form";

  const [agentLeads, formSubmissions, agents, collectTotal, formTotal] =
    await Promise.all([
      shouldFetchCollect
        ? prisma.agentLead.findMany({
            where: { orgId, ...agentWhere },
            orderBy: { createdAt: "desc" },
            take: fetchSize,
            include: { agent: { select: { name: true } } },
          })
        : Promise.resolve([]),
      shouldFetchForm
        ? prisma.formSubmission.findMany({
            where: { orgId, ...agentWhere },
            orderBy: { createdAt: "desc" },
            take: fetchSize,
            include: { agent: { select: { name: true } } },
          })
        : Promise.resolve([]),
      prisma.agent.findMany({
        where: { orgId },
        select: {
          id: true,
          channels: { where: { channel: "WEB_CHAT" }, select: { config: true } },
        },
      }),
      shouldFetchCollect
        ? prisma.agentLead.count({ where: { orgId, ...agentWhere } })
        : Promise.resolve(0),
      shouldFetchForm
        ? prisma.formSubmission.count({ where: { orgId, ...agentWhere } })
        : Promise.resolve(0),
    ]);

  const agentFormConfig = buildAgentFormConfigMap(agents);
  const rows: OrgLeadRow[] = [];

  for (const lead of agentLeads) {
    rows.push({
      id: lead.id,
      captureType: "collect_leads",
      agentId: lead.agentId,
      agentName: lead.agent.name,
      sessionId: lead.sessionId,
      channel: lead.source,
      label: formatCollectLeadLabel(lead),
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      company: lead.company,
      notes: lead.notes,
      formTitle: null,
      createdAt: lead.createdAt.toISOString(),
    });
  }

  for (const sub of formSubmissions) {
    const values =
      sub.values &&
      typeof sub.values === "object" &&
      !Array.isArray(sub.values)
        ? (sub.values as Record<string, string>)
        : {};
    const config = agentFormConfig.get(sub.agentId) ?? {
      fields: [],
      title: "Contact form",
    };
    const contact = extractFormContact(values, config.fields);
    rows.push({
      id: sub.id,
      captureType: "custom_form",
      agentId: sub.agentId,
      agentName: sub.agent.name,
      sessionId: sub.sessionId,
      channel: null,
      label: contact.label,
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      company: null,
      notes: null,
      formTitle: config.title,
      createdAt: sub.createdAt.toISOString(),
      detail: mapFormValuesToLabels(values, config.fields),
    });
  }

  rows.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return {
    rows: rows.slice(offset, offset + limit),
    total: collectTotal + formTotal,
  };
}
