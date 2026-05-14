export type ToolParameterProperty = {
  type: "string" | "number" | "boolean" | "integer";
  description?: string;
  enum?: string[];
};

export type ToolDefinition = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, ToolParameterProperty>;
      required?: string[];
    };
  };
};

export type ToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

export type ToolResult = {
  toolCallId: string;
  name: string;
  content: string;
};

export type ToolHandler = (
  args: Record<string, unknown>,
  context: ToolContext,
) => Promise<string>;

export type ToolContext = {
  orgId: string;
  sessionId: string;
};
