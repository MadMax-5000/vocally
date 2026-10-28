/**
 * AI and answer-engine crawler registry.
 *
 * Read this before changing `app/robots.ts`.
 *
 * Vendor crawlers are not interchangeable. The same company usually runs three or four
 * separate product tokens with different jobs:
 *
 *   - `search`   crawls to build the index behind that assistant's answers and citations.
 *                Blocking it removes the site from those answers. This is the role that
 *                decides whether an assistant can recommend or cite Anselio at all.
 *   - `user`     fetches a single page because a human asked that assistant about it.
 *                Blocking it breaks live retrieval of the page mid-conversation.
 *   - `training` collects data for model weights. Blocking it does not remove the site from
 *                that vendor's search answers; it only keeps the content out of future
 *                models (which is where much brand-name familiarity comes from).
 *
 * Docs: docs/ai-visibility.md
 */

export type AiAgentRole = "search" | "user" | "training";

export type AiAgent = {
  /** Product token, exactly as it appears after `User-agent:` in robots.txt. */
  token: string;
  vendor: string;
  role: AiAgentRole;
  /** What allowing the token gets Anselio, or what blocking it costs. */
  purpose: string;
  /** Vendor documentation for the token. Empty when no official docs were found. */
  docs: string;
};

export const AI_AGENTS: readonly AiAgent[] = [
  // ── OpenAI / ChatGPT ────────────────────────────────────────────────────────
  {
    token: "OAI-SearchBot",
    vendor: "OpenAI",
    role: "search",
    purpose: "Indexes pages for ChatGPT Search answers and citations.",
    docs: "https://developers.openai.com/api/docs/bots",
  },
  {
    token: "ChatGPT-User",
    vendor: "OpenAI",
    role: "user",
    purpose: "Fetches a page when a person asks ChatGPT about it.",
    docs: "https://developers.openai.com/api/docs/bots",
  },
  {
    token: "GPTBot",
    vendor: "OpenAI",
    role: "training",
    purpose: "Collects content for OpenAI model training. Separate from ChatGPT Search.",
    docs: "https://developers.openai.com/api/docs/bots",
  },

  // ── Anthropic / Claude ──────────────────────────────────────────────────────
  {
    token: "Claude-SearchBot",
    vendor: "Anthropic",
    role: "search",
    purpose: "Improves Claude's search results and can surface pages as sources.",
    docs: "https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler",
  },
  {
    token: "Claude-User",
    vendor: "Anthropic",
    role: "user",
    purpose: "Fetches a page in response to a Claude user request.",
    docs: "https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler",
  },
  {
    token: "ClaudeBot",
    vendor: "Anthropic",
    role: "training",
    purpose: "Anthropic model development data.",
    docs: "https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler",
  },
  {
    token: "Claude-Web",
    vendor: "Anthropic",
    role: "training",
    purpose: "Legacy Anthropic crawler alias.",
    docs: "https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler",
  },
  {
    token: "anthropic-ai",
    vendor: "Anthropic",
    role: "training",
    purpose: "Legacy Anthropic crawler alias.",
    docs: "https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler",
  },

  // ── Perplexity ──────────────────────────────────────────────────────────────
  {
    token: "PerplexityBot",
    vendor: "Perplexity",
    role: "search",
    purpose: "Indexes pages that Perplexity can surface and cite in answers.",
    docs: "https://docs.perplexity.ai/docs/resources/perplexity-crawlers",
  },
  {
    token: "Perplexity-User",
    vendor: "Perplexity",
    role: "user",
    purpose: "User-triggered page fetch while Perplexity answers a question.",
    docs: "https://docs.perplexity.ai/docs/resources/perplexity-crawlers",
  },

  // ── Google ──────────────────────────────────────────────────────────────────
  {
    token: "Googlebot",
    vendor: "Google",
    role: "search",
    purpose:
      "Google Search. AI Overviews and AI Mode draw on the indexed Google Search corpus.",
    docs: "https://developers.google.com/search/docs/appearance/ai-features",
  },
  {
    token: "Google-Extended",
    vendor: "Google",
    role: "training",
    purpose:
      "robots-only token controlling Gemini app grounding and Gemini model training. Not the switch for AI Overviews.",
    docs: "https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers",
  },
  {
    token: "Google-CloudVertexBot",
    vendor: "Google",
    role: "training",
    purpose:
      "Grounding and indexing for Vertex AI / enterprise agent builders that build on customer data.",
    docs: "https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers",
  },
  {
    token: "GoogleOther",
    vendor: "Google",
    role: "training",
    purpose: "Google research and development crawls, including model improvement.",
    docs: "https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers",
  },

  // ── Microsoft / Copilot ─────────────────────────────────────────────────────
  {
    token: "bingbot",
    vendor: "Microsoft",
    role: "search",
    purpose: "Bing index, which grounds Microsoft Copilot answers and citations.",
    docs: "https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/generative-ai-public-websites",
  },

  // ── Apple ───────────────────────────────────────────────────────────────────
  {
    token: "Applebot",
    vendor: "Apple",
    role: "search",
    purpose: "Apple search surfaces, including Siri and Spotlight suggestions.",
    docs: "https://support.apple.com/en-us/119829",
  },
  {
    token: "Applebot-Extended",
    vendor: "Apple",
    role: "training",
    purpose: "Use of content for Apple Intelligence training. Not required for Applebot search.",
    docs: "https://support.apple.com/en-us/119829",
  },

  // ── Meta AI ─────────────────────────────────────────────────────────────────
  {
    token: "meta-webindexer",
    vendor: "Meta",
    role: "search",
    purpose: "Improves Meta AI search quality so it can cite and link to pages.",
    docs: "https://developers.facebook.com/documentation/sharing/webmasters/web-crawlers",
  },
  {
    token: "meta-externalfetcher",
    vendor: "Meta",
    role: "user",
    purpose: "Fetches a link at a user's request, including agentic product features.",
    docs: "https://developers.facebook.com/documentation/sharing/webmasters/web-crawlers",
  },
  {
    token: "meta-externalagent",
    vendor: "Meta",
    role: "training",
    purpose:
      "Meta model training and direct indexing for Meta AI. Blocking it can also limit that indexing.",
    docs: "https://developers.facebook.com/documentation/sharing/webmasters/web-crawlers",
  },

  // ── Mistral ─────────────────────────────────────────────────────────────────
  {
    token: "MistralAI-Index",
    vendor: "Mistral",
    role: "search",
    purpose: "Mistral search indexing that powers answers in Le Chat / Vibe.",
    docs: "https://docs.mistral.ai/robots",
  },
  {
    token: "MistralAI-User",
    vendor: "Mistral",
    role: "user",
    purpose: "User-directed page fetch to answer a question with a source link.",
    docs: "https://docs.mistral.ai/robots",
  },
  {
    token: "MistralAI-Training",
    vendor: "Mistral",
    role: "training",
    purpose: "Mistral training data. Explicitly not used for search or live answers.",
    docs: "https://docs.mistral.ai/robots",
  },

  // ── Amazon / Alexa ──────────────────────────────────────────────────────────
  {
    token: "Amzn-SearchBot",
    vendor: "Amazon",
    role: "search",
    purpose: "Search experiences in Amazon products, including Alexa answers.",
    docs: "https://developer.amazon.com/amazonbot",
  },
  {
    token: "Amzn-User",
    vendor: "Amazon",
    role: "user",
    purpose: "User-directed fetch, for example answering an Alexa question live.",
    docs: "https://developer.amazon.com/amazonbot",
  },
  {
    token: "Amazonbot",
    vendor: "Amazon",
    role: "training",
    purpose: "Amazon product-improvement crawls that may train Amazon AI models.",
    docs: "https://developer.amazon.com/amazonbot",
  },

  // ── Others that feed answers or model weights ───────────────────────────────
  {
    token: "DuckAssistBot",
    vendor: "DuckDuckGo",
    role: "search",
    purpose: "Real-time crawling for DuckDuckGo AI-assisted answers that cite sources.",
    docs: "https://duckduckgo.com/duckduckgo-help-pages/results/duckassistbot",
  },
  {
    token: "CCBot",
    vendor: "Common Crawl",
    role: "training",
    purpose: "Feeds Common Crawl, a dataset behind many open and commercial models.",
    docs: "https://commoncrawl.org/ccbot",
  },
  {
    token: "Bytespider",
    vendor: "ByteDance",
    role: "training",
    purpose: "ByteDance crawling. No official product documentation located.",
    docs: "",
  },
  {
    token: "KimiBot",
    vendor: "Moonshot AI",
    role: "training",
    purpose:
      "Kimi crawler. Blocked by Cloudflare's managed file; no official product documentation located.",
    docs: "",
  },
];

/**
 * Whether model-training crawlers are allowed.
 *
 * Default is `true`: for a new brand, being present in model weights is a real discovery
 * channel, and blocking training has no effect on being cited in that vendor's answers.
 * Flip to `false` to serve the same robots.txt with every `training` agent disallowed -
 * the `search` and `user` agents stay allowed, so AI answers keep working.
 */
export const ALLOW_AI_TRAINING = true;

/** Tokens an answer engine needs so Anselio can appear in its answers. */
export function answerAgents(): AiAgent[] {
  return AI_AGENTS.filter((agent) => agent.role !== "training");
}

/** Training-only tokens, subject to {@link ALLOW_AI_TRAINING}. */
export function trainingAgents(): AiAgent[] {
  return ALLOW_AI_TRAINING ? AI_AGENTS.filter((agent) => agent.role === "training") : [];
}

/** Every token the policy allows, for logging and documentation. */
export function allowedAiTokens(): string[] {
  return [...answerAgents(), ...trainingAgents()].map((agent) => agent.token);
}
