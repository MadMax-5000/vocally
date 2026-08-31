import { describe, expect, it } from "vitest";

import {
  consumeOpenRouterSseBuffer,
  OpenRouterStreamAssembler,
  parseOpenRouterSseLine,
} from "@/lib/ai/llm";

describe("parseOpenRouterSseLine", () => {
  it("returns done for the terminator", () => {
    expect(parseOpenRouterSseLine("data: [DONE]")).toBe("done");
  });

  it("parses a JSON payload", () => {
    expect(parseOpenRouterSseLine('data: {"choices":[]}')).toEqual({
      choices: [],
    });
  });

  it("ignores comments and empty lines", () => {
    expect(parseOpenRouterSseLine("")).toBeNull();
    expect(parseOpenRouterSseLine(": keep-alive")).toBeNull();
    expect(parseOpenRouterSseLine("event: message")).toBeNull();
  });
});

describe("OpenRouterStreamAssembler", () => {
  it("concatenates content deltas", () => {
    const assembler = new OpenRouterStreamAssembler();
    expect(
      assembler.applyPayload({
        choices: [{ delta: { content: "Hel" } }],
      }),
    ).toBe("Hel");
    expect(
      assembler.applyPayload({
        choices: [{ delta: { content: "lo" }, finish_reason: "stop" }],
      }),
    ).toBe("lo");

    const result = assembler.toResult();
    expect(result.content).toBe("Hello");
    expect(result.finishReason).toBe("stop");
    expect(result.tool_calls).toBeUndefined();
  });

  it("assembles streamed tool calls by index", () => {
    const assembler = new OpenRouterStreamAssembler();
    assembler.applyPayload({
      choices: [
        {
          delta: {
            tool_calls: [
              {
                index: 0,
                id: "call_1",
                type: "function",
                function: { name: "list_available_slots", arguments: "" },
              },
            ],
          },
        },
      ],
    });
    assembler.applyPayload({
      choices: [
        {
          delta: {
            tool_calls: [
              { index: 0, function: { arguments: '{"date":"' } },
            ],
          },
        },
      ],
    });
    assembler.applyPayload({
      choices: [
        {
          delta: {
            tool_calls: [{ index: 0, function: { arguments: '2026-09-01"}' } }],
          },
          finish_reason: "tool_calls",
        },
      ],
    });

    const result = assembler.toResult();
    expect(result.tool_calls).toEqual([
      {
        id: "call_1",
        type: "function",
        function: {
          name: "list_available_slots",
          arguments: '{"date":"2026-09-01"}',
        },
      },
    ]);
    expect(result.finishReason).toBe("tool_calls");
  });
});

describe("consumeOpenRouterSseBuffer", () => {
  it("feeds complete lines and keeps a partial remainder", () => {
    const assembler = new OpenRouterStreamAssembler();
    const deltas: string[] = [];
    const rest = consumeOpenRouterSseBuffer(
      'data: {"choices":[{"delta":{"content":"Hi"}}]}\ndata: {"choices":[{"del',
      assembler,
      (text) => deltas.push(text),
    );

    expect(assembler.content).toBe("Hi");
    expect(deltas).toEqual(["Hi"]);
    expect(rest).toBe('data: {"choices":[{"del');
  });
});
