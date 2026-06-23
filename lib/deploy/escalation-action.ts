import type { AgentChannel, TicketPriority } from "@prisma/client";

import { EscalationTrigger } from "@/lib/ai/escalation-service";
import { getWebChatChannel, parseWebChatConfig } from "@/lib/deploy/web-chat-config";

export const DEFAULT_ESCALATION_CUSTOMER_MESSAGE =
  "Connecting you to an agent. Someone from our team will be with you shortly.";

export type EscalationTriggersConfig = {
  userRequested?: boolean;
  negativeSentiment?: boolean;
  aiFailure?: boolean;
  unsupportedRequest?: boolean;
};

export type EscalationActionConfig = {
  enabled?: boolean;
  triggers?: EscalationTriggersConfig;
  customerMessage?: string;
  createTicketOnEscalate?: boolean;
  allowCreateTicketTool?: boolean;
  ticketPriority?: TicketPriority;
  requireEmailForTicket?: boolean;
};

export type ResolvedEscalationAction = {
  enabled: boolean;
  triggers: EscalationTriggersConfig;
  customerMessage: string;
  createTicketOnEscalate: boolean;
  allowCreateTicketTool: boolean;
  ticketPriority: TicketPriority;
  requireEmailForTicket: boolean;
};

const TICKET_PRIORITIES: TicketPriority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

const DEFAULT_TRIGGERS: Required<EscalationTriggersConfig> = {
  userRequested: true,
  negativeSentiment: true,
  aiFailure: true,
  unsupportedRequest: true,
};

function parseTriggers(value: unknown): EscalationTriggersConfig | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }
  const raw = value as Record<string, unknown>;
  const result: EscalationTriggersConfig = {};
  if (typeof raw.userRequested === "boolean") {
    result.userRequested = raw.userRequested;
  }
  if (typeof raw.negativeSentiment === "boolean") {
    result.negativeSentiment = raw.negativeSentiment;
  }
  if (typeof raw.aiFailure === "boolean") {
    result.aiFailure = raw.aiFailure;
  }
  if (typeof raw.unsupportedRequest === "boolean") {
    result.unsupportedRequest = raw.unsupportedRequest;
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

function parseTicketPriority(value: unknown): TicketPriority | undefined {
  if (typeof value !== "string") return undefined;
  const upper = value.toUpperCase();
  return TICKET_PRIORITIES.find((p) => p === upper);
}

export function parseEscalationActionConfig(value: unknown): EscalationActionConfig {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  const raw = value as Record<string, unknown>;
  const result: EscalationActionConfig = {};

  if (typeof raw.enabled === "boolean") {
    result.enabled = raw.enabled;
  }
  const triggers = parseTriggers(raw.triggers);
  if (triggers) {
    result.triggers = triggers;
  }
  if (typeof raw.customerMessage === "string") {
    const trimmed = raw.customerMessage.trim();
    if (trimmed) result.customerMessage = trimmed;
  }
  if (typeof raw.createTicketOnEscalate === "boolean") {
    result.createTicketOnEscalate = raw.createTicketOnEscalate;
  }
  if (typeof raw.allowCreateTicketTool === "boolean") {
    result.allowCreateTicketTool = raw.allowCreateTicketTool;
  }
  const priority = parseTicketPriority(raw.ticketPriority);
  if (priority) {
    result.ticketPriority = priority;
  }
  if (typeof raw.requireEmailForTicket === "boolean") {
    result.requireEmailForTicket = raw.requireEmailForTicket;
  }

  return result;
}

export function resolveEscalationTriggers(
  triggers: EscalationTriggersConfig,
): EscalationTrigger[] {
  const resolved = { ...DEFAULT_TRIGGERS, ...triggers };
  const enabled: EscalationTrigger[] = [];
  if (resolved.userRequested) {
    enabled.push(EscalationTrigger.USER_REQUESTED);
  }
  if (resolved.negativeSentiment) {
    enabled.push(EscalationTrigger.NEGATIVE_SENTIMENT);
  }
  if (resolved.aiFailure) {
    enabled.push(EscalationTrigger.AI_FAILURE);
  }
  if (resolved.unsupportedRequest) {
    enabled.push(EscalationTrigger.UNSUPPORTED_REQUEST);
  }
  return enabled;
}

export function resolveEscalationAction(
  channels: Pick<AgentChannel, "channel" | "enabled" | "config">[],
): ResolvedEscalationAction {
  const row = getWebChatChannel(channels);
  const parsed = row ? parseWebChatConfig(row.config) : {};
  const action = parsed.actions?.escalations ?? {};
  const triggers = { ...DEFAULT_TRIGGERS, ...action.triggers };

  const ticketsEnabled =
    action.createTicketOnEscalate === true || action.allowCreateTicketTool === true;

  return {
    enabled: action.enabled ?? false,
    triggers,
    customerMessage: action.customerMessage ?? DEFAULT_ESCALATION_CUSTOMER_MESSAGE,
    createTicketOnEscalate: action.createTicketOnEscalate ?? false,
    allowCreateTicketTool: action.allowCreateTicketTool ?? ticketsEnabled,
    ticketPriority: action.ticketPriority ?? "MEDIUM",
    requireEmailForTicket: action.requireEmailForTicket ?? false,
  };
}

export function resolveCustomerEscalationMessage(
  config: Pick<ResolvedEscalationAction, "customerMessage">,
): string {
  return config.customerMessage.trim() || DEFAULT_ESCALATION_CUSTOMER_MESSAGE;
}
