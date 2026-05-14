import { ALL_TOOL_DEFINITIONS } from "./definitions";
import type { ToolDefinition, ToolHandler } from "./types";
import {
  handleCheckOrderStatus,
  handleBookAppointment,
  handleCreateTicket,
  handleLookupAccount,
  handleRequestSecureInput,
} from "./handlers";

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

export function toolExists(name: string): boolean {
  return name in registry;
}
