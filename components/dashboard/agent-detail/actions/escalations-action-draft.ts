import type { AgentDetailWithRelations } from "@/components/dashboard/agent-detail/agent-detail-types";
import { EscalationTrigger } from "@/lib/ai/escalation-service";
import {
  DEFAULT_ESCALATION_CUSTOMER_MESSAGE,
  resolveEscalationAction,
  type EscalationTriggersConfig,
} from "@/lib/deploy/escalation-action";
import type { TicketPriority } from "@prisma/client";

export type EscalationsActionDraft = {
  enabled: boolean;
  triggers: Required<EscalationTriggersConfig>;
  customerMessage: string;
  createTicketOnEscalate: boolean;
  allowCreateTicketTool: boolean;
  ticketPriority: TicketPriority;
  requireEmailForTicket: boolean;
};

export function buildEscalationsActionDraft(
  agent: AgentDetailWithRelations,
): EscalationsActionDraft {
  const resolved = resolveEscalationAction(agent.channels);

  return {
    enabled: resolved.enabled || agent.handoffEnabled,
    triggers: {
      userRequested: resolved.triggers.userRequested ?? true,
      negativeSentiment: resolved.triggers.negativeSentiment ?? true,
      aiFailure: resolved.triggers.aiFailure ?? true,
      unsupportedRequest: resolved.triggers.unsupportedRequest ?? true,
    },
    customerMessage: resolved.customerMessage || DEFAULT_ESCALATION_CUSTOMER_MESSAGE,
    createTicketOnEscalate: resolved.createTicketOnEscalate,
    allowCreateTicketTool: resolved.allowCreateTicketTool,
    ticketPriority: resolved.ticketPriority,
    requireEmailForTicket: resolved.requireEmailForTicket,
  };
}

export function draftsEqual(a: EscalationsActionDraft, b: EscalationsActionDraft): boolean {
  return (
    a.enabled === b.enabled &&
    a.customerMessage === b.customerMessage &&
    a.createTicketOnEscalate === b.createTicketOnEscalate &&
    a.allowCreateTicketTool === b.allowCreateTicketTool &&
    a.ticketPriority === b.ticketPriority &&
    a.requireEmailForTicket === b.requireEmailForTicket &&
    a.triggers.userRequested === b.triggers.userRequested &&
    a.triggers.negativeSentiment === b.triggers.negativeSentiment &&
    a.triggers.aiFailure === b.triggers.aiFailure &&
    a.triggers.unsupportedRequest === b.triggers.unsupportedRequest
  );
}

export const TRIGGER_FIELD_MAP: {
  key: keyof EscalationsActionDraft["triggers"];
  trigger: EscalationTrigger;
  label: string;
}[] = [
  {
    key: "userRequested",
    trigger: EscalationTrigger.USER_REQUESTED,
    label: "Customer asks for a human",
  },
  {
    key: "negativeSentiment",
    trigger: EscalationTrigger.NEGATIVE_SENTIMENT,
    label: "Negative sentiment or frustration",
  },
  {
    key: "aiFailure",
    trigger: EscalationTrigger.AI_FAILURE,
    label: "AI failure or repeated fallback",
  },
  {
    key: "unsupportedRequest",
    trigger: EscalationTrigger.UNSUPPORTED_REQUEST,
    label: "Request outside AI capabilities",
  },
];
