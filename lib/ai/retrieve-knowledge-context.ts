import { generateEmbedding } from "@/lib/ai/embeddings";
import { logServerWarning } from "@/lib/logger";
import { similaritySearch } from "@/lib/knowledge/vector-store";

/** Strong match: high precision snippets for RAG injection. */
const RAG_PRIMARY_TOP_K = 5;
const RAG_PRIMARY_MIN_SCORE = 0.7;
/** When nothing passes the primary bar but the agent has attached docs, retrieve broader matches for paraphrased queries. */
const RAG_FALLBACK_TOP_K = 8;
const RAG_FALLBACK_MIN_SCORE = 0.5;

export async function retrieveKnowledgeContext(
  message: string,
  orgId: string,
  attachedDocIds: string[],
): Promise<string> {
  if (attachedDocIds.length === 0) return "";

  try {
    const { embedding } = await generateEmbedding(message);
    let results = await similaritySearch(
      embedding,
      orgId,
      RAG_PRIMARY_TOP_K,
      RAG_PRIMARY_MIN_SCORE,
      attachedDocIds,
    );

    if (results.length === 0) {
      results = await similaritySearch(
        embedding,
        orgId,
        RAG_FALLBACK_TOP_K,
        RAG_FALLBACK_MIN_SCORE,
        attachedDocIds,
      );
    }

    if (results.length > 0) {
      return results.map((r) => `[${r.docTitle}] ${r.content}`).join("\n\n");
    }

    logServerWarning("rag_retrieval_empty_after_fallback", {
      attachedDocCount: attachedDocIds.length,
      primaryMinScore: RAG_PRIMARY_MIN_SCORE,
      fallbackMinScore: RAG_FALLBACK_MIN_SCORE,
      messageCharLength: message.length,
    });
  } catch (err) {
    logServerWarning("rag_retrieval_failed", {
      attachedDocCount: attachedDocIds.length,
      messageCharLength: message.length,
      errorName: err instanceof Error ? err.name : "unknown",
    });
  }

  return "";
}
