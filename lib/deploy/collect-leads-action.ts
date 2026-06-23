import type { AgentChannel } from "@prisma/client";

import {
  getWebChatChannel,
  parseWebChatConfig,
} from "@/lib/deploy/web-chat-config";

export const LEAD_FIELD_KEYS = [
  "name",
  "email",
  "phone",
  "company",
  "notes",
] as const;

export type LeadFieldKey = (typeof LEAD_FIELD_KEYS)[number];

export type LeadFieldRequirement = "required" | "optional" | "off";

export type CollectLeadsWhenToAsk = "proactive" | "intent_only";

export type CollectLeadsFieldsConfig = Partial<
  Record<LeadFieldKey, LeadFieldRequirement>
>;

export type CollectLeadsActionConfig = {
  enabled?: boolean;
  whenToAsk?: CollectLeadsWhenToAsk;
  fields?: CollectLeadsFieldsConfig;
  consentText?: string;
  notifyEmail?: string;
};

export type ResolvedCollectLeadsAction = {
  enabled: boolean;
  whenToAsk: CollectLeadsWhenToAsk;
  fields: Record<LeadFieldKey, LeadFieldRequirement>;
  consentText: string;
  notifyEmail: string | null;
};

const DEFAULT_FIELDS: Record<LeadFieldKey, LeadFieldRequirement> = {
  name: "optional",
  email: "required",
  phone: "optional",
  company: "off",
  notes: "off",
};

const DEFAULT_CONSENT =
  "We may use your contact details to follow up about your request. You can ask us to stop at any time.";

function parseFieldRequirement(value: unknown): LeadFieldRequirement | undefined {
  if (value === "required" || value === "optional" || value === "off") {
    return value;
  }
  return undefined;
}

export function parseCollectLeadsActionConfig(
  value: unknown,
): CollectLeadsActionConfig {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  const raw = value as Record<string, unknown>;
  const result: CollectLeadsActionConfig = {};

  if (typeof raw.enabled === "boolean") {
    result.enabled = raw.enabled;
  }
  if (raw.whenToAsk === "proactive" || raw.whenToAsk === "intent_only") {
    result.whenToAsk = raw.whenToAsk;
  }
  if (raw.fields && typeof raw.fields === "object" && !Array.isArray(raw.fields)) {
    const fieldsRaw = raw.fields as Record<string, unknown>;
    const fields: CollectLeadsFieldsConfig = {};
    for (const key of LEAD_FIELD_KEYS) {
      const req = parseFieldRequirement(fieldsRaw[key]);
      if (req) fields[key] = req;
    }
    if (Object.keys(fields).length > 0) {
      result.fields = fields;
    }
  }
  if (typeof raw.consentText === "string") {
    const trimmed = raw.consentText.trim();
    if (trimmed) result.consentText = trimmed;
  }
  if (typeof raw.notifyEmail === "string") {
    const trimmed = raw.notifyEmail.trim();
    if (trimmed) result.notifyEmail = trimmed;
  }

  return result;
}

export function resolveCollectLeadsAction(
  channels: Pick<AgentChannel, "channel" | "enabled" | "config">[],
): ResolvedCollectLeadsAction {
  const row = getWebChatChannel(channels);
  const parsed = row ? parseWebChatConfig(row.config) : {};
  const action = parsed.actions?.collectLeads ?? {};

  const fields = { ...DEFAULT_FIELDS };
  if (action.fields) {
    for (const key of LEAD_FIELD_KEYS) {
      const req = action.fields[key];
      if (req) fields[key] = req;
    }
  }

  return {
    enabled: action.enabled ?? false,
    whenToAsk: action.whenToAsk ?? "intent_only",
    fields,
    consentText: action.consentText ?? DEFAULT_CONSENT,
    notifyEmail: action.notifyEmail ?? null,
  };
}

export function getRequiredLeadFields(
  action: ResolvedCollectLeadsAction,
): LeadFieldKey[] {
  return LEAD_FIELD_KEYS.filter((k) => action.fields[k] === "required");
}

export function getOptionalLeadFields(
  action: ResolvedCollectLeadsAction,
): LeadFieldKey[] {
  return LEAD_FIELD_KEYS.filter((k) => action.fields[k] === "optional");
}

export function getActiveLeadFields(
  action: ResolvedCollectLeadsAction,
): LeadFieldKey[] {
  return LEAD_FIELD_KEYS.filter((k) => action.fields[k] !== "off");
}
