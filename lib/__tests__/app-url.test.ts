import { afterEach, describe, expect, it, vi } from "vitest";

import { BRAND_URL } from "@/lib/constants/brand";

import {
  getAppOrigin,
  getRequestOrigin,
  isLocalhostUrl,
  resolveRedirectUri,
} from "../app-url";

describe("isLocalhostUrl", () => {
  it("detects localhost and loopback hosts", () => {
    expect(isLocalhostUrl("http://localhost:3000")).toBe(true);
    expect(isLocalhostUrl("https://localhost:3000/dashboard")).toBe(true);
    expect(isLocalhostUrl("http://127.0.0.1:3000")).toBe(true);
    expect(isLocalhostUrl("https://anselio.com")).toBe(false);
  });
});

describe("getAppOrigin", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses NEXT_PUBLIC_APP_URL in development even when it is localhost", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("VERCEL_ENV", "");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
    expect(getAppOrigin()).toBe("http://localhost:3000");
  });

  it("ignores localhost NEXT_PUBLIC_APP_URL in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
    vi.stubEnv("VERCEL_URL", "");
    expect(getAppOrigin()).toBe(BRAND_URL);
  });

  it("uses the public production origin when configured", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://anselio.com/");
    expect(getAppOrigin()).toBe("https://anselio.com");
  });
});

describe("getRequestOrigin", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses forwarded host when it is not localhost", () => {
    vi.stubEnv("NODE_ENV", "production");
    const req = new Request("https://anselio.com/api/oauth/google/callback", {
      headers: {
        host: "anselio.com",
        "x-forwarded-proto": "https",
      },
    });
    expect(getRequestOrigin(req)).toBe("https://anselio.com");
  });

  it("does not return localhost in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
    vi.stubEnv("VERCEL_URL", "");
    const req = new Request("http://localhost:3000/api/connect/callback", {
      headers: {
        host: "localhost:3000",
        "x-forwarded-host": "localhost:3000",
        "x-forwarded-proto": "https",
      },
    });
    expect(getRequestOrigin(req)).toBe(BRAND_URL);
  });
});

describe("resolveRedirectUri", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("keeps an explicit localhost URI in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("VERCEL_ENV", "");
    expect(
      resolveRedirectUri(
        "http://localhost:3000/api/oauth/google/callback",
        "/api/oauth/google/callback",
      ),
    ).toBe("http://localhost:3000/api/oauth/google/callback");
  });

  it("replaces an explicit localhost URI in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://anselio.com");
    expect(
      resolveRedirectUri(
        "http://localhost:3000/api/oauth/google/callback",
        "/api/oauth/google/callback",
      ),
    ).toBe("https://anselio.com/api/oauth/google/callback");
  });
});
