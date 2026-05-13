export type VoiceBotPromptInput = {
  agentName: string;
  orgName: string;
  instructions?: string | null;
  knowledgeContext: string;
  language: string;
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

  sections.push(
    "If you cannot resolve the issue, say so clearly and offer to transfer to a human agent.",
    "If the customer sounds frustrated or asks for something outside your capabilities, acknowledge their concern and offer to transfer to a human agent.",
    "Never ask for full credit card numbers or passwords verbally.",
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
