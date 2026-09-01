import {
  ALL_TOOL_DEFINITIONS,
  BOOK_APPOINTMENT,
  CHECK_ORDER_STATUS,
  CREATE_TICKET,
  LIST_AVAILABLE_SLOTS,
  LOOKUP_ACCOUNT,
  REQUEST_SECURE_INPUT,
  SAVE_LEAD,
  SHOW_CUSTOM_FORM,
} from "./definitions";
import type { ToolDefinition, ToolHandler } from "./types";
import {
  handleCheckOrderStatus,
  handleBookAppointment,
  handleCreateTicket,
  handleLookupAccount,
  handleRequestSecureInput,
} from "./handlers";
import { handleListAvailableSlots } from "./handlers/list-available-slots";
import { handleSaveLead } from "./handlers/save-lead";
import { handleShowCustomForm } from "./handlers/show-custom-form";

type ToolEntry = {
  definition: ToolDefinition;
  handler: ToolHandler;
};

const registry: Record<string, ToolEntry> = {
  check_order_status: {
    definition: CHECK_ORDER_STATUS,
    handler: handleCheckOrderStatus,
  },
  book_appointment: {
    definition: BOOK_APPOINTMENT,
    handler: handleBookAppointment,
  },
  list_available_slots: {
    definition: LIST_AVAILABLE_SLOTS,
    handler: handleListAvailableSlots,
  },
  create_ticket: {
    definition: CREATE_TICKET,
    handler: handleCreateTicket,
  },
  lookup_account: {
    definition: LOOKUP_ACCOUNT,
    handler: handleLookupAccount,
  },
  request_secure_input: {
    definition: REQUEST_SECURE_INPUT,
    handler: handleRequestSecureInput,
  },
  save_lead: {
    definition: SAVE_LEAD,
    handler: handleSaveLead,
  },
  show_custom_form: {
    definition: SHOW_CUSTOM_FORM,
    handler: handleShowCustomForm,
  },
};

export function getToolDefinition(name: string): ToolDefinition | undefined {
  return registry[name]?.definition;
}

export function getToolHandler(name: string): ToolHandler | undefined {
  return registry[name]?.handler;
}

export function getAllToolDefinitions(): ToolDefinition[] {
  return ALL_TOOL_DEFINITIONS;
}

export function getToolDefinitionsForAgent(options?: {
  allowCreateTicket?: boolean;
  includeCollectLeads?: boolean;
  includeCustomForm?: boolean;
  includeBookAppointment?: boolean;
  includeListAvailableSlots?: boolean;
  includeSecureInput?: boolean;
}): ToolDefinition[] {
  const allowCreateTicket = options?.allowCreateTicket ?? true;
  let tools = allowCreateTicket
    ? [...ALL_TOOL_DEFINITIONS]
    : ALL_TOOL_DEFINITIONS.filter((t) => t.function.name !== "create_ticket");

  if (options?.includeCollectLeads) {
    tools = [...tools, SAVE_LEAD];
  }

  if (options?.includeCustomForm) {
    tools = [...tools, SHOW_CUSTOM_FORM];
  }

  if (options?.includeBookAppointment) {
    tools = [...tools, BOOK_APPOINTMENT];
    if (options.includeListAvailableSlots) {
      tools = [...tools, LIST_AVAILABLE_SLOTS];
    }
  }

  if (options?.includeSecureInput) {
    tools = [...tools, REQUEST_SECURE_INPUT];
  }

  return tools;
}

export function toolExists(name: string): boolean {
  return name in registry;
}
