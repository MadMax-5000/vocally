import type { ToolDefinition } from "@/lib/ai/tools/types";

import type { AssemblyAiHttpTool } from "./client";

export const SEARCH_KNOWLEDGE_TOOL_NAME = "search_knowledge";
export const TRANSFER_TO_HUMAN_TOOL_NAME = "transfer_to_human";

export const SEARCH_KNOWLEDGE_DEFINITION: ToolDefinition = {
  type: "function",
  function: {
    name: SEARCH_KNOWLEDGE_TOOL_NAME,
    description:
      "Search the business knowledge base for facts, policies, products, hours, and procedures. Call this before answering questions about the company.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "What the caller asked, in their words.",
        },
      },
      required: ["query"],
    },
  },
};

const SEARCH_KNOWLEDGE_DESCRIPTION =
  "Search the business knowledge base for facts, policies, products, hours, and procedures. Call this before answering questions about the company.";

const TRANSFER_DESCRIPTION =
  "Escalate the call to a human. Call when the customer asks for a person, is upset, or the request is outside policy. Include a short reason and a one-sentence summary.";

export function assemblyAiToolUrl(appOrigin: string, agentId: string, toolName: string): string {
  const origin = appOrigin.replace(/\/$/, "");
  return `${origin}/api/webhooks/assemblyai/tools/${agentId}/${toolName}`;
}

function toJsonSchema(def: ToolDefinition): Record<string, unknown> {
  return {
    type: "object",
    properties: def.function.parameters.properties,
    ...(def.function.parameters.required
      ? { required: def.function.parameters.required }
      : {}),
  };
}

export function buildSearchKnowledgeTool(
  appOrigin: string,
  agentId: string,
  bearerToken: string,
): AssemblyAiHttpTool {
  return {
    name: SEARCH_KNOWLEDGE_TOOL_NAME,
    description: SEARCH_KNOWLEDGE_DESCRIPTION,
    execution_mode: "interactive",
    timeout_seconds: 30,
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "What the caller asked, in their words.",
        },
      },
      required: ["query"],
    },
    http: {
      url: assemblyAiToolUrl(appOrigin, agentId, SEARCH_KNOWLEDGE_TOOL_NAME),
      http_method: "POST",
      headers: [{ name: "Authorization", value: `Bearer ${bearerToken}` }],
    },
  };
}

export function buildTransferToHumanTool(
  appOrigin: string,
  agentId: string,
  bearerToken: string,
): AssemblyAiHttpTool {
  return {
    name: TRANSFER_TO_HUMAN_TOOL_NAME,
    description: TRANSFER_DESCRIPTION,
    execution_mode: "hold",
    timeout_seconds: 60,
    parameters: {
      type: "object",
      properties: {
        reason: {
          type: "string",
          description: "Short internal reason for the transfer.",
        },
        summary: {
          type: "string",
          description: "One- or two-sentence summary of what the caller needs.",
        },
        from_number: {
          type: "string",
          description: "Caller phone in E.164 if already known.",
        },
      },
      required: ["reason"],
    },
    http: {
      url: assemblyAiToolUrl(appOrigin, agentId, TRANSFER_TO_HUMAN_TOOL_NAME),
      http_method: "POST",
      headers: [{ name: "Authorization", value: `Bearer ${bearerToken}` }],
    },
  };
}

export function mapToolDefinitionToHttp(
  def: ToolDefinition,
  appOrigin: string,
  agentId: string,
  bearerToken: string,
): AssemblyAiHttpTool {
  return {
    name: def.function.name,
    description: def.function.description,
    execution_mode: "interactive",
    timeout_seconds: 30,
    parameters: toJsonSchema(def),
    http: {
      url: assemblyAiToolUrl(appOrigin, agentId, def.function.name),
      http_method: "POST",
      headers: [{ name: "Authorization", value: `Bearer ${bearerToken}` }],
    },
  };
}

export function buildAssemblyAiHttpTools(params: {
  appOrigin: string;
  agentId: string;
  bearerToken: string;
  definitions: ToolDefinition[];
  includeSearchKnowledge: boolean;
  includeTransferToHuman: boolean;
}): AssemblyAiHttpTool[] {
  const tools = params.definitions.map((def) =>
    mapToolDefinitionToHttp(def, params.appOrigin, params.agentId, params.bearerToken),
  );

  if (params.includeSearchKnowledge) {
    tools.unshift(buildSearchKnowledgeTool(params.appOrigin, params.agentId, params.bearerToken));
  }
  if (params.includeTransferToHuman) {
    tools.push(buildTransferToHumanTool(params.appOrigin, params.agentId, params.bearerToken));
  }

  return tools;
}
