import { LlmProvider } from "@prisma/client"

export type LlmModelOption = {
  provider: LlmProvider
  id: string
  label: string
  group?: string
}

// Note: provider model catalogs evolve often. This is a curated, explicit registry
// so the UI is deterministic and works without external API calls.
export const LLM_MODELS: LlmModelOption[] = [
  // OpenAI
  { provider: LlmProvider.OPENAI, id: "gpt-5", label: "GPT-5", group: "OpenAI" },
  { provider: LlmProvider.OPENAI, id: "gpt-5-mini", label: "GPT-5 Mini", group: "OpenAI" },
  { provider: LlmProvider.OPENAI, id: "gpt-5-nano", label: "GPT-5 Nano", group: "OpenAI" },
  { provider: LlmProvider.OPENAI, id: "gpt-4.1", label: "GPT-4.1", group: "OpenAI" },
  { provider: LlmProvider.OPENAI, id: "gpt-4.1-mini", label: "GPT-4.1 Mini", group: "OpenAI" },
  { provider: LlmProvider.OPENAI, id: "gpt-4.1-nano", label: "GPT-4.1 Nano", group: "OpenAI" },
  { provider: LlmProvider.OPENAI, id: "o4-mini", label: "o4-mini", group: "OpenAI reasoning" },
  { provider: LlmProvider.OPENAI, id: "o3", label: "o3", group: "OpenAI reasoning" },
  { provider: LlmProvider.OPENAI, id: "o3-mini", label: "o3-mini", group: "OpenAI reasoning" },

  // Anthropic (Claude)
  { provider: LlmProvider.ANTHROPIC, id: "claude-opus-4-7", label: "Claude Opus 4.7", group: "Claude" },
  { provider: LlmProvider.ANTHROPIC, id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6", group: "Claude" },
  { provider: LlmProvider.ANTHROPIC, id: "claude-haiku-4-5", label: "Claude Haiku 4.5", group: "Claude" },

  // Google (Gemini)
  { provider: LlmProvider.GOOGLE, id: "gemini-2.5-pro", label: "Gemini 2.5 Pro", group: "Gemini" },
  { provider: LlmProvider.GOOGLE, id: "gemini-2.5-flash", label: "Gemini 2.5 Flash", group: "Gemini" },
  { provider: LlmProvider.GOOGLE, id: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash-Lite", group: "Gemini" },
]

export function groupModels(models: LlmModelOption[]): Record<string, LlmModelOption[]> {
  return models.reduce<Record<string, LlmModelOption[]>>((acc, m) => {
    const key = m.group ?? String(m.provider)
    acc[key] = acc[key] ?? []
    acc[key].push(m)
    return acc
  }, {})
}

