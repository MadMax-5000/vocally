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

export const DEFAULT_HEALTHCARE_APPOINTMENT_DEPARTMENTS = [
  "general",
  "cardiologie",
  "pediatrie",
  "gynecologie",
  "dermatologie",
  "radiologie",
  "urgences",
] as const;

export const DEFAULT_APPOINTMENT_TIMEZONE = "Africa/Casablanca";
export const DEFAULT_DURATION_MINUTES = 30;
export const DEFAULT_SLOT_INTERVAL_MINUTES = 30;
export const DEFAULT_MAX_DAYS_AHEAD = 14;

export const DEFAULT_WORKING_HOURS: WorkingHoursConfig = {
  days: [1, 2, 3, 4, 5],
  start: "09:00",
  end: "18:00",
};

export type BookAppointmentWhenToOffer = "proactive" | "intent_only";
export type BookAppointmentCalendarProvider = "none" | "google" | "calendly";

export type WorkingHoursConfig = {
  days: number[];
  start: string;
  end: string;
};

export type BookAppointmentActionConfig = {
  enabled?: boolean;
  departments?: string[];
  whenToOffer?: BookAppointmentWhenToOffer;
  notifyEmail?: string;
  calendarProvider?: BookAppointmentCalendarProvider;
  timezone?: string;
  durationMinutes?: number;
  slotIntervalMinutes?: number;
  workingHours?: WorkingHoursConfig;
  maxDaysAhead?: number;
  eventTypeUri?: string;
};

export type ResolvedBookAppointmentAction = {
  enabled: boolean;
  departments: string[];
  whenToOffer: BookAppointmentWhenToOffer;
  notifyEmail: string | null;
  calendarProvider: BookAppointmentCalendarProvider;
  timezone: string;
  durationMinutes: number;
  slotIntervalMinutes: number;
  workingHours: WorkingHoursConfig;
  maxDaysAhead: number;
  eventTypeUri: string | null;
};

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function parseDepartments(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const items = value
    .filter((v): v is string => typeof v === "string")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return items.length > 0 ? Array.from(new Set(items)) : undefined;
}

