import { describe, expect, it } from "vitest"

import {
  DEFAULT_LLM_MODEL,
  LLM_MODELS,
  isKnownLlmModelId,
  isModelAllowedForPlan,
  llmIconSrc,
  modelsForPlan,
  resolveLlmModelForPlan,
  resolveLlmModelId,
} from "@/lib/ai/model-registry"

describe("model-registry", () => {
  it("defaults empty and unknown ids to GLM 5.3 Flash", () => {
    expect(resolveLlmModelId("")).toBe(DEFAULT_LLM_MODEL)
    expect(resolveLlmModelId("openai/gpt-5.2")).toBe(DEFAULT_LLM_MODEL)
    expect(resolveLlmModelId("anthropic/claude-haiku-4.5")).toBe(DEFAULT_LLM_MODEL)
  })

  it("rejects unknown ids on save but keeps registry ids", () => {
    expect(isKnownLlmModelId("z-ai/glm-5.3-flash")).toBe(true)
    expect(isKnownLlmModelId("openai/gpt-5.2")).toBe(false)
  })

  it("hides Pro models from Starter and keeps them on Pro", () => {
    const starterIds = modelsForPlan("STARTER").map((m) => m.id)
    const proIds = modelsForPlan("PRO").map((m) => m.id)

    expect(starterIds).toContain("z-ai/glm-5.3-flash")
    expect(starterIds).toContain("z-ai/glm-4.7-flash")
    expect(starterIds).toContain("mistralai/mistral-nemo")
    expect(starterIds).not.toContain("openai/gpt-4.1-mini")
    expect(starterIds).not.toContain("openai/gpt-4o-mini")
    expect(proIds).toContain("openai/gpt-4.1-mini")
    expect(proIds).toContain("openai/gpt-4o-mini")
    expect(proIds).toContain("meta-llama/llama-4-maverick")
    expect(isModelAllowedForPlan("openai/gpt-4.1-mini", "STARTER")).toBe(false)
    expect(resolveLlmModelForPlan("openai/gpt-4.1-mini", "STARTER")).toBe(
      DEFAULT_LLM_MODEL,
    )
  })

  it("does not include Amazon Nova and maps lab icons", () => {
    expect(LLM_MODELS.some((m) => m.id.startsWith("amazon/"))).toBe(false)
    expect(resolveLlmModelId("amazon/nova-lite-v1")).toBe(DEFAULT_LLM_MODEL)
    expect(llmIconSrc("z-ai/glm-5.3-flash")).toBe("/svg/zai.svg")
    expect(llmIconSrc("deepseek/deepseek-v4-flash")).toBe("/svg/deepseek.svg")
    expect(llmIconSrc("qwen/qwen3.7-flash")).toBe("/svg/qwen.svg")
    expect(llmIconSrc("mistralai/mistral-small-3.2-24b-instruct")).toBe("/svg/mistral.svg")
    expect(llmIconSrc("meta-llama/llama-4-scout")).toBe("/svg/meta.svg")
  })
})
