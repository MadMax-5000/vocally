import { buildBookAppointmentPromptSection } from "@/lib/ai/prompts/book-appointment-prompt";
import { buildCollectLeadsPromptSection } from "@/lib/ai/prompts/collect-leads-prompt";
import { getAllToolDefinitions } from "@/lib/ai/tools/registry";
import type { ToolDefinition } from "@/lib/ai/tools/types";
import type { ResolvedBookAppointmentAction } from "@/lib/deploy/book-appointment-action";
import type { ResolvedCollectLeadsAction } from "@/lib/deploy/collect-leads-action";

export type VoiceBotPromptInput = {
  agentName: string;
  orgName: string;
  instructions?: string | null;
  knowledgeContext: string;
  language: string;
  toolDefinitions?: ToolDefinition[];
  collectLeads?: ResolvedCollectLeadsAction;
  bookAppointment?: ResolvedBookAppointmentAction;
};

export const voiceBotSystemPromptV1 = (input: VoiceBotPromptInput) => {
  const sections: string[] = [
    `You are ${input.agentName}, an AI assistant for ${input.orgName}'s customer support team.`,
    `You are speaking with a customer over the phone. Keep responses short — 1 to 3 sentences maximum.`,
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
      "You have access to the following tools. Call them when a customer needs you to look something up or take action:",
      "",
      toolDescriptions,
      "",
      "When you need to use a tool, the system executes it and gives you the result. Use the result to answer the customer conversationally. Keep your spoken response brief.",
    );
  }

  if (input.collectLeads?.enabled) {
    sections.push(buildCollectLeadsPromptSection(input.collectLeads));
  }

  if (input.bookAppointment?.enabled) {
    sections.push(buildBookAppointmentPromptSection(input.bookAppointment));
  }

  sections.push(
    "If you cannot resolve the issue, say so clearly and offer to transfer to a human agent.",
    "If the customer sounds frustrated or asks for something outside your capabilities, acknowledge their concern and offer to transfer to a human agent.",
    "Never ask for full credit card numbers or passwords verbally.",
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
