import type { AgentChannel } from "@prisma/client";

import { buildChatFormUi, type ChatFormUi } from "@/lib/chat/form-ui";
import {
  getWebChatChannel,
  parseWebChatConfig,
} from "@/lib/deploy/web-chat-config";

export const MAX_FORM_FIELDS = 12;
export const MAX_FORM_TITLE = 120;
export const MAX_FORM_DESCRIPTION = 500;
export const MAX_FORM_SUBMIT_LABEL = 40;
export const MAX_FORM_FIELD_LABEL = 80;
export const MAX_FORM_FIELD_PLACEHOLDER = 120;
export const MAX_FORM_FIELD_VALUE = 2000;
export const MAX_SELECT_OPTIONS = 20;
export const MAX_SELECT_OPTION_LENGTH = 80;
export const DEFAULT_SUBMIT_LABEL = "Submit";
export const DEFAULT_FORM_TITLE = "Contact form";

export const CUSTOM_FORM_FIELD_TYPES = [
  "text",
  "email",
  "phone",
  "textarea",
  "select",
] as const;

export type CustomFormFieldType = (typeof CUSTOM_FORM_FIELD_TYPES)[number];

export type CustomFormField = {
  id: string;
  type: CustomFormFieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
};

export type CustomFormActionConfig = {
  enabled?: boolean;
  formId?: string;
  title?: string;
  description?: string;
  submitLabel?: string;
  fields?: CustomFormField[];
  showAfterUserMessages?: number | null;
  allowLlmTrigger?: boolean;
  notifyEmail?: string;
};

export type ResolvedCustomFormAction = {
  enabled: boolean;
  formId: string;
  title: string;
  description: string;
  submitLabel: string;
  fields: CustomFormField[];
  showAfterUserMessages: number | null;
  allowLlmTrigger: boolean;
  notifyEmail: string | null;
};

function parseFieldType(value: unknown): CustomFormFieldType | undefined {
  if (
    typeof value === "string" &&
    (CUSTOM_FORM_FIELD_TYPES as readonly string[]).includes(value)
  ) {
    return value as CustomFormFieldType;
  }
  return undefined;
}

function parseFieldId(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 64) return undefined;
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) return undefined;
  return trimmed;
}

function parseSelectOptions(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const options: string[] = [];
  for (const item of value.slice(0, MAX_SELECT_OPTIONS)) {
    if (typeof item !== "string") continue;
    const trimmed = item.trim();
    if (!trimmed) continue;
    options.push(trimmed.slice(0, MAX_SELECT_OPTION_LENGTH));
  }
  return options.length > 0 ? options : undefined;
}

function parseFormField(value: unknown): CustomFormField | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }
  const raw = value as Record<string, unknown>;
  const id = parseFieldId(raw.id);
  const type = parseFieldType(raw.type);
  const label = typeof raw.label === "string" ? raw.label.trim() : "";
  if (!id || !type || !label) return undefined;

  const required = raw.required === true;
  const placeholder =
    typeof raw.placeholder === "string"
      ? raw.placeholder.trim().slice(0, MAX_FORM_FIELD_PLACEHOLDER) || undefined
      : undefined;

  if (type === "select") {
    const options = parseSelectOptions(raw.options);
    if (!options) return undefined;
    return {
      id,
      type,
      label: label.slice(0, MAX_FORM_FIELD_LABEL),
      required,
      options,
      ...(placeholder ? { placeholder } : {}),
    };
  }

  return {
    id,
    type,
    label: label.slice(0, MAX_FORM_FIELD_LABEL),
    required,
    ...(placeholder ? { placeholder } : {}),
  };
}

function parseShowAfterUserMessages(value: unknown): number | null | undefined {
  if (value === null) return null;
  if (typeof value !== "number" || !Number.isInteger(value)) return undefined;
  if (value < 1 || value > 100) return undefined;
  return value;
}

