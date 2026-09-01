import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mockAgentFindUnique = vi.fn();
const mockOrgFindUnique = vi.fn();
const mockZernioUpsert = vi.fn();
const mockLogServerError = vi.fn();

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    agent: {
      findUnique: (...args: unknown[]) => mockAgentFindUnique(...args),
    },
    organization: {
      findUnique: (...args: unknown[]) => mockOrgFindUnique(...args),
    },
    zernioChannel: {
      upsert: (...args: unknown[]) => mockZernioUpsert(...args),
    },
  },
}));

vi.mock("@/lib/logger", () => ({
  logServerError: (...args: unknown[]) => mockLogServerError(...args),
}));

import { GET } from "@/app/api/connect/callback/route";

function callbackRequest(query: string, cookie = "NEXT_LOCALE=fr") {
  return new NextRequest(`https://anselio.com/api/connect/callback?${query}`, {
    headers: {
      cookie,
      host: "anselio.com",
      "x-forwarded-proto": "https",
    },
  });
}

describe("GET /api/connect/callback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://anselio.com");
    vi.stubEnv("NODE_ENV", "production");
    mockAgentFindUnique.mockResolvedValue({ orgId: "org-1" });
    mockOrgFindUnique.mockResolvedValue({ plan: "STARTER" });
    mockZernioUpsert.mockResolvedValue({ id: "ch-1" });
  });

  it("redirects uppercase channel params to the locale-prefixed deploy path", async () => {
    const res = await GET(
      callbackRequest(
        "agentId=agent-1&channel=WHATSAPP&connected=whatsapp&accountId=acc-1",
      ),
    );

    expect(res.status).toBeGreaterThanOrEqual(300);
    expect(res.status).toBeLessThan(400);
    expect(res.headers.get("location")).toBe(
      "https://anselio.com/fr/dashboard/agents/agent-1/deploy/whatsapp",
    );
    expect(mockZernioUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ channelType: "WHATSAPP" }),
      }),
    );
  });

  it("accepts lowercase platform names for channel and connected", async () => {
    const res = await GET(
      callbackRequest(
        "agentId=agent-1&channel=whatsapp&connected=whatsapp&accountId=acc-1&username=shop",
      ),
    );

    expect(res.headers.get("location")).toBe(
      "https://anselio.com/fr/dashboard/agents/agent-1/deploy/whatsapp",
    );
    expect(mockZernioUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ channelType: "WHATSAPP" }),
      }),
    );
  });

  it("maps facebook connected platform to messenger deploy", async () => {
    const res = await GET(
      callbackRequest("agentId=agent-1&connected=facebook&accountId=acc-1"),
    );

    expect(res.headers.get("location")).toBe(
      "https://anselio.com/fr/dashboard/agents/agent-1/deploy/messenger",
    );
    expect(mockZernioUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ channelType: "MESSENGER" }),
      }),
    );
  });

  it("prefers locale=en query over the fr cookie default", async () => {
    const res = await GET(
      callbackRequest(
        "agentId=agent-1&channel=WHATSAPP&connected=whatsapp&accountId=acc-1&locale=en",
      ),
    );

    expect(res.headers.get("location")).toBe(
      "https://anselio.com/en/dashboard/agents/agent-1/deploy/whatsapp",
    );
  });

  it("redirects with error query on Prisma upsert failure instead of 500", async () => {
    mockZernioUpsert.mockRejectedValue(new Error("db down"));

    const res = await GET(
      callbackRequest(
        "agentId=agent-1&channel=INSTAGRAM&connected=instagram&accountId=acc-1&locale=en",
      ),
    );

    expect(res.status).not.toBe(500);
    expect(res.status).toBeGreaterThanOrEqual(300);
    expect(res.status).toBeLessThan(400);
    expect(res.headers.get("location")).toBe(
      "https://anselio.com/en/dashboard/agents/agent-1/deploy/instagram?error=connection_failed",
    );
    expect(mockLogServerError).toHaveBeenCalledWith(
      "zernio_oauth_callback_failed",
      expect.objectContaining({ agentId: "agent-1", channel: "INSTAGRAM" }),
    );
  });
});
