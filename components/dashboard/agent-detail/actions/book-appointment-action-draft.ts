import type { AgentDetailWithRelations } from "@/components/dashboard/agent-detail/agent-detail-types";
import {
  DEFAULT_APPOINTMENT_TIMEZONE,
  DEFAULT_DURATION_MINUTES,
  DEFAULT_SLOT_INTERVAL_MINUTES,
  DEFAULT_WORKING_HOURS,
  isValidTimeZone,
  resolveBookAppointmentAction,
  type BookAppointmentCalendarProvider,
  type BookAppointmentWhenToOffer,
  type WorkingHoursConfig,
} from "@/lib/deploy/book-appointment-action";

export type BookAppointmentActionDraft = {
  enabled: boolean;
  whenToOffer: BookAppointmentWhenToOffer;
  departments: string[];
  notifyEmail: string;
  calendarProvider: BookAppointmentCalendarProvider;
  timezone: string;
  durationMinutes: number;
  slotIntervalMinutes: number;
  workingHours: WorkingHoursConfig;
  eventTypeUri: string;
};

export function buildBookAppointmentActionDraft(
  agent: AgentDetailWithRelations,
): BookAppointmentActionDraft {
  const resolved = resolveBookAppointmentAction(agent.channels);
  const connection = agent.calendarConnection;
  let calendarProvider: BookAppointmentCalendarProvider = resolved.calendarProvider;
  if (connection?.provider === "GOOGLE") calendarProvider = "google";
  if (connection?.provider === "CALENDLY") calendarProvider = "calendly";

  return {
    enabled: resolved.enabled,
    whenToOffer: resolved.whenToOffer,
    departments: [...resolved.departments],
    notifyEmail: resolved.notifyEmail ?? "",
    calendarProvider,
    timezone: resolved.timezone || DEFAULT_APPOINTMENT_TIMEZONE,
    durationMinutes: resolved.durationMinutes || DEFAULT_DURATION_MINUTES,
    slotIntervalMinutes: resolved.slotIntervalMinutes || DEFAULT_SLOT_INTERVAL_MINUTES,
    workingHours: {
      days: [...(resolved.workingHours.days.length ? resolved.workingHours.days : DEFAULT_WORKING_HOURS.days)],
      start: resolved.workingHours.start || DEFAULT_WORKING_HOURS.start,
      end: resolved.workingHours.end || DEFAULT_WORKING_HOURS.end,
    },
    eventTypeUri: resolved.eventTypeUri ?? "",
  };
}

export function draftsEqual(
  a: BookAppointmentActionDraft,
  b: BookAppointmentActionDraft,
): boolean {
  if (
    a.enabled !== b.enabled ||
    a.whenToOffer !== b.whenToOffer ||
    a.notifyEmail !== b.notifyEmail ||
    a.calendarProvider !== b.calendarProvider ||
    a.timezone !== b.timezone ||
    a.durationMinutes !== b.durationMinutes ||
    a.slotIntervalMinutes !== b.slotIntervalMinutes ||
    a.eventTypeUri !== b.eventTypeUri ||
    a.workingHours.start !== b.workingHours.start ||
    a.workingHours.end !== b.workingHours.end
  ) {
    return false;
  }
  if (a.departments.length !== b.departments.length) return false;
  if (a.workingHours.days.length !== b.workingHours.days.length) return false;
  if (!a.workingHours.days.every((day, i) => day === b.workingHours.days[i])) {
    return false;
  }
  return a.departments.every((dept, i) => dept === b.departments[i]);
}

export function validateBookAppointmentDraft(
  draft: BookAppointmentActionDraft,
): string | null {
  if (!draft.enabled) return null;
  const valid = draft.departments.map((d) => d.trim()).filter(Boolean);
  if (valid.length === 0) {
    return "addDepartment";
  }
  if (draft.calendarProvider === "google" || draft.calendarProvider === "calendly") {
    if (!isValidTimeZone(draft.timezone.trim())) {
      return "timezone";
    }
    if (draft.durationMinutes < 5 || draft.durationMinutes > 240) {
      return "duration";
    }
  }
  if (draft.calendarProvider === "google") {
    if (draft.workingHours.days.length === 0) {
      return "workingHours";
    }
    if (draft.workingHours.start >= draft.workingHours.end) {
      return "workingHours";
    }
  }
  return null;
}
