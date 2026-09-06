import { generateEmbedding } from "@/lib/ai/embeddings";
import { prisma } from "@/lib/db/prisma";
import { similaritySearch } from "@/lib/knowledge/vector-store";
import { logServerWarning } from "@/lib/logger";

export async function searchVoiceKnowledge(params: {
  orgId: string;
  agentId: string;
  query: string;
}): Promise<string> {
  try {
    const agentDocs = await prisma.agentKnowledgeDoc.findMany({
      where: { agentId: params.agentId },
      select: { knowledgeDocId: true, knowledgeDoc: { select: { title: true } } },
    });
    const attachedDocIds = agentDocs.map((d) => d.knowledgeDocId);

    const { embedding } = await generateEmbedding(params.query);
    let results = await similaritySearch(embedding, params.orgId, 5, 0.7, attachedDocIds);

    if (results.length === 0 && attachedDocIds.length > 0) {
      results = await similaritySearch(embedding, params.orgId, 5, 0.55, attachedDocIds);
    }

    if (results.length === 0) return "";
    return results.map((r) => `[${r.docTitle}] ${r.content}`).join("\n\n");
  } catch (err) {
    logServerWarning("[AssemblyAI] Knowledge search failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return "";
  }
}

export async function listKnowledgeKeyterms(agentId: string, limit = 20): Promise<string[]> {
  const docs = await prisma.agentKnowledgeDoc.findMany({
    where: { agentId },
    select: { knowledgeDoc: { select: { title: true } } },
    take: limit,
  });
  return docs
    .map((d) => d.knowledgeDoc.title.trim())
    .filter((title) => title.length > 0)
    .slice(0, limit);
}
