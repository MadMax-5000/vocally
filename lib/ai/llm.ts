import type { ToolCall, ToolDefinition } from "@/lib/ai/tools/types";
import { BRAND_NAME, BRAND_URL } from "@/lib/constants/brand";

export type LLMMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  name?: string;
};

export type CallLLMOptions = {
  model: string;
  system?: string;
  messages: LLMMessage[];
  maxTokens?: number;
  temperature?: number;
  tools?: ToolDefinition[];
  tool_choice?: "auto" | "none" | "required";
};

export type CallLLMResult = {
  content: string;
  finishReason: string | null;
  tool_calls?: ToolCall[];
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  } | null;
};

export type StreamLLMOptions = CallLLMOptions & {
  onDelta?: (text: string) => void;
};

const OPENROUTER_BASE = "https://openrouter.ai/api/v1";

function getApiKey(): string {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY is not configured");
  return key;
}

function buildChatBody(
  options: CallLLMOptions,
  stream: boolean,
): Record<string, unknown> {
  const {
    model,
    system,
    messages,
    maxTokens = 1024,
    temperature,
    tools,
    tool_choice,
  } = options;

  const body: Record<string, unknown> = {
    model,
    messages: system
      ? [{ role: "system" as const, content: system }, ...messages]
      : messages,
    max_tokens: maxTokens,
  };

  if (temperature !== undefined) body.temperature = temperature;
  if (tools !== undefined && tools.length > 0) {
    body.tools = tools;
    body.tool_choice = tool_choice ?? "auto";
  }
  if (stream) body.stream = true;

  return body;
}

type ToolCallAcc = {
  id: string;
  name: string;
  arguments: string;
};

export class OpenRouterStreamAssembler {
  content = "";
  finishReason: string | null = null;
  usage: CallLLMResult["usage"] = null;
  private tools = new Map<number, ToolCallAcc>();

  applyPayload(payload: unknown): string {
    if (!payload || typeof payload !== "object") return "";
    const obj = payload as Record<string, unknown>;

    if (obj.usage && typeof obj.usage === "object") {
      const u = obj.usage as Record<string, unknown>;
      this.usage = {
        promptTokens: Number(u.prompt_tokens ?? 0),
        completionTokens: Number(u.completion_tokens ?? 0),
        totalTokens: Number(u.total_tokens ?? 0),
      };
    }

    const choices = obj.choices;
    if (!Array.isArray(choices) || choices.length === 0) return "";
    const choice = choices[0] as Record<string, unknown>;

    if (typeof choice.finish_reason === "string") {
      this.finishReason = choice.finish_reason;
    }

    const delta = choice.delta;
    if (!delta || typeof delta !== "object") return "";
    const d = delta as Record<string, unknown>;

    let contentDelta = "";
    if (typeof d.content === "string" && d.content.length > 0) {
      contentDelta = d.content;
      this.content += d.content;
    }

    if (Array.isArray(d.tool_calls)) {
      for (const raw of d.tool_calls) {
        if (!raw || typeof raw !== "object") continue;
        const tc = raw as Record<string, unknown>;
        const index = typeof tc.index === "number" ? tc.index : 0;
        const existing = this.tools.get(index) ?? {
          id: "",
          name: "",
          arguments: "",
        };
        if (typeof tc.id === "string") existing.id = tc.id;
        const fn = tc.function;
        if (fn && typeof fn === "object") {
          const f = fn as Record<string, unknown>;
          if (typeof f.name === "string") existing.name = f.name;
          if (typeof f.arguments === "string") {
            existing.arguments += f.arguments;
          }
        }
        this.tools.set(index, existing);
      }
    }

    return contentDelta;
  }

  toResult(): CallLLMResult {
    const tool_calls: ToolCall[] = [...this.tools.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([, t]) => ({
        id: t.id,
        type: "function" as const,
        function: { name: t.name, arguments: t.arguments },
      }));

    return {
      content: this.content,
      finishReason: this.finishReason,
      tool_calls: tool_calls.length > 0 ? tool_calls : undefined,
      usage: this.usage,
    };
  }
}

export function parseOpenRouterSseLine(line: string): "done" | unknown | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith(":")) return null;
  if (!trimmed.startsWith("data:")) return null;
  const payload = trimmed.slice(5).trim();
  if (payload === "[DONE]") return "done";
  if (!payload) return null;
  try {
    return JSON.parse(payload) as unknown;
  } catch {
    return null;
  }
}

export function consumeOpenRouterSseBuffer(
  buffer: string,
  assembler: OpenRouterStreamAssembler,
  onDelta?: (text: string) => void,
): string {
  const parts = buffer.split("\n");
  const rest = parts.pop() ?? "";

  for (const line of parts) {
    const parsed = parseOpenRouterSseLine(line);
    if (parsed === null) continue;
    if (parsed === "done") return rest;
    const delta = assembler.applyPayload(parsed);
    if (delta && onDelta) onDelta(delta);
  }

  return rest;
}

export async function callLLM(options: CallLLMOptions): Promise<CallLLMResult> {
  const apiKey = getApiKey();

  const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": BRAND_URL,
      "X-Title": BRAND_NAME,
    },
    body: JSON.stringify(buildChatBody(options, false)),
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
    tool_calls: choice?.message?.tool_calls ?? undefined,
    usage: json.usage
      ? {
          promptTokens: json.usage.prompt_tokens ?? 0,
          completionTokens: json.usage.completion_tokens ?? 0,
          totalTokens: json.usage.total_tokens ?? 0,
        }
      : null,
  };
}

export async function streamLLM(options: StreamLLMOptions): Promise<CallLLMResult> {
  const { onDelta, ...callOptions } = options;
  const apiKey = getApiKey();

  const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": BRAND_URL,
      "X-Title": BRAND_NAME,
    },
    body: JSON.stringify(buildChatBody(callOptions, true)),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LLM API error (${res.status}): ${text}`);
  }

  if (!res.body) {
    throw new Error("LLM API error: empty stream body");
  }

  const assembler = new OpenRouterStreamAssembler();
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    buffer = consumeOpenRouterSseBuffer(buffer, assembler, onDelta);
    if (parseOpenRouterSseLine(buffer) === "done") break;
  }

  if (buffer.trim()) {
    consumeOpenRouterSseBuffer(`${buffer}\n`, assembler, onDelta);
  }

  return assembler.toResult();
}
