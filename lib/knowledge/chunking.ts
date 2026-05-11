export type TextChunk = {
  content: string;
  chunkIndex: number;
  tokenCount: number;
};

const TARGET_TOKENS = 512;
const OVERLAP_TOKENS = 128;
const CHARS_PER_TOKEN = 4;

function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

function splitIntoParagraphs(text: string): string[] {
  const raw = text.split(/\n\s*\n/);
  return raw.map((p) => p.trim()).filter(Boolean);
}

export function chunkText(text: string): TextChunk[] {
  const paragraphs = splitIntoParagraphs(text);
  if (paragraphs.length === 0) return [];

  const chunks: TextChunk[] = [];
  let current: string[] = [];
  let currentTokens = 0;

  for (const para of paragraphs) {
    const paraTokens = estimateTokens(para);

    if (currentTokens + paraTokens <= TARGET_TOKENS) {
      current.push(para);
      currentTokens += paraTokens;
    } else {
      if (current.length > 0) {
        chunks.push({
          content: current.join("\n\n"),
          chunkIndex: chunks.length,
          tokenCount: estimateTokens(current.join("\n\n")),
        });
      }

      current = [para];
      currentTokens = paraTokens;
    }
  }

  if (current.length > 0) {
    chunks.push({
      content: current.join("\n\n"),
      chunkIndex: chunks.length,
      tokenCount: estimateTokens(current.join("\n\n")),
    });
  }

  if (chunks.length <= 1) return chunks;

  const overlapped: TextChunk[] = [];
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    overlapped.push(chunk);

    if (i < chunks.length - 1) {
      const nextChunkLines = chunks[i + 1].content.split("\n\n");
      const carryOver: string[] = [];
      let carryTokens = 0;

      for (const line of nextChunkLines) {
        const lineTokens = estimateTokens(line);
        if (carryTokens + lineTokens <= OVERLAP_TOKENS) {
          carryOver.push(line);
          carryTokens += lineTokens;
        } else {
          break;
        }
      }

      if (carryOver.length > 0) {
        overlapped[overlapped.length - 1] = {
          ...chunk,
          content: chunk.content + "\n\n" + carryOver.join("\n\n"),
          tokenCount: estimateTokens(chunk.content + "\n\n" + carryOver.join("\n\n")),
        };
      }
    }
  }

  return overlapped;
}
