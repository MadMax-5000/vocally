import { LlmProvider, type Plan } from "@prisma/client"

import { PLAN_RANK } from "@/lib/billing/plan-rank"

export type LlmMinPlan = Extract<Plan, "FREE" | "STARTER" | "PRO">

export type LlmModelOption = {
  provider: LlmProvider
  id: string
  label: string
  group: string
  minPlan: LlmMinPlan
}

/** Hard ceiling — no registry model may exceed these USD / 1M token rates. */
export const LLM_PRICE_CEILING_USD_PER_MILLION = {
  hard: { prompt: 0.5, completion: 2.0 },
  starter: { prompt: 0.15, completion: 0.5 },
} as const

export const DEFAULT_LLM_MODEL = "z-ai/glm-5.3-flash"

export function providerFromModelId(id: string): LlmProvider {
  const prefix = id.split("/")[0]
  if (prefix === "openai") return LlmProvider.OPENAI
  if (prefix === "google") return LlmProvider.GOOGLE
  if (prefix === "anthropic") return LlmProvider.ANTHROPIC
  return LlmProvider.OPENAI
}

export function llmIconSrc(modelId: string): string {
  const prefix = modelId.split("/")[0] ?? ""
  switch (prefix) {
    case "openai":
      return "/svg/openai-light.svg"
    case "google":
      return "/svg/gemini.svg"
    case "anthropic":
      return "/svg/claude.svg"
    case "x-ai":
      return "/svg/grok-xai.svg"
    case "z-ai":
      return "/svg/zai.svg"
    case "deepseek":
      return "/svg/deepseek.svg"
    case "qwen":
      return "/svg/qwen.svg"
    case "mistralai":
      return "/svg/mistral.svg"
    case "meta-llama":
    case "meta":
      return "/svg/meta.svg"
    default:
      return "/svg/api.svg"
  }
}

// Curated, price-capped OpenRouter catalog. IDs are `author/slug` as used by
// https://openrouter.ai/api/v1. Verification: `npm run verify:llm-models`.
export const LLM_MODELS: LlmModelOption[] = [
  // Starter / FREE
  { provider: LlmProvider.OPENAI, id: "z-ai/glm-5.3-flash", label: "GLM 5.3 Flash", group: "Z.ai", minPlan: "FREE" },
  { provider: LlmProvider.OPENAI, id: "z-ai/glm-4.7-flash", label: "GLM 4.7 Flash", group: "Z.ai", minPlan: "FREE" },
  { provider: LlmProvider.OPENAI, id: "deepseek/deepseek-v4-flash", label: "DeepSeek V4 Flash", group: "DeepSeek", minPlan: "FREE" },
  { provider: LlmProvider.OPENAI, id: "qwen/qwen3.7-flash", label: "Qwen3.7 Flash", group: "Qwen", minPlan: "FREE" },
  { provider: LlmProvider.OPENAI, id: "qwen/qwen3.5-flash-02-23", label: "Qwen3.5 Flash", group: "Qwen", minPlan: "FREE" },
  { provider: LlmProvider.OPENAI, id: "qwen/qwen3-30b-a3b-instruct-2507", label: "Qwen3 30B", group: "Qwen", minPlan: "FREE" },
  { provider: LlmProvider.OPENAI, id: "openai/gpt-5-nano", label: "GPT-5 Nano", group: "OpenAI", minPlan: "FREE" },
  { provider: LlmProvider.OPENAI, id: "openai/gpt-4.1-nano", label: "GPT-4.1 Nano", group: "OpenAI", minPlan: "FREE" },
  { provider: LlmProvider.OPENAI, id: "openai/gpt-oss-120b", label: "gpt-oss-120b", group: "OpenAI", minPlan: "FREE" },
  { provider: LlmProvider.OPENAI, id: "openai/gpt-oss-20b", label: "gpt-oss-20b", group: "OpenAI", minPlan: "FREE" },
  { provider: LlmProvider.GOOGLE, id: "google/gemini-2.5-flash-lite", label: "Gemini 2.5 Flash-Lite", group: "Gemini", minPlan: "FREE" },
  { provider: LlmProvider.GOOGLE, id: "google/gemma-3-27b-it", label: "Gemma 3 27B", group: "Gemini", minPlan: "FREE" },
  { provider: LlmProvider.OPENAI, id: "mistralai/mistral-small-3.2-24b-instruct", label: "Mistral Small 3.2", group: "Mistral", minPlan: "FREE" },
  { provider: LlmProvider.OPENAI, id: "mistralai/mistral-nemo", label: "Mistral Nemo", group: "Mistral", minPlan: "FREE" },
  { provider: LlmProvider.OPENAI, id: "mistralai/ministral-8b-2512", label: "Ministral 8B", group: "Mistral", minPlan: "FREE" },
  { provider: LlmProvider.OPENAI, id: "meta-llama/llama-4-scout", label: "Llama 4 Scout", group: "Meta", minPlan: "FREE" },
  { provider: LlmProvider.OPENAI, id: "meta-llama/llama-3.3-70b-instruct", label: "Llama 3.3 70B", group: "Meta", minPlan: "FREE" },

  // Pro / ENTERPRISE
  { provider: LlmProvider.OPENAI, id: "z-ai/glm-4.7", label: "GLM 4.7", group: "Z.ai", minPlan: "PRO" },
  { provider: LlmProvider.OPENAI, id: "openai/gpt-5-mini", label: "GPT-5 Mini", group: "OpenAI", minPlan: "PRO" },
  { provider: LlmProvider.OPENAI, id: "openai/gpt-4.1-mini", label: "GPT-4.1 Mini", group: "OpenAI", minPlan: "PRO" },
  { provider: LlmProvider.OPENAI, id: "openai/gpt-4o-mini", label: "GPT-4o Mini", group: "OpenAI", minPlan: "PRO" },
  { provider: LlmProvider.OPENAI, id: "deepseek/deepseek-chat", label: "DeepSeek Chat", group: "DeepSeek", minPlan: "PRO" },
  { provider: LlmProvider.OPENAI, id: "deepseek/deepseek-v3.2", label: "DeepSeek V3.2", group: "DeepSeek", minPlan: "PRO" },
  { provider: LlmProvider.GOOGLE, id: "google/gemini-3.1-flash-lite", label: "Gemini 3.1 Flash-Lite", group: "Gemini", minPlan: "PRO" },
  { provider: LlmProvider.OPENAI, id: "qwen/qwen3-235b-a22b-2507", label: "Qwen3 235B", group: "Qwen", minPlan: "PRO" },
  { provider: LlmProvider.OPENAI, id: "qwen/qwen3.5-35b-a3b", label: "Qwen3.5 35B", group: "Qwen", minPlan: "PRO" },
  { provider: LlmProvider.OPENAI, id: "mistralai/mistral-small-2603", label: "Mistral Small", group: "Mistral", minPlan: "PRO" },
  { provider: LlmProvider.OPENAI, id: "meta-llama/llama-4-maverick", label: "Llama 4 Maverick", group: "Meta", minPlan: "PRO" },
]

