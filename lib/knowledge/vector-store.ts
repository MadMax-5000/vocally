import { randomUUID } from "crypto";

import * as Sentry from "@sentry/nextjs";

import { prisma } from "@/lib/db/prisma";

export type SimilarityResult = {
  chunkId: string;
  knowledgeDocId: string;
  content: string;
  chunkIndex: number;
  docTitle: string;
  score: number;
};

export async function insertChunks(
  chunks: { knowledgeDocId: string; content: string; chunkIndex: number; tokenCount: number; embedding: number[] }[],
): Promise<void> {
  if (chunks.length === 0) return;

  try {
    for (const c of chunks) {
      await prisma.$executeRaw`
        INSERT INTO "KnowledgeChunk" ("id", "knowledgeDocId", "content", "chunkIndex", "tokenCount", "embedding")
        VALUES (${randomUUID()}, ${c.knowledgeDocId}, ${c.content}, ${c.chunkIndex}, ${c.tokenCount}, ${JSON.stringify(c.embedding)}::vector)
      `;
    }
  } catch (err) {
    Sentry.captureException(err);
    throw new Error(`Failed to insert chunks: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function deleteChunksByDocId(knowledgeDocId: string): Promise<void> {
  try {
    await prisma.$executeRaw`
      DELETE FROM "KnowledgeChunk"
      WHERE "knowledgeDocId" = ${knowledgeDocId}
    `;
  } catch (err) {
    Sentry.captureException(err);
    throw new Error(`Failed to delete chunks: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function similaritySearch(
  queryEmbedding: number[],
  orgId: string,
  topK: number = 5,
  minScore: number = 0.7,
): Promise<SimilarityResult[]> {
  try {
    const results = await prisma.$queryRaw<SimilarityResult[]>`
      SELECT
        kc.id::text AS "chunkId",
        kc."knowledgeDocId"::text AS "knowledgeDocId",
        kc.content,
        kc."chunkIndex" AS "chunkIndex",
        kd.title AS "docTitle",
        1 - (kc.embedding <=> ${JSON.stringify(queryEmbedding)}::vector) AS score
      FROM "KnowledgeChunk" kc
      JOIN "KnowledgeDoc" kd ON kd.id = kc."knowledgeDocId"
      WHERE
        kd."orgId" = ${orgId}
        AND kc.embedding IS NOT NULL
        AND 1 - (kc.embedding <=> ${JSON.stringify(queryEmbedding)}::vector) >= ${minScore}
      ORDER BY kc.embedding <=> ${JSON.stringify(queryEmbedding)}::vector
      LIMIT ${topK}
    `;

    return results.map((r) => ({
      ...r,
      score: Number(r.score),
    }));
  } catch (err) {
    Sentry.captureException(err);
    throw new Error(`Similarity search failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}
