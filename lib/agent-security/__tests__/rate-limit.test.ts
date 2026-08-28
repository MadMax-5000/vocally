import { afterEach, describe, expect, it } from "vitest";

import {
  consumeChatRateLimit,
  resetChatRateLimitForTests,
} from "@/lib/agent-security/rate-limit";

describe("consumeChatRateLimit", () => {
  afterEach(() => {
    resetChatRateLimitForTests();
  });

  it("allows traffic under the cap and blocks once exceeded", () => {
    expect(consumeChatRateLimit("a:1", 2, 1_000)).toBe(true);
    expect(consumeChatRateLimit("a:1", 2, 2_000)).toBe(true);
    expect(consumeChatRateLimit("a:1", 2, 3_000)).toBe(false);
  });

  it("isolates keys and expires hits after a minute", () => {
    expect(consumeChatRateLimit("a:1", 1, 1_000)).toBe(true);
    expect(consumeChatRateLimit("a:2", 1, 1_000)).toBe(true);
    expect(consumeChatRateLimit("a:1", 1, 61_001)).toBe(true);
  });
});
