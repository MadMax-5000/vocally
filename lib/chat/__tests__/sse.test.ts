import { describe, expect, it } from "vitest";

import { encodeChatSse, pullChatSseEvents } from "@/lib/chat/sse";
import type { ChatStreamEvent } from "@/lib/chat/stream-events";

describe("chat SSE framing", () => {
  it("round-trips events and keeps a partial remainder", () => {
    const events: ChatStreamEvent[] = [
      {
        type: "meta",
        sessionId: "s1",
        userMessage: {
          id: "u1",
          role: "USER",
          content: "Hi",
          createdAt: "2026-08-31T00:00:00.000Z",
        },
      },
      { type: "delta", text: "Hello" },
      {
        type: "done",
        message: {
          id: "b1",
          role: "BOT",
          content: "Hello",
          createdAt: "2026-08-31T00:00:01.000Z",
        },
      },
    ];

    const payload = events.map(encodeChatSse).join("") + 'data: {"type":"sugg';
    const pulled = pullChatSseEvents(payload);

    expect(pulled.events).toEqual(events);
    expect(pulled.rest).toBe('data: {"type":"sugg');
  });
});
