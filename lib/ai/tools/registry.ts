import { ALL_TOOL_DEFINITIONS, SAVE_LEAD, SHOW_CUSTOM_FORM } from "./definitions";
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

type ToolEntry = {
  definition: ToolDefinition;
  handler: ToolHandler;
};

const registry: Record<string, ToolEntry> = {
  check_order_status: {
    definition: ALL_TOOL_DEFINITIONS[0],
    handler: handleCheckOrderStatus,
  },
  book_appointment: {
    definition: ALL_TOOL_DEFINITIONS[1],
    handler: handleBookAppointment,
  },
  create_ticket: {
    definition: ALL_TOOL_DEFINITIONS[2],
    handler: handleCreateTicket,
  },
  lookup_account: {
    definition: ALL_TOOL_DEFINITIONS[3],
    handler: handleLookupAccount,
  },
  request_secure_input: {
    definition: ALL_TOOL_DEFINITIONS[4],
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

  return tools;
}

export function toolExists(name: string): boolean {
  return name in registry;
}
