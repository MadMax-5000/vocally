const OPENROUTER_BASE = "https://openrouter.ai/api/v1";
const EMBEDDING_MODEL = "openai/text-embedding-3-small";
const EMBEDDING_DIMENSIONS = 1536;

export type EmbeddingResult = {
  embedding: number[];
  tokenCount: number;
};

function getApiKey(): string {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY is not configured");
  return key;
}

async function embed(input: string | string[], dimensions: number) {
  const apiKey = getApiKey();

  const res = await fetch(`${OPENROUTER_BASE}/embeddings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input,
      dimensions,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Embedding API error (${res.status}): ${body}`);
  }

  return res.json();
}

export async function generateEmbedding(text: string): Promise<EmbeddingResult> {
  const json = await embed(text, EMBEDDING_DIMENSIONS);
  return {
    embedding: json.data[0].embedding as number[],
    tokenCount: json.usage?.total_tokens ?? 0,
  };
}

export async function generateEmbeddings(texts: string[]): Promise<EmbeddingResult[]> {
  const json = await embed(texts, EMBEDDING_DIMENSIONS);
  return json.data.map((d: { embedding: number[] }) => ({
    embedding: d.embedding,
    tokenCount: json.usage?.total_tokens ?? 0,
  }));
}
