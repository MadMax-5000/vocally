export type ChatBotPromptInput = {
  agentName: string;
  orgName: string;
  instructions?: string | null;
  knowledgeContext: string;
  language: string;
};

export const chatBotSystemPromptV1 = (input: ChatBotPromptInput) => {
  const sections: string[] = [
    `You are ${input.agentName}, an AI assistant for ${input.orgName}'s customer support team.`,
    `Always respond in ${input.language}.`,
  ];

  if (input.instructions) {
    sections.push(`Follow these instructions: ${input.instructions}`);
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
