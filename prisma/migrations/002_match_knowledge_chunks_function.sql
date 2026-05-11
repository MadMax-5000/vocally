-- Run this after 001_enable_pgvector.sql against your Supabase database.
-- Creates the RPC function used by lib/knowledge/vector-store.ts

CREATE OR REPLACE FUNCTION match_knowledge_chunks(
  query_embedding vector(1536),
  match_threshold double precision,
  match_count int,
  p_org_id text
)
RETURNS TABLE (
  chunkId text,
  knowledgeDocId text,
  content text,
  chunkIndex int,
  docTitle text,
  score double precision
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kc.id::text AS chunkId,
    kc."knowledgeDocId"::text,
    kc.content,
    kc."chunkIndex",
    kd.title AS docTitle,
    1 - (kc.embedding <=> query_embedding) AS score
  FROM "KnowledgeChunk" kc
  JOIN "KnowledgeDoc" kd ON kd.id = kc."knowledgeDocId"
  WHERE
    kd."orgId" = p_org_id::text
    AND kc.embedding IS NOT NULL
    AND 1 - (kc.embedding <=> query_embedding) >= match_threshold
  ORDER BY kc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
