import { callLLM } from "@/lib/ai/llm";
import { resolveLlmModelId } from "@/lib/ai/model-registry";
import { sessionTitlePrompt } from "@/lib/ai/prompts/session-title-v1";

const TITLE_MODEL = "openai/gpt-4.1-nano";
const TITLE_TIMEOUT_MS = 2_500;
const MAX_TITLE_LENGTH = 60;

/** Strip model formatting and collapse whitespace before storing a title. */
export function normalizeSessionTitle(
  raw: string,
  fallback: string,
): string {
  const cleaned = raw
    .replace(/^```[\s\S]*?\n?/, "")
    .replace(/```$/, "")
    .replace(/^(?:title|conversation)\s*:\s*/i, "")
    .replace(/^["'`“”‘’]+|["'`“”‘’]+$/g, "")
    .replace(/\s+/g, " ")
    .replace(/[.!?:;,]+$/g, "")
    .trim();

  if (!cleaned) return fallback;

  const limited =
    cleaned.length > MAX_TITLE_LENGTH
      ? `${cleaned.slice(0, MAX_TITLE_LENGTH).trimEnd()}`
      : cleaned;

  return limited || fallback;
}

/** Deterministic fallback when the title model is unavailable. */
export function fallbackSessionTitle(message: string): string {
  const cleaned = message
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) return "New conversation";

  const words = cleaned.split(" ").slice(0, 6).join(" ");
  const title = words.replace(/[.!?:;,]+$/g, "").trim();
  if (!title) return "New conversation";

  return title.length > MAX_TITLE_LENGTH
    ? title.slice(0, MAX_TITLE_LENGTH).trimEnd()
    : title;
}

export async function generateSessionTitle(input: {
  message: string;
  model?: string;
}): Promise<string> {
  const fallback = fallbackSessionTitle(input.message);

  let timer: ReturnType<typeof setTimeout> | null = null;
  const timeout = new Promise<string>((resolve) => {
    timer = setTimeout(() => resolve(fallback), TITLE_TIMEOUT_MS);
  });

  try {
    const result = await Promise.race([
      callLLM({
        model: resolveLlmModelId(input.model ?? TITLE_MODEL),
        system: sessionTitlePrompt(),
        messages: [{ role: "user", content: input.message.slice(0, 1_000) }],
        maxTokens: 24,
        temperature: 0.2,
      }),
      timeout,
    ]);

    if (typeof result === "string") return fallback;
    return normalizeSessionTitle(result.content, fallback);
  } catch {
    return fallback;
  } finally {
    if (timer) clearTimeout(timer);
  }
}