export function groupModels(models: LlmModelOption[]): Record<string, LlmModelOption[]> {
  return models.reduce<Record<string, LlmModelOption[]>>((acc, m) => {
    const key = m.group
    acc[key] = acc[key] ?? []
    acc[key].push(m)
    return acc
  }, {})
}

const REGISTRY_MODEL_IDS = new Set(LLM_MODELS.map((m) => m.id))
const REGISTRY_BY_ID = new Map(LLM_MODELS.map((m) => [m.id, m]))

/** Maps legacy or mistyped model ids to OpenRouter-compatible registry ids. */
const LEGACY_LLM_MODEL_ALIASES: Record<string, string> = {
  "claude-haiku-4-5": DEFAULT_LLM_MODEL,
  "claude-haiku-4.5": DEFAULT_LLM_MODEL,
  "claude-sonnet-4-6": DEFAULT_LLM_MODEL,
  "claude-opus-4-7": DEFAULT_LLM_MODEL,
  "anthropic/claude-haiku-4.5": DEFAULT_LLM_MODEL,
  "anthropic/claude-sonnet-4.6": DEFAULT_LLM_MODEL,
  "anthropic/claude-opus-4.7": DEFAULT_LLM_MODEL,
  "amazon/nova-lite-v1": DEFAULT_LLM_MODEL,
}

export function resolveLlmModelId(model: string): string {
  const trimmed = model.trim()
  if (!trimmed) return DEFAULT_LLM_MODEL

  const alias = LEGACY_LLM_MODEL_ALIASES[trimmed]
  if (alias) return alias

  if (REGISTRY_MODEL_IDS.has(trimmed)) return trimmed

  if (!trimmed.includes("/")) {
    const prefixed = LLM_MODELS.find((m) => m.id.endsWith(`/${trimmed}`))
    if (prefixed) return prefixed.id
  }

  return DEFAULT_LLM_MODEL
}

export function isKnownLlmModelId(model: string): boolean {
  const trimmed = model.trim()
  if (!trimmed) return false
  if (LEGACY_LLM_MODEL_ALIASES[trimmed]) return true
  if (REGISTRY_MODEL_IDS.has(trimmed)) return true
  if (!trimmed.includes("/")) {
    return LLM_MODELS.some((m) => m.id.endsWith(`/${trimmed}`))
  }
  return false
}

export function modelsForPlan(plan: Plan): LlmModelOption[] {
  const rank = PLAN_RANK[plan]
  return LLM_MODELS.filter((m) => rank >= PLAN_RANK[m.minPlan])
}

export function isModelAllowedForPlan(model: string, plan: Plan): boolean {
  const id = resolveLlmModelId(model)
  const entry = REGISTRY_BY_ID.get(id)
  if (!entry) return false
  return PLAN_RANK[plan] >= PLAN_RANK[entry.minPlan]
}

export function resolveLlmModelForPlan(model: string, plan: Plan): string {
  const resolved = resolveLlmModelId(model)
  if (isModelAllowedForPlan(resolved, plan)) return resolved
  return DEFAULT_LLM_MODEL
}