export function isValidTimeZone(tz: string): boolean {
  try {
    Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export function parseWorkingHours(value: unknown): WorkingHoursConfig | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const raw = value as Record<string, unknown>;
  if (typeof raw.start !== "string" || typeof raw.end !== "string") return undefined;
  if (!TIME_RE.test(raw.start) || !TIME_RE.test(raw.end)) return undefined;
  if (!Array.isArray(raw.days)) return undefined;
  const days = raw.days.filter(
    (d): d is number => typeof d === "number" && Number.isInteger(d) && d >= 0 && d <= 6,
  );
  if (days.length === 0) return undefined;
  if (raw.start >= raw.end) return undefined;
  return {
    days: Array.from(new Set(days)).sort((a, b) => a - b),
    start: raw.start,
    end: raw.end,
  };
}

function parsePositiveInt(value: unknown, min: number, max: number): number | undefined {
  if (typeof value !== "number" || !Number.isInteger(value)) return undefined;
  if (value < min || value > max) return undefined;
  return value;
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
  if (
    raw.calendarProvider === "none" ||
    raw.calendarProvider === "google" ||
    raw.calendarProvider === "calendly"
  ) {
    result.calendarProvider = raw.calendarProvider;
  }
  if (typeof raw.timezone === "string" && isValidTimeZone(raw.timezone.trim())) {
    result.timezone = raw.timezone.trim();
  }
  const durationMinutes = parsePositiveInt(raw.durationMinutes, 5, 240);
  if (durationMinutes !== undefined) result.durationMinutes = durationMinutes;
  const slotIntervalMinutes = parsePositiveInt(raw.slotIntervalMinutes, 5, 120);
  if (slotIntervalMinutes !== undefined) result.slotIntervalMinutes = slotIntervalMinutes;
  const maxDaysAhead = parsePositiveInt(raw.maxDaysAhead, 1, 31);
  if (maxDaysAhead !== undefined) result.maxDaysAhead = maxDaysAhead;
  const workingHours = parseWorkingHours(raw.workingHours);
  if (workingHours) result.workingHours = workingHours;
  if (typeof raw.eventTypeUri === "string") {
    const trimmed = raw.eventTypeUri.trim();
    if (trimmed) result.eventTypeUri = trimmed;
  }

  return result;
}

export type ResolveBookAppointmentOptions = {
  agentType?: string | null;
};

function defaultDepartmentsForAgentType(agentType?: string | null): string[] {
  if (agentType === "HEALTHCARE_MEDICAL") {
    return [...DEFAULT_HEALTHCARE_APPOINTMENT_DEPARTMENTS];
  }
  return [...DEFAULT_APPOINTMENT_DEPARTMENTS];
}

export function resolveBookAppointmentAction(
  channels: Pick<AgentChannel, "channel" | "enabled" | "config">[],
  options?: ResolveBookAppointmentOptions,
): ResolvedBookAppointmentAction {
  const row = getWebChatChannel(channels);
  const parsed = row ? parseWebChatConfig(row.config) : {};
  const action = parsed.actions?.bookAppointment ?? {};

  return {
    enabled: action.enabled ?? false,
    departments: action.departments ?? defaultDepartmentsForAgentType(options?.agentType),
    whenToOffer: action.whenToOffer ?? "intent_only",
    notifyEmail: action.notifyEmail ?? null,
    calendarProvider: action.calendarProvider ?? "none",
    timezone: action.timezone ?? DEFAULT_APPOINTMENT_TIMEZONE,
    durationMinutes: action.durationMinutes ?? DEFAULT_DURATION_MINUTES,
    slotIntervalMinutes: action.slotIntervalMinutes ?? DEFAULT_SLOT_INTERVAL_MINUTES,
    workingHours: action.workingHours ?? { ...DEFAULT_WORKING_HOURS },
    maxDaysAhead: action.maxDaysAhead ?? DEFAULT_MAX_DAYS_AHEAD,
    eventTypeUri: action.eventTypeUri ?? null,
  };
}

export function normalizeDepartment(value: string): string {
  return value.trim().toLowerCase();
}

export function isDepartmentAllowed(
  action: ResolvedBookAppointmentAction,
  department: string,
): boolean {
  return resolveDepartmentMatch(action, department) !== null;
}

const FUZZY_DEPARTMENT_MIN_LENGTH = 3;

export function resolveDepartmentMatch(
  action: Pick<ResolvedBookAppointmentAction, "departments">,
  input: string,
): string | null {
  const normalized = normalizeDepartment(input);
  if (!normalized) return null;

  const exact = action.departments.find((d) => normalizeDepartment(d) === normalized);
  if (exact) return normalizeDepartment(exact);

  if (normalized.length < FUZZY_DEPARTMENT_MIN_LENGTH) return null;

  const scored = action.departments
    .map((d) => {
      const nd = normalizeDepartment(d);
      let score = 0;
      if (nd.startsWith(normalized) || normalized.startsWith(nd)) score = 2;
      else if (nd.includes(normalized) || normalized.includes(nd)) score = 1;
      return { nd, score };
    })
    .filter((row) => row.score > 0);

  if (scored.length === 0) return null;

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (
      Math.abs(a.nd.length - normalized.length) -
      Math.abs(b.nd.length - normalized.length)
    );
  });

  return scored[0]?.nd ?? null;
}

export function isExternalCalendarConfigured(
  action: Pick<ResolvedBookAppointmentAction, "calendarProvider" | "eventTypeUri">,
): boolean {
  if (action.calendarProvider === "google") return true;
  if (action.calendarProvider === "calendly") return Boolean(action.eventTypeUri);
  return false;
}
