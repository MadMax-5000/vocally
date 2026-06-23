import { describe, expect, it } from "vitest";

import {
  getVisibleCustomButtons,
  parseCustomButtonActionConfig,
  resolveCustomButtonAction,
} from "@/lib/deploy/custom-button-action";

describe("custom-button-action", () => {
  it("parses enabled flag and valid buttons", () => {
    const parsed = parseCustomButtonActionConfig({
      enabled: true,
      buttons: [
        { label: "Docs", kind: "link", href: "https://docs.example.com" },
        { label: "Pricing", kind: "message", message: "What are your prices?" },
      ],
    });

    expect(parsed.enabled).toBe(true);
    expect(parsed.buttons).toHaveLength(2);
    expect(parsed.buttons?.[0]).toEqual({
      label: "Docs",
      kind: "link",
      href: "https://docs.example.com",
      openInNewTab: true,
    });
    expect(parsed.buttons?.[1]?.kind).toBe("message");
  });

  it("accepts legacy type field and rejects non-https links", () => {
    const parsed = parseCustomButtonActionConfig({
      buttons: [
        { label: "Bad", type: "link", href: "http://insecure.example.com" },
        { label: "Ok", type: "url", href: "https://secure.example.com", openInNewTab: false },
      ],
    });

    expect(parsed.buttons).toHaveLength(1);
    expect(parsed.buttons?.[0]?.href).toBe("https://secure.example.com");
    expect(parsed.buttons?.[0]?.openInNewTab).toBe(false);
  });

  it("caps buttons at 8", () => {
    const buttons = Array.from({ length: 10 }, (_, i) => ({
      label: `Btn ${i}`,
      kind: "message" as const,
      message: `Msg ${i}`,
    }));
    const parsed = parseCustomButtonActionConfig({ buttons });
    expect(parsed.buttons).toHaveLength(8);
  });

  it("resolves from WEB_CHAT channel config", () => {
    const resolved = resolveCustomButtonAction([
      {
        channel: "WEB_CHAT",
        enabled: true,
        config: {
          actions: {
            customButtons: {
              enabled: true,
              buttons: [{ label: "Help", kind: "message", message: "I need help" }],
            },
          },
        },
      },
    ]);

    expect(resolved.enabled).toBe(true);
    expect(resolved.buttons).toHaveLength(1);
  });

  it("returns empty when disabled via getVisibleCustomButtons", () => {
    expect(
      getVisibleCustomButtons({
        enabled: false,
        buttons: [{ label: "X", kind: "message", message: "Hi" }],
      }),
    ).toEqual([]);

    expect(
      getVisibleCustomButtons({
        enabled: true,
        buttons: [
          { label: "Go", kind: "link", href: "https://example.com" },
          { label: "", kind: "message", message: "Hi" },
        ],
      }),
    ).toHaveLength(1);
  });
});