export function parseCustomFormActionConfig(
  value: unknown,
): CustomFormActionConfig {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  const raw = value as Record<string, unknown>;
  const result: CustomFormActionConfig = {};

  if (typeof raw.enabled === "boolean") {
    result.enabled = raw.enabled;
  }
  if (typeof raw.formId === "string" && raw.formId.trim()) {
    result.formId = raw.formId.trim().slice(0, 64);
  }
  if (typeof raw.title === "string") {
    result.title = raw.title.trim().slice(0, MAX_FORM_TITLE) || undefined;
  }
  if (typeof raw.description === "string") {
    const desc = raw.description.trim();
    result.description = desc
      ? desc.slice(0, MAX_FORM_DESCRIPTION)
      : undefined;
  }
  if (typeof raw.submitLabel === "string") {
    const label = raw.submitLabel.trim();
    result.submitLabel = label
      ? label.slice(0, MAX_FORM_SUBMIT_LABEL)
      : undefined;
  }
  if (Array.isArray(raw.fields)) {
    const fields: CustomFormField[] = [];
    for (const item of raw.fields.slice(0, MAX_FORM_FIELDS)) {
      const parsed = parseFormField(item);
      if (parsed) fields.push(parsed);
    }
    if (fields.length > 0) {
      result.fields = fields;
    }
  }
  const showAfter = parseShowAfterUserMessages(raw.showAfterUserMessages);
  if (showAfter !== undefined) {
    result.showAfterUserMessages = showAfter;
  }
  if (typeof raw.allowLlmTrigger === "boolean") {
    result.allowLlmTrigger = raw.allowLlmTrigger;
  }
  if (typeof raw.notifyEmail === "string") {
    const email = raw.notifyEmail.trim();
    result.notifyEmail = email || undefined;
  }

  return result;
}

export function resolveCustomFormAction(
  channels: Pick<AgentChannel, "channel" | "enabled" | "config">[],
): ResolvedCustomFormAction {
  const row = getWebChatChannel(channels);
  const parsed = row ? parseWebChatConfig(row.config) : {};
  const action = parsed.actions?.customForm ?? {};

  return {
    enabled: action.enabled ?? false,
    formId: action.formId ?? "",
    title: action.title?.trim() || DEFAULT_FORM_TITLE,
    description: action.description?.trim() ?? "",
    submitLabel: action.submitLabel?.trim() || DEFAULT_SUBMIT_LABEL,
    fields: action.fields ?? [],
    showAfterUserMessages:
      action.showAfterUserMessages === undefined
        ? null
        : action.showAfterUserMessages,
    allowLlmTrigger: action.allowLlmTrigger ?? true,
    notifyEmail: action.notifyEmail?.trim() || null,
  };
}

export function isCustomFormConfigured(action: ResolvedCustomFormAction): boolean {
  return Boolean(action.formId && action.fields.length > 0);
}

export function buildFormUiPayload(
  action: ResolvedCustomFormAction,
): ChatFormUi | null {
  if (!action.enabled || !isCustomFormConfigured(action)) {
    return null;
  }
  return buildChatFormUi({
    formId: action.formId,
    title: action.title,
    description: action.description || undefined,
    submitLabel: action.submitLabel,
    fields: action.fields,
  });
}

export function formatFormSubmissionSummary(
  action: ResolvedCustomFormAction,
  values: Record<string, string>,
): string {
  const lines = action.fields
    .map((field) => {
      const val = values[field.id]?.trim();
      if (!val) return null;
      return `- ${field.label}: ${val}`;
    })
    .filter((line): line is string => Boolean(line));

  const header = `Form submitted (${action.title}):`;
  if (lines.length === 0) {
    return `${header}\n(no field values)`;
  }
  return `${header}\n${lines.join("\n")}`;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+]?[\d\s().-]{6,30}$/;

export function validateFormValues(
  action: ResolvedCustomFormAction,
  values: Record<string, string>,
): { ok: true; values: Record<string, string> } | { ok: false; error: string } {
  if (!isCustomFormConfigured(action)) {
    return { ok: false, error: "Form is not configured" };
  }

  const normalized: Record<string, string> = {};

  for (const field of action.fields) {
    const raw = values[field.id];
    const trimmed = typeof raw === "string" ? raw.trim() : "";

    if (!trimmed) {
      if (field.required) {
        return { ok: false, error: `${field.label} is required` };
      }
      continue;
    }

    if (trimmed.length > MAX_FORM_FIELD_VALUE) {
      return { ok: false, error: `${field.label} is too long` };
    }

    if (field.type === "email" && !EMAIL_RE.test(trimmed)) {
      return { ok: false, error: `${field.label} must be a valid email` };
    }

    if (field.type === "phone" && !PHONE_RE.test(trimmed)) {
      return { ok: false, error: `${field.label} must be a valid phone number` };
    }

    if (field.type === "select") {
      const options = field.options ?? [];
      if (!options.includes(trimmed)) {
        return { ok: false, error: `${field.label} has an invalid selection` };
      }
    }

    normalized[field.id] = trimmed;
  }

  return { ok: true, values: normalized };
}
