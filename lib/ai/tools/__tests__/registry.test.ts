import { describe, expect, it } from "vitest";

import { REQUEST_SECURE_INPUT } from "@/lib/ai/tools/definitions";
import {
  getAllToolDefinitions,
  getToolDefinitionsForAgent,
} from "@/lib/ai/tools/registry";

function toolNames(tools: { function: { name: string } }[]): string[] {
  return tools.map((t) => t.function.name);
}

describe("getToolDefinitionsForAgent", () => {
  it("does not include request_secure_input by default", () => {
    expect(toolNames(getToolDefinitionsForAgent())).not.toContain(
      "request_secure_input",
    );
    expect(toolNames(getAllToolDefinitions())).not.toContain(
      "request_secure_input",
    );
  });

  it("includes request_secure_input only when includeSecureInput is true", () => {
    expect(
      toolNames(getToolDefinitionsForAgent({ includeSecureInput: true })),
    ).toContain("request_secure_input");
    expect(
      toolNames(getToolDefinitionsForAgent({ includeSecureInput: false })),
    ).not.toContain("request_secure_input");
  });

  it("does not include mock tools (check_order_status / lookup_account) by default", () => {
    expect(toolNames(getToolDefinitionsForAgent())).not.toContain("check_order_status");
    expect(toolNames(getToolDefinitionsForAgent())).not.toContain("lookup_account");
    expect(toolNames(getAllToolDefinitions())).not.toContain("check_order_status");
    expect(toolNames(getAllToolDefinitions())).not.toContain("lookup_account");
  });

  it("includes mock tools only when includeMockTooling is true", () => {
    expect(toolNames(getToolDefinitionsForAgent({ includeMockTooling: true }))).toContain("check_order_status");
    expect(toolNames(getToolDefinitionsForAgent({ includeMockTooling: true }))).toContain("lookup_account");
    expect(toolNames(getToolDefinitionsForAgent({ includeMockTooling: false }))).not.toContain("check_order_status");
  });
});

describe("chat prompt vs DTMF tool", () => {
  it("keeps press # out of the default tool list used by chat prompts", () => {
    const descriptions = getAllToolDefinitions()
      .map((t) => t.function.description)
      .join("\n");
    expect(descriptions).not.toContain("press #");
    expect(REQUEST_SECURE_INPUT.function.description).toContain("press #");
  });
});
