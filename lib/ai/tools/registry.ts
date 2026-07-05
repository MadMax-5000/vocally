import {
  ALL_TOOL_DEFINITIONS,
  buildBookAppointmentDefinition,
  CHECK_ORDER_STATUS,
  CREATE_TICKET,
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
import { handleSaveLead } from "./handlers/save-lead";
import { handleShowCustomForm } from "./handlers/show-custom-form";
import { DEFAULT_APPOINTMENT_DEPARTMENTS } from "@/lib/deploy/book-appointment-action";

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
    definition: buildBookAppointmentDefinition([...DEFAULT_APPOINTMENT_DEPARTMENTS]),
    handler: handleBookAppointment,
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
  bookAppointmentDepartments?: string[];
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
    const departments =
      options.bookAppointmentDepartments &&
      options.bookAppointmentDepartments.length > 0
        ? options.bookAppointmentDepartments
        : [...DEFAULT_APPOINTMENT_DEPARTMENTS];
    tools = [...tools, buildBookAppointmentDefinition(departments)];
  }

  return tools;
}

export function toolExists(name: string): boolean {
  return name in registry;
}
