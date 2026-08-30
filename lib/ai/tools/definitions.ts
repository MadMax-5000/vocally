import type { ToolDefinition } from "./types";

export const CHECK_ORDER_STATUS: ToolDefinition = {
  type: "function",
  function: {
    name: "check_order_status",
    description:
      "Check the current status and estimated delivery of a customer order by order ID.",
    parameters: {
      type: "object",
      properties: {
        orderId: {
          type: "string",
          description: "The order ID to look up, e.g. ORD-12345",
        },
      },
      required: ["orderId"],
    },
  },
};

export const BOOK_APPOINTMENT: ToolDefinition = {
  type: "function",
  function: {
    name: "book_appointment",
    description:
      "Book a new appointment for the customer with a specific department. Returns confirmation details.",
    parameters: {
      type: "object",
      properties: {
        date: {
          type: "string",
          description: "The requested date in YYYY-MM-DD format",
        },
        time: {
          type: "string",
          description: "The requested time in HH:MM format (24-hour)",
        },
        department: {
          type: "string",
          description: "The department or service type for the appointment",
          enum: ["support", "sales", "billing", "technical", "general"],
        },
        customerName: {
          type: "string",
          description: "The customer's full name",
        },
        customerEmail: {
          type: "string",
          description: "Optional customer email for confirmation",
        },
        notes: {
          type: "string",
          description: "Optional notes or reason for the appointment",
        },
      },
      required: ["date", "time", "department", "customerName"],
    },
  },
};

export function buildBookAppointmentDefinition(
  departments: string[],
): ToolDefinition {
  const allowed =
    departments.length > 0 ? departments : ["support", "sales", "general"];
  return {
    type: "function",
    function: {
      ...BOOK_APPOINTMENT.function,
      parameters: {
        ...BOOK_APPOINTMENT.function.parameters,
        properties: {
          ...BOOK_APPOINTMENT.function.parameters.properties,
          department: {
            ...BOOK_APPOINTMENT.function.parameters.properties.department,
            enum: allowed,
          },
        },
      },
    },
  };
}

export const LIST_AVAILABLE_SLOTS: ToolDefinition = {
  type: "function",
  function: {
    name: "list_available_slots",
    description:
      "List real available appointment times from the connected calendar. Always call this before booking when a calendar is connected. Never invent times.",
    parameters: {
      type: "object",
      properties: {
        fromDate: {
          type: "string",
          description: "Start date in YYYY-MM-DD (optional; defaults to today)",
        },
        toDate: {
          type: "string",
          description: "End date in YYYY-MM-DD (optional; defaults to a few days ahead)",
        },
      },
    },
  },
};

export const CREATE_TICKET: ToolDefinition = {
  type: "function",
  function: {
    name: "create_ticket",
    description:
      "Create a support ticket for a customer issue. Use when the issue requires follow-up or cannot be resolved immediately.",
    parameters: {
      type: "object",
      properties: {
        subject: {
          type: "string",
          description: "A short summary of the issue",
        },
        description: {
          type: "string",
          description: "A detailed description of the issue",
        },
        priority: {
          type: "string",
          description: "The urgency of the issue",
          enum: ["low", "medium", "high", "urgent"],
        },
        customerEmail: {
          type: "string",
          description: "Optional customer email for follow-up",
        },
      },
      required: ["subject", "description", "priority"],
    },
  },
};

export const LOOKUP_ACCOUNT: ToolDefinition = {
  type: "function",
  function: {
    name: "lookup_account",
    description:
      "Look up a customer account by account ID or email address. Returns account details like name, plan, status, and join date.",
    parameters: {
      type: "object",
      properties: {
        accountId: {
          type: "string",
          description: "The account ID to look up, e.g. ACC-98765",
        },
        email: {
          type: "string",
          description: "The customer email address to look up",
        },
      },
    },
  },
};

export const REQUEST_SECURE_INPUT: ToolDefinition = {
  type: "function",
  function: {
    name: "request_secure_input",
    description:
      "Ask the customer to enter sensitive information (account number, PIN, card digits, etc.) using their phone keypad so it is not spoken aloud. Call this tool when you need secure data, then tell the customer what to enter and to press # when done.",
    parameters: {
      type: "object",
      properties: {
        prompt: {
          type: "string",
          description: "What the customer should enter, e.g. 'your account number' or 'the last 4 digits of your card'",
        },
        maxDigits: {
          type: "number",
          description: "Maximum number of digits to collect (default 6)",
        },
        finishOnKey: {
          type: "string",
          description: "Key that finishes input (default '#')",
        },
        description: {
          type: "string",
          description: "Internal label for what is being collected (not spoken to customer)",
        },
      },
      required: ["prompt", "description"],
    },
  },
};

export const SAVE_LEAD: ToolDefinition = {
  type: "function",
  function: {
    name: "save_lead",
    description:
      "Save or update lead contact details collected from the customer during the conversation. Call whenever you learn new information; partial updates are allowed.",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Customer full name",
        },
        email: {
          type: "string",
          description: "Customer email address",
        },
        phone: {
          type: "string",
          description: "Customer phone number",
        },
        company: {
          type: "string",
          description: "Customer company or organization",
        },
        notes: {
          type: "string",
          description: "Additional context about the lead or request",
        },
      },
    },
  },
};

export const SHOW_CUSTOM_FORM: ToolDefinition = {
  type: "function",
  function: {
    name: "show_custom_form",
    description:
      "Display the configured custom form in the chat UI so the customer can submit structured information at once. Use when collecting multiple fields (contact details, booking info, surveys) instead of asking one field at a time.",
    parameters: {
      type: "object",
      properties: {
        reason: {
          type: "string",
          description:
            "Brief internal note on why the form is being shown (not shown to the customer)",
        },
      },
    },
  },
};

export const ALL_TOOL_DEFINITIONS: ToolDefinition[] = [
  CHECK_ORDER_STATUS,
  CREATE_TICKET,
  LOOKUP_ACCOUNT,
  REQUEST_SECURE_INPUT,
];

