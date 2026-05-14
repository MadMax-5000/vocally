import { getAllToolDefinitions } from "@/lib/ai/tools/registry";
import type { ToolDefinition } from "@/lib/ai/tools/types";

export type ChatBotPromptInput = {
  agentName: string;
  orgName: string;
  instructions?: string | null;
  knowledgeContext: string;
  language: string;
  toolDefinitions?: ToolDefinition[];
};

export const chatBotSystemPromptV1 = (input: ChatBotPromptInput) => {
  const sections: string[] = [
    `You are ${input.agentName}, an AI assistant for ${input.orgName}'s customer support team.`,
    `Always respond in ${input.language}.`,
  ];

  if (input.instructions) {
    sections.push(`Follow these instructions: ${input.instructions}`);
  }

  const tools = input.toolDefinitions ?? getAllToolDefinitions();
  if (tools.length > 0) {
    const toolDescriptions = tools
      .map((t) => {
        const fn = t.function;
        const params = Object.entries(fn.parameters.properties)
          .map(([key, prop]) => {
            const required = fn.parameters.required?.includes(key)
              ? " (required)"
              : " (optional)";
            return `      - ${key}: ${prop.type}${required} — ${prop.description ?? ""}`;
          })
          .join("\n");
        return `  ${fn.name}: ${fn.description}\n    Parameters:\n${params}`;
      })
      .join("\n\n");

    sections.push(
      "You have access to the following tools to help customers. Use them when appropriate:",
      "",
      toolDescriptions,
      "",
      "To use a tool, the system will handle the execution. When you need to look up information or perform an action, call the appropriate tool and the result will be provided to you. Then respond to the customer naturally based on what you found.",
      "If a tool returns an error or the information isn't available, let the customer know and offer alternatives.",
    );
  }

  sections.push(
    "Be helpful, accurate, and concise. You can use markdown for formatting.",
    "If you cannot resolve an issue, clearly state that you cannot help and offer to transfer to a human agent.",
    "If the customer is becoming frustrated or asks for something outside your capabilities, acknowledge their concern and offer to transfer to a human agent.",
    "Never ask for sensitive information like passwords or credit card numbers.",
  );

  if (input.knowledgeContext) {
    sections.push(
      "Use the following knowledge base information to answer questions:",
      "",
      input.knowledgeContext,
    );
  }

  return sections.join("\n\n");
};
