import { buildBookAppointmentPromptSection } from "@/lib/ai/prompts/book-appointment-prompt";
import { buildCollectLeadsPromptSection } from "@/lib/ai/prompts/collect-leads-prompt";
import { buildCustomFormPromptSection } from "@/lib/ai/prompts/custom-form-prompt";
import {
  buildAgentPersonalityPromptSection,
  type AgentPersonalityInput,
} from "@/lib/ai/prompts/agent-personality";
import { getAllToolDefinitions } from "@/lib/ai/tools/registry";
import type { ToolDefinition } from "@/lib/ai/tools/types";
import type { ResolvedBookAppointmentAction } from "@/lib/deploy/book-appointment-action";
import type { ResolvedCollectLeadsAction } from "@/lib/deploy/collect-leads-action";
import type { ResolvedCustomFormAction } from "@/lib/deploy/custom-form-action";

export type ChatBotPromptInput = {
  agentName: string;
  orgName: string;
  instructions?: string | null;
  personality?: AgentPersonalityInput;
  knowledgeContext: string;
  language: string;
  toolDefinitions?: ToolDefinition[];
  collectLeads?: ResolvedCollectLeadsAction;
  customForm?: ResolvedCustomFormAction;
  bookAppointment?: ResolvedBookAppointmentAction;
};

export const chatBotSystemPromptV1 = (input: ChatBotPromptInput) => {
  const sections: string[] = [
    `You are ${input.agentName}, an AI assistant for ${input.orgName}'s customer support team.`,
    `Always respond in ${input.language}.`,
  ];

  const personalitySection = input.personality
    ? buildAgentPersonalityPromptSection(input.personality)
    : "";
  if (personalitySection) {
    sections.push(personalitySection);
  }

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

  if (input.collectLeads?.enabled) {
    sections.push(buildCollectLeadsPromptSection(input.collectLeads));
  }

  if (input.customForm?.enabled && input.customForm.fields.length > 0) {
    sections.push(buildCustomFormPromptSection(input.customForm));
  }

  if (input.bookAppointment?.enabled) {
    sections.push(buildBookAppointmentPromptSection(input.bookAppointment));
  }

  sections.push(
    "Be helpful, accurate, and concise. You can use markdown for formatting.",
    "If you cannot resolve an issue, clearly state that you cannot help and offer to transfer to a human agent.",
    "If the customer is becoming frustrated or asks for something outside your capabilities, acknowledge their concern and offer to transfer to a human agent.",
    "Never ask for sensitive information like passwords or credit card numbers.",
  );

  if (input.knowledgeContext) {
    sections.push(
      "The following blocks are retrieved from your organization's knowledge base for this conversation. For factual or policy questions, treat them as the primary source of truth: answer using this material when it applies, and cite the document title when helpful.",
      "If the customer's question is not covered here, say you do not see that information in the materials you have—do not invent details that are not implied by the knowledge base or general customer support common sense.",
      "",
      input.knowledgeContext,
    );
  }

  return sections.join("\n\n");
};
