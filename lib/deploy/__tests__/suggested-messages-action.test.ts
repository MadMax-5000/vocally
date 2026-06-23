import { describe, expect, it } from "vitest";

import {
  getInitialSuggestedMessages,
  mergeSuggestedMessagesForResponse,
  parseSuggestedMessagesActionConfig,
  resolveSuggestedMessagesAction,
  shouldShowSuggestedMessages,
} from "@/lib/deploy/suggested-messages-action";

describe("suggested-messages-action", () => {
  it("parses action config fields", () => {
    const parsed = parseSuggestedMessagesActionConfig({
      enabled: true,
      staticStarters: ["Pricing", "Book demo"],
      keepShowingAfterFirst: true,
      dynamicEnabled: true,
    });
    expect(parsed.enabled).toBe(true);
    expect(parsed.staticStarters).toEqual(["Pricing", "Book demo"]);
    expect(parsed.keepShowingAfterFirst).toBe(true);
    expect(parsed.dynamicEnabled).toBe(true);
  });

  it("resolves defaults when channel config is missing", () => {
    const resolved = resolveSuggestedMessagesAction([]);
    expect(resolved).toEqual({
      enabled: false,
      staticStarters: [],
      keepShowingAfterFirst: false,
      dynamicEnabled: false,
    });
  });

  it("returns initial static starters when enabled", () => {
    const action = {
      enabled: true,
      staticStarters: ["Hello"],
      keepShowingAfterFirst: false,
      dynamicEnabled: false,
    };
    expect(getInitialSuggestedMessages(action, ["Deploy fallback"])).toEqual([
      "Hello",
    ]);
    expect(getInitialSuggestedMessages(action, [])).toEqual(["Hello"]);
  });

  it("falls back to deploy static when action starters empty", () => {
    const action = {
      enabled: true,
      staticStarters: [],
      keepShowingAfterFirst: false,
      dynamicEnabled: false,
    };
    expect(getInitialSuggestedMessages(action, ["From deploy"])).toEqual([
      "From deploy",
    ]);
  });

  it("merges dynamic suggestions and optionally keeps static", () => {
    const action = {
      enabled: true,
      staticStarters: ["Pricing"],
      keepShowingAfterFirst: true,
      dynamicEnabled: true,
    };

    const merged = mergeSuggestedMessagesForResponse({
      action,
      deploymentStatic: [],
      userMessageCount: 2,
      dynamicSuggestions: ["Tell me more", "Contact sales"],
    });

    expect(merged).toEqual(["Pricing", "Tell me more", "Contact sales"]);
  });

  it("returns only dynamic when keep showing is off", () => {
    const action = {
      enabled: true,
      staticStarters: ["Pricing"],
      keepShowingAfterFirst: false,
      dynamicEnabled: true,
    };

    const merged = mergeSuggestedMessagesForResponse({
      action,
      deploymentStatic: [],
      userMessageCount: 1,
      dynamicSuggestions: ["Next step"],
    });

    expect(merged).toEqual(["Next step"]);
  });

  it("returns empty when disabled", () => {
    const merged = mergeSuggestedMessagesForResponse({
      action: {
        enabled: false,
        staticStarters: ["Hi"],
        keepShowingAfterFirst: true,
        dynamicEnabled: true,
      },
      deploymentStatic: ["Hi"],
      userMessageCount: 0,
      dynamicSuggestions: ["Dynamic"],
    });
    expect(merged).toEqual([]);
  });

  it("controls visibility with shouldShowSuggestedMessages", () => {
    expect(
      shouldShowSuggestedMessages({
        hasMessages: false,
        keepShowingAfterFirst: false,
        suggestionCount: 2,
      }),
    ).toBe(true);

    expect(
      shouldShowSuggestedMessages({
        hasMessages: true,
        keepShowingAfterFirst: false,
        suggestionCount: 2,
      }),
    ).toBe(false);

    expect(
      shouldShowSuggestedMessages({
        hasMessages: true,
        keepShowingAfterFirst: true,
        suggestionCount: 2,
      }),
    ).toBe(true);
  });
});
