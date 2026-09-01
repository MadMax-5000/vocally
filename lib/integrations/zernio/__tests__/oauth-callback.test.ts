import { describe, expect, it } from "vitest";

import {
  agentDetailPath,
  agentsListPath,
  normalizeZernioChannel,
  resolveCallbackLocale,
  socialDeployPath,
  zernioDeploySlug,
} from "../oauth-callback";

describe("normalizeZernioChannel", () => {
  it("maps lowercase platform names", () => {
    expect(normalizeZernioChannel("whatsapp")).toBe("WHATSAPP");
    expect(normalizeZernioChannel("instagram")).toBe("INSTAGRAM");
    expect(normalizeZernioChannel("facebook")).toBe("MESSENGER");
    expect(normalizeZernioChannel("messenger")).toBe("MESSENGER");
  });

  it("maps uppercase Prisma channel names", () => {
    expect(normalizeZernioChannel("WHATSAPP")).toBe("WHATSAPP");
    expect(normalizeZernioChannel("INSTAGRAM")).toBe("INSTAGRAM");
    expect(normalizeZernioChannel("MESSENGER")).toBe("MESSENGER");
  });

  it("returns null for unknown values", () => {
    expect(normalizeZernioChannel(null)).toBeNull();
    expect(normalizeZernioChannel("true")).toBeNull();
    expect(normalizeZernioChannel("twitter")).toBeNull();
  });
});

describe("resolveCallbackLocale", () => {
  it("prefers a valid query locale over the cookie default", () => {
    expect(resolveCallbackLocale("en", "fr")).toBe("en");
  });

  it("falls back to the cookie locale when query is missing or invalid", () => {
    expect(resolveCallbackLocale(null, "ar")).toBe("ar");
    expect(resolveCallbackLocale("de", "fr")).toBe("fr");
  });
});

describe("oauth callback paths", () => {
  it("builds locale-prefixed deploy and list paths", () => {
    expect(socialDeployPath("en", "agent-1", zernioDeploySlug("WHATSAPP"))).toBe(
      "/en/dashboard/agents/agent-1/deploy/whatsapp",
    );
    expect(socialDeployPath("fr", "agent-1", "instagram", "connection_failed")).toBe(
      "/fr/dashboard/agents/agent-1/deploy/instagram?error=connection_failed",
    );
    expect(agentsListPath("en", "Missing OAuth parameters")).toBe(
      "/en/dashboard/agents?error=Missing%20OAuth%20parameters",
    );
    expect(agentDetailPath("ar", "agent-1")).toBe("/ar/dashboard/agents/agent-1");
  });
});
