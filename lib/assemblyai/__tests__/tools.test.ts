import { describe, expect, it } from "vitest";

import { CHECK_ORDER_STATUS } from "@/lib/ai/tools/definitions";
import {
  assemblyAiToolUrl,
  buildAssemblyAiHttpTools,
  SEARCH_KNOWLEDGE_TOOL_NAME,
  TRANSFER_TO_HUMAN_TOOL_NAME,
} from "@/lib/assemblyai/tools";

describe("buildAssemblyAiHttpTools", () => {
  const tools = buildAssemblyAiHttpTools({
    appOrigin: "https://anselio.com",
    agentId: "agent_1",
    bearerToken: "secret-token-value",
    definitions: [CHECK_ORDER_STATUS],
    includeSearchKnowledge: true,
    includeTransferToHuman: true,
  });

  it("puts search_knowledge first and transfer last", () => {
    expect(tools[0]?.name).toBe(SEARCH_KNOWLEDGE_TOOL_NAME);
    expect(tools[tools.length - 1]?.name).toBe(TRANSFER_TO_HUMAN_TOOL_NAME);
    expect(tools.map((t) => t.name)).toContain("check_order_status");
  });

  it("uses hold mode for transfer_to_human", () => {
    const transfer = tools.find((t) => t.name === TRANSFER_TO_HUMAN_TOOL_NAME);
    expect(transfer?.execution_mode).toBe("hold");
  });

  it("points each tool at the dispatcher URL with a bearer header", () => {
    const order = tools.find((t) => t.name === "check_order_status");
    expect(order?.http.url).toBe(
      assemblyAiToolUrl("https://anselio.com", "agent_1", "check_order_status"),
    );
    expect(order?.http.headers?.[0]).toEqual({
      name: "Authorization",
      value: "Bearer secret-token-value",
    });
  });
});
