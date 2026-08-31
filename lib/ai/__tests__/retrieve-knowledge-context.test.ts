import { describe, expect, it, vi, beforeEach } from "vitest";

import { generateEmbedding } from "@/lib/ai/embeddings";
import { retrieveKnowledgeContext } from "@/lib/ai/retrieve-knowledge-context";
import { similaritySearch } from "@/lib/knowledge/vector-store";

vi.mock("@/lib/ai/embeddings", () => ({
  generateEmbedding: vi.fn(),
}));

vi.mock("@/lib/knowledge/vector-store", () => ({
  similaritySearch: vi.fn(),
}));

describe("retrieveKnowledgeContext", () => {
  beforeEach(() => {
    vi.mocked(generateEmbedding).mockReset();
    vi.mocked(similaritySearch).mockReset();
  });

  it("skips embedding when no docs are attached", async () => {
    const ctx = await retrieveKnowledgeContext("hello", "org_1", []);

    expect(ctx).toBe("");
    expect(generateEmbedding).not.toHaveBeenCalled();
    expect(similaritySearch).not.toHaveBeenCalled();
  });

  it("embeds and searches when docs are attached", async () => {
    vi.mocked(generateEmbedding).mockResolvedValue({
      embedding: [0.1, 0.2],
      tokenCount: 2,
    });
    vi.mocked(similaritySearch).mockResolvedValue([
      {
        chunkId: "c1",
        knowledgeDocId: "d1",
        content: "Hours are 9 to 5.",
        chunkIndex: 0,
        docTitle: "FAQ",
        score: 0.9,
      },
    ]);

    const ctx = await retrieveKnowledgeContext("hours", "org_1", ["doc_1"]);

    expect(generateEmbedding).toHaveBeenCalledWith("hours");
    expect(ctx).toContain("Hours are 9 to 5.");
  });
});
