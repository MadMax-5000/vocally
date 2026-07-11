import type { AgentDetailWithRelations } from "@/components/dashboard/agent-detail/agent-detail-types";
import {
  resolveBookAppointmentAction,
  type BookAppointmentWhenToOffer,
} from "@/lib/deploy/book-appointment-action";

export type BookAppointmentActionDraft = {
  enabled: boolean;
  whenToOffer: BookAppointmentWhenToOffer;
  departments: string[];
  notifyEmail: string;
};

export function buildBookAppointmentActionDraft(
  agent: AgentDetailWithRelations,
): BookAppointmentActionDraft {
  const resolved = resolveBookAppointmentAction(agent.channels);
  return {
    enabled: resolved.enabled,
    whenToOffer: resolved.whenToOffer,
    departments: [...resolved.departments],
    notifyEmail: resolved.notifyEmail ?? "",
  };
}

export function draftsEqual(
  a: BookAppointmentActionDraft,
  b: BookAppointmentActionDraft,
): boolean {
  if (
    a.enabled !== b.enabled ||
    a.whenToOffer !== b.whenToOffer ||
    a.notifyEmail !== b.notifyEmail
  ) {
    return false;
  }
  if (a.departments.length !== b.departments.length) return false;
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
  return null;
}
