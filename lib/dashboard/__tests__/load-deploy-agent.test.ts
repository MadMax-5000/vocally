import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetAIAgentById = vi.fn();
const mockGetLocale = vi.fn();
const mockRedirect = vi.fn();
const mockNotFound = vi.fn();

vi.mock("@/lib/actions/agents", () => ({
  getAIAgentById: (...args: unknown[]) => mockGetAIAgentById(...args),
}));

vi.mock("next-intl/server", () => ({
  getLocale: (...args: unknown[]) => mockGetLocale(...args),
}));

vi.mock("@/i18n/routing", () => ({
  redirect: (...args: unknown[]) => mockRedirect(...args),
}));

vi.mock("next/navigation", () => ({
  notFound: (...args: unknown[]) => mockNotFound(...args),
}));

import { loadDeployAgent } from "../load-deploy-agent";

describe("loadDeployAgent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetLocale.mockResolvedValue("fr");
    mockRedirect.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });
    mockNotFound.mockImplementation(() => {
      throw new Error("NEXT_NOT_FOUND");
    });
  });

  it("returns the agent when the lookup succeeds", async () => {
    const agent = { id: "agent-1", name: "Bot" };
    mockGetAIAgentById.mockResolvedValue({ success: true, data: agent });

    await expect(loadDeployAgent("agent-1")).resolves.toBe(agent);
    expect(mockRedirect).not.toHaveBeenCalled();
    expect(mockNotFound).not.toHaveBeenCalled();
  });

  it("redirects unauthorized users to onboarding", async () => {
    mockGetAIAgentById.mockResolvedValue({
      success: false,
      error: "Unauthorized",
      code: "UNAUTHORIZED",
    });

    await expect(loadDeployAgent("agent-1")).rejects.toThrow("NEXT_REDIRECT");
    expect(mockRedirect).toHaveBeenCalledWith({ href: "/onboarding", locale: "fr" });
    expect(mockNotFound).not.toHaveBeenCalled();
  });

  it("calls notFound for a missing agent instead of throwing a generic error", async () => {
    mockGetAIAgentById.mockResolvedValue({
      success: false,
      error: "Agent not found",
      code: "NOT_FOUND",
    });

    await expect(loadDeployAgent("missing")).rejects.toThrow("NEXT_NOT_FOUND");
    expect(mockNotFound).toHaveBeenCalled();
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("calls notFound for other load failures instead of throwing", async () => {
    mockGetAIAgentById.mockResolvedValue({
      success: false,
      error: "Failed to fetch agent",
      code: "DB_ERROR",
    });

    await expect(loadDeployAgent("agent-1")).rejects.toThrow("NEXT_NOT_FOUND");
    expect(mockNotFound).toHaveBeenCalled();
  });
});
