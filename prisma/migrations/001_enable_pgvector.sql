-- Run against Supabase (SQL editor), psql, or:
--   npx prisma db execute --schema prisma/schema.prisma --file prisma/migrations/001_enable_pgvector.sql
-- For new databases, `KnowledgeChunk.embedding` is also declared in schema.prisma as Unsupported("vector(1536)")
-- so `prisma db push` can create the column; this script remains useful for existing DBs and for the pgvector extension / index.

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
