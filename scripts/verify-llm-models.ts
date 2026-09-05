import {
  LLM_MODELS,
  LLM_PRICE_CEILING_USD_PER_MILLION,
} from "../lib/ai/model-registry"

type OpenRouterModel = {
  id: string
  supported_parameters?: string[]
  pricing?: {
    prompt?: string
    completion?: string
  }
}

function perMillion(value: string | undefined): number {
  return Number(value ?? "0") * 1_000_000
}

function isExcludedId(id: string): boolean {
  return id.startsWith("~") || id.includes(":free") || id.includes(":batch")
}

async function main(): Promise<void> {
  const res = await fetch("https://openrouter.ai/api/v1/models")
  if (!res.ok) {
    throw new Error(`OpenRouter /models returned ${res.status}`)
  }

  const body = (await res.json()) as { data?: OpenRouterModel[] }
  const catalog = new Map((body.data ?? []).map((m) => [m.id, m]))
  const failures: string[] = []

  for (const model of LLM_MODELS) {
    if (isExcludedId(model.id)) {
      failures.push(`${model.id}: excluded variant (:free/:batch/~)`)
      continue
    }

    const live = catalog.get(model.id)
    if (!live) {
      failures.push(`${model.id}: not found on OpenRouter`)
      continue
    }

    const params = live.supported_parameters ?? []
    if (!params.includes("tools")) {
      failures.push(`${model.id}: missing tools support`)
    }

    const prompt = perMillion(live.pricing?.prompt)
    const completion = perMillion(live.pricing?.completion)
    const band =
      model.minPlan === "PRO"
        ? LLM_PRICE_CEILING_USD_PER_MILLION.hard
        : LLM_PRICE_CEILING_USD_PER_MILLION.starter

    if (prompt > band.prompt || completion > band.completion) {
      failures.push(
        `${model.id}: $${prompt.toFixed(3)}/$${completion.toFixed(3)} exceeds ${model.minPlan} ceiling $${band.prompt}/$${band.completion}`,
      )
    }

    if (
      prompt > LLM_PRICE_CEILING_USD_PER_MILLION.hard.prompt ||
      completion > LLM_PRICE_CEILING_USD_PER_MILLION.hard.completion
    ) {
      failures.push(
        `${model.id}: $${prompt.toFixed(3)}/$${completion.toFixed(3)} exceeds hard ceiling`,
      )
    }
  }

  if (failures.length > 0) {
    console.error("LLM model verification failed:")
    for (const line of failures) console.error(`  - ${line}`)
    process.exit(1)
  }

  console.log(`Verified ${LLM_MODELS.length} registry models against OpenRouter.`)
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
