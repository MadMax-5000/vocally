import type { ChatStreamEvent } from "@/lib/chat/stream-events";

export function encodeChatSse(event: ChatStreamEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export function pullChatSseEvents(buffer: string): {
  events: ChatStreamEvent[];
  rest: string;
} {
  const events: ChatStreamEvent[] = [];
  const parts = buffer.split("\n\n");
  const rest = parts.pop() ?? "";

  for (const block of parts) {
    for (const line of block.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const parsed = JSON.parse(payload) as ChatStreamEvent;
        if (parsed && typeof parsed === "object" && "type" in parsed) {
          events.push(parsed);
        }
      } catch {
        // skip malformed frames
      }
    }
  }

  return { events, rest };
}
