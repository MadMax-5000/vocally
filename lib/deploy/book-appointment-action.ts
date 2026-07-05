import type { AgentChannel } from "@prisma/client";

import {
  getWebChatChannel,
  parseWebChatConfig,
} from "@/lib/deploy/web-chat-config";

export const DEFAULT_APPOINTMENT_DEPARTMENTS = [
  "support",
  "sales",
  "billing",
  "technical",
  "general",
] as const;

export type BookAppointmentWhenToOffer = "proactive" | "intent_only";

export type BookAppointmentActionConfig = {
  enabled?: boolean;
  departments?: string[];
  whenToOffer?: BookAppointmentWhenToOffer;
  notifyEmail?: string;
};

export type ResolvedBookAppointmentAction = {
  enabled: boolean;
  departments: string[];
  whenToOffer: BookAppointmentWhenToOffer;
  notifyEmail: string | null;
};

function parseDepartments(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const items = value
    .filter((v): v is string => typeof v === "string")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return items.length > 0 ? Array.from(new Set(items)) : undefined;
}

export function parseBookAppointmentActionConfig(
  value: unknown,
): BookAppointmentActionConfig {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  const raw = value as Record<string, unknown>;
  const result: BookAppointmentActionConfig = {};

  if (typeof raw.enabled === "boolean") {
    result.enabled = raw.enabled;
  }
  const departments = parseDepartments(raw.departments);
  if (departments) {
    result.departments = departments;
  }
  if (raw.whenToOffer === "proactive" || raw.whenToOffer === "intent_only") {
    result.whenToOffer = raw.whenToOffer;
  }
  if (typeof raw.notifyEmail === "string") {
    const trimmed = raw.notifyEmail.trim();
    if (trimmed) result.notifyEmail = trimmed;
  }

  return result;
}

export function resolveBookAppointmentAction(
  channels: Pick<AgentChannel, "channel" | "enabled" | "config">[],
): ResolvedBookAppointmentAction {
  const row = getWebChatChannel(channels);
  const parsed = row ? parseWebChatConfig(row.config) : {};
  const action = parsed.actions?.bookAppointment ?? {};

  return {
    enabled: action.enabled ?? false,
    departments: action.departments ?? [...DEFAULT_APPOINTMENT_DEPARTMENTS],
    whenToOffer: action.whenToOffer ?? "intent_only",
    notifyEmail: action.notifyEmail ?? null,
  };
}

export function normalizeDepartment(value: string): string {
  return value.trim().toLowerCase();
}

export function isDepartmentAllowed(
  action: ResolvedBookAppointmentAction,
  department: string,
): boolean {
  const normalized = normalizeDepartment(department);
  return action.departments.some((d) => normalizeDepartment(d) === normalized);
}
