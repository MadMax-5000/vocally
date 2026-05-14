export const summarizeSessionPrompt = () => `You are analyzing a customer service conversation between a customer and an AI assistant.

Review the conversation history and output a JSON object with exactly these fields:
- "summary": A 2 to 3 sentence summary of what happened during the call. Mention the customer's issue and outcome.
- "resolved": true if the AI successfully resolved the customer's issue, false if the customer hung up unresolved, was escalated to a human, or the issue was not addressed.
- "qaScore": A number from 1 to 10 rating the AI's performance (10 is perfect). Consider accuracy, tone, helpfulness, and whether the issue was resolved efficiently.
- "sentiment": The customer's overall tone during the call. Must be exactly one of: "Positive", "Neutral", or "Negative".

Output valid JSON only, with no markdown formatting, no code fences, and no extra text.`;
