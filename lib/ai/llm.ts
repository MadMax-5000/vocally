export type LLMMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type CallLLMOptions = {
  model: string;
  system?: string;
  messages: LLMMessage[];
  maxTokens?: number;
  temperature?: number;
};

export type CallLLMResult = {
  content: string;
  finishReason: string | null;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  } | null;
};

const OPENROUTER_BASE = "https://openrouter.ai/api/v1";

function getApiKey(): string {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY is not configured");
  return key;
}

export async function callLLM(options: CallLLMOptions): Promise<CallLLMResult> {
  const { model, system, messages, maxTokens = 1024, temperature } = options;
  const apiKey = getApiKey();

  const body: Record<string, unknown> = {
    model,
    messages: system
      ? [{ role: "system" as const, content: system }, ...messages]
      : messages,
    max_tokens: maxTokens,
  };

  if (temperature !== undefined) body.temperature = temperature;

  const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://vocally.app",
      "X-Title": "Vocally",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LLM API error (${res.status}): ${text}`);
  }

  const json = await res.json();
  const choice = json.choices?.[0];

  return {
    content: choice?.message?.content ?? "",
    finishReason: choice?.finish_reason ?? null,
    usage: json.usage
      ? {
          promptTokens: json.usage.prompt_tokens ?? 0,
          completionTokens: json.usage.completion_tokens ?? 0,
          totalTokens: json.usage.total_tokens ?? 0,
        }
      : null,
  };
}
