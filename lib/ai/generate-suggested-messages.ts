import { z } from "zod";

import { callLLM } from "@/lib/ai/llm";

const suggestionsResponseSchema = z.object({
  suggestions: z.array(z.string().max(80)).min(1).max(4),
});

const MAX_CHIP_LENGTH = 40;

export type GenerateSuggestedMessagesInput = {
  llmModel: string;
  recentMessages: { role: "USER" | "BOT" | "AGENT" | "SYSTEM"; content: string }[];
  botContent: string;
};

function buildTranscript(
  messages: GenerateSuggestedMessagesInput["recentMessages"],
  botContent: string,
): string {
  const lines = messages.slice(-10).map((m) => {
    const speaker =
      m.role === "USER" ? "Customer" : m.role === "BOT" ? "Assistant" : m.role;
    return `${speaker}: ${m.content}`;
  });
  lines.push(`Assistant: ${botContent}`);
  return lines.join("\n");
}

function normalizeSuggestions(raw: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of raw) {
    const trimmed = item.trim().slice(0, MAX_CHIP_LENGTH);
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    result.push(trimmed);
    if (result.length >= 4) break;
  }
  return result;
}

function parseSuggestionsFromContent(content: string): string[] {
  const trimmed = content.trim();
  if (!trimmed) return [];

  try {
    const json = JSON.parse(trimmed) as unknown;
    const parsed = suggestionsResponseSchema.safeParse(json);
    if (parsed.success) {
      return normalizeSuggestions(parsed.data.suggestions);
    }
  } catch {
    // fall through to array-only parse
  }

  try {
    const asArray = JSON.parse(trimmed) as unknown;
    if (Array.isArray(asArray)) {
      const strings = asArray.filter((v): v is string => typeof v === "string");
      return normalizeSuggestions(strings);
    }
  } catch {
    return [];
  }

  return [];
}

export async function generateDynamicSuggestedMessages(
  input: GenerateSuggestedMessagesInput,
): Promise<string[]> {
  const transcript = buildTranscript(input.recentMessages, input.botContent);

  const system = `You suggest short follow-up messages a customer might tap to send next in a support chat.
Return ONLY valid JSON: {"suggestions":["..."]} with 2 to 4 items.
Each suggestion must be at most ${MAX_CHIP_LENGTH} characters, phrased as something the customer would send (not the assistant).
Use the same language as the conversation. No markdown, no explanation.`;

  try {
    const result = await callLLM({
      model: input.llmModel,
      system,
      messages: [{ role: "user", content: transcript }],
      maxTokens: 200,
      temperature: 0.3,
    });

    return parseSuggestionsFromContent(result.content);
  } catch {
    return [];
  }
}
