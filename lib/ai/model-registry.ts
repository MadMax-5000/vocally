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
  { provider: LlmProvider.OPENAI, id: "openai/gpt-5.2", label: "GPT-5.2", group: "OpenAI" },
  { provider: LlmProvider.OPENAI, id: "openai/gpt-5-mini", label: "GPT-5 Mini", group: "OpenAI" },
  { provider: LlmProvider.OPENAI, id: "openai/gpt-5-nano", label: "GPT-5 Nano", group: "OpenAI" },
  { provider: LlmProvider.OPENAI, id: "openai/gpt-4.1", label: "GPT-4.1", group: "OpenAI" },
  { provider: LlmProvider.OPENAI, id: "openai/gpt-4.1-mini", label: "GPT-4.1 Mini", group: "OpenAI" },
  { provider: LlmProvider.OPENAI, id: "openai/gpt-4.1-nano", label: "GPT-4.1 Nano", group: "OpenAI" },
  { provider: LlmProvider.OPENAI, id: "openai/o4-mini", label: "o4-mini", group: "OpenAI reasoning" },
  { provider: LlmProvider.OPENAI, id: "openai/o3", label: "o3", group: "OpenAI reasoning" },
  { provider: LlmProvider.OPENAI, id: "openai/o3-mini", label: "o3-mini", group: "OpenAI reasoning" },

  // Anthropic (Claude)
  { provider: LlmProvider.ANTHROPIC, id: "anthropic/claude-opus-4.7", label: "Claude Opus 4.7", group: "Claude" },
  { provider: LlmProvider.ANTHROPIC, id: "anthropic/claude-sonnet-4.6", label: "Claude Sonnet 4.6", group: "Claude" },
  { provider: LlmProvider.ANTHROPIC, id: "anthropic/claude-haiku-4.5", label: "Claude Haiku 4.5", group: "Claude" },

  // Google (Gemini)
  { provider: LlmProvider.GOOGLE, id: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro", group: "Gemini" },
  { provider: LlmProvider.GOOGLE, id: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash", group: "Gemini" },
  { provider: LlmProvider.GOOGLE, id: "google/gemini-2.5-flash-lite", label: "Gemini 2.5 Flash-Lite", group: "Gemini" },
]

export function groupModels(models: LlmModelOption[]): Record<string, LlmModelOption[]> {
  return models.reduce<Record<string, LlmModelOption[]>>((acc, m) => {
    const key = m.group ?? String(m.provider)
    acc[key] = acc[key] ?? []
    acc[key].push(m)
    return acc
  }, {})
}

const REGISTRY_MODEL_IDS = new Set(LLM_MODELS.map((m) => m.id))

/** Maps legacy or mistyped model ids to OpenRouter-compatible registry ids. */
const LEGACY_LLM_MODEL_ALIASES: Record<string, string> = {
  "claude-haiku-4-5": "anthropic/claude-haiku-4.5",
  "claude-haiku-4.5": "anthropic/claude-haiku-4.5",
  "claude-sonnet-4-6": "anthropic/claude-sonnet-4.6",
  "claude-opus-4-7": "anthropic/claude-opus-4.7",
}

export function resolveLlmModelId(model: string): string {
  const trimmed = model.trim()
  if (!trimmed) return "openai/gpt-4.1-mini"

  const alias = LEGACY_LLM_MODEL_ALIASES[trimmed]
  if (alias) return alias

  if (REGISTRY_MODEL_IDS.has(trimmed)) return trimmed

  if (!trimmed.includes("/")) {
    const withAnthropic = `anthropic/${trimmed}`
    if (REGISTRY_MODEL_IDS.has(withAnthropic)) return withAnthropic

    const withOpenai = `openai/${trimmed}`
    if (REGISTRY_MODEL_IDS.has(withOpenai)) return withOpenai

    const withGoogle = `google/${trimmed}`
    if (REGISTRY_MODEL_IDS.has(withGoogle)) return withGoogle
  }

  return trimmed
}

export function isKnownLlmModelId(model: string): boolean {
  return REGISTRY_MODEL_IDS.has(resolveLlmModelId(model))
}

