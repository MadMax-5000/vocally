-- Run this against your Supabase database via SQL editor or psql.
-- Prisma cannot manage vector columns natively, so we add them manually.

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Add embedding column to KnowledgeChunk table (1536 dims for text-embedding-3-small)
ALTER TABLE "KnowledgeChunk" ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- 3. IVFFlat index for approximate cosine similarity search
--    lists=100 is reasonable for up to ~1M rows; tune based on actual data size.
CREATE INDEX IF NOT EXISTS idx_knowledgechunk_embedding
  ON "KnowledgeChunk"
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
