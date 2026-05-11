import * as Sentry from "@sentry/nextjs";

import { generateEmbedding } from "@/lib/ai/embeddings";
import { getOrgPrismaId } from "@/lib/server/organization";
import { similaritySearch } from "@/lib/knowledge/vector-store";

export type RetrievedChunk = {
  content: string;
  docTitle: string;
  score: number;
};

export type RetrievalResult = {
  chunks: RetrievedChunk[];
  totalTokenCount: number;
};

export async function retrieveRelevantChunks(
  query: string,
  options?: { topK?: number; minScore?: number },
): Promise<RetrievalResult> {
  const orgId = await getOrgPrismaId();
  if (!orgId) throw new Error("Unauthorized");

  const topK = options?.topK ?? 5;
  const minScore = options?.minScore ?? 0.7;

  try {
    const { embedding } = await generateEmbedding(query);

    const results = await similaritySearch(embedding, orgId, topK, minScore);

    const chunks = results.map((r) => ({
      content: r.content,
      docTitle: r.docTitle,
      score: r.score,
    }));

    const totalTokenCount = results.reduce((sum, r) => sum + Math.ceil(r.content.length / 4), 0);

    return { chunks, totalTokenCount };
  } catch (err) {
    Sentry.captureException(err);
    return { chunks: [], totalTokenCount: 0 };
  }
}
