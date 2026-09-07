import { afterEach, describe, expect, it, vi } from "vitest";

import {
  decodeClerkFrontendApi,
  isClerkConfigured,
  isPlaceholderClerkFrontendApi,
  isUsableClerkPublishableKey,
  isUsableClerkSecretKey,
} from "../keys";

const EXAMPLE_PUBLISHABLE_KEY = "pk_test_Y2xlcmsuZXhhbXBsZS5jb20k";
const REAL_FRONTEND_API = "robust-mammal-1.clerk.accounts.dev";
const REAL_PUBLISHABLE_KEY = `pk_test_${Buffer.from(`${REAL_FRONTEND_API}$`).toString("base64")}`;
const REAL_SECRET_KEY = "sk_test_abcdefghijklmnopqrstuvwxyz123456";

describe("decodeClerkFrontendApi", () => {
  it("decodes the Clerk docs placeholder key to clerk.example.com", () => {
    expect(decodeClerkFrontendApi(EXAMPLE_PUBLISHABLE_KEY)).toBe("clerk.example.com");
  });

  it("decodes a development instance Frontend API", () => {
    expect(decodeClerkFrontendApi(REAL_PUBLISHABLE_KEY)).toBe(REAL_FRONTEND_API);
  });
});

describe("isPlaceholderClerkFrontendApi", () => {
  it("treats clerk.example.com as a placeholder", () => {
    expect(isPlaceholderClerkFrontendApi("clerk.example.com")).toBe(true);
    expect(isPlaceholderClerkFrontendApi("https://clerk.example.com")).toBe(true);
  });

  it("accepts real Clerk Frontend API hosts", () => {
    expect(isPlaceholderClerkFrontendApi(REAL_FRONTEND_API)).toBe(false);
  });
});

describe("isUsableClerkPublishableKey", () => {
  it("rejects missing, malformed, and placeholder keys", () => {
    expect(isUsableClerkPublishableKey(undefined)).toBe(false);
    expect(isUsableClerkPublishableKey("")).toBe(false);
    expect(isUsableClerkPublishableKey("not-a-key")).toBe(false);
    expect(isUsableClerkPublishableKey("sk_test_abcdefghijklmnopqrstuvwxyz123456")).toBe(false);
    expect(isUsableClerkPublishableKey(EXAMPLE_PUBLISHABLE_KEY)).toBe(false);
  });

  it("accepts a real-looking development publishable key", () => {
    expect(isUsableClerkPublishableKey(REAL_PUBLISHABLE_KEY)).toBe(true);
  });
});

describe("isUsableClerkSecretKey", () => {
  it("rejects missing and example secrets", () => {
    expect(isUsableClerkSecretKey(undefined)).toBe(false);
    expect(isUsableClerkSecretKey("sk_test_example")).toBe(false);
    expect(isUsableClerkSecretKey(REAL_SECRET_KEY)).toBe(true);
  });
});

describe("isClerkConfigured", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is false for the clerk.example.com placeholder pair", () => {
    expect(
      isClerkConfigured({
        publishableKey: EXAMPLE_PUBLISHABLE_KEY,
        secretKey: REAL_SECRET_KEY,
        requireSecret: true,
      }),
    ).toBe(false);
  });

  it("is true when both keys look like a real Clerk instance", () => {
    expect(
      isClerkConfigured({
        publishableKey: REAL_PUBLISHABLE_KEY,
        secretKey: REAL_SECRET_KEY,
        requireSecret: true,
      }),
    ).toBe(true);
  });

  it("does not require the secret key when requireSecret is false", () => {
    expect(
      isClerkConfigured({
        publishableKey: REAL_PUBLISHABLE_KEY,
        secretKey: undefined,
        requireSecret: false,
      }),
    ).toBe(true);
  });

  it("reads process.env when no keys are passed", () => {
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", EXAMPLE_PUBLISHABLE_KEY);
    vi.stubEnv("CLERK_SECRET_KEY", REAL_SECRET_KEY);
    expect(isClerkConfigured({ requireSecret: true })).toBe(false);
  });
});
