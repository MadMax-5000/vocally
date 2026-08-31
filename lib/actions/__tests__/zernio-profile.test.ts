import { beforeEach, describe, expect, it, vi } from "vitest";

const mockOrgFindUnique = vi.fn();
const mockOrgUpdate = vi.fn();
const mockCreateZernioProfile = vi.fn();
const mockListZernioProfiles = vi.fn();

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    organization: {
      findUnique: (...args: unknown[]) => mockOrgFindUnique(...args),
      update: (...args: unknown[]) => mockOrgUpdate(...args),
    },
  },
}));

vi.mock("@/lib/server/organization", () => ({
  getOrgPrismaId: vi.fn(),
  getOrgPlan: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/zernio/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/zernio/client")>();
  return {
    ...actual,
    createZernioProfile: (...args: unknown[]) => mockCreateZernioProfile(...args),
    listZernioProfiles: (...args: unknown[]) => mockListZernioProfiles(...args),
  };
});

import { ZernioError } from "@/lib/zernio/client";
import { getOrCreateZernioProfile } from "@/lib/actions/zernio";

describe("getOrCreateZernioProfile", () => {
  const orgId = "org_abc123";

  beforeEach(() => {
    vi.clearAllMocks();
    mockOrgUpdate.mockResolvedValue({});
  });

  it("returns the stored profile id without calling Zernio", async () => {
    mockOrgFindUnique.mockResolvedValue({
      zernioProfileId: "existing-profile",
      name: "Acme",
    });

    const id = await getOrCreateZernioProfile(orgId);

    expect(id).toBe("existing-profile");
    expect(mockCreateZernioProfile).not.toHaveBeenCalled();
    expect(mockOrgUpdate).not.toHaveBeenCalled();
  });

  it("creates a profile and persists the id", async () => {
    mockOrgFindUnique.mockResolvedValue({
      zernioProfileId: null,
      name: "Acme",
    });
    mockCreateZernioProfile.mockResolvedValue({
      _id: "new-profile",
      name: `org_${orgId}`,
    });

    const id = await getOrCreateZernioProfile(orgId);

    expect(id).toBe("new-profile");
    expect(mockCreateZernioProfile).toHaveBeenCalledWith(`org_${orgId}`, "Acme");
    expect(mockOrgUpdate).toHaveBeenCalledWith({
      where: { id: orgId },
      data: { zernioProfileId: "new-profile" },
    });
  });

  it("recovers existingProfileId from a 409 and persists it", async () => {
    mockOrgFindUnique.mockResolvedValue({
      zernioProfileId: null,
      name: "Acme",
    });
    mockCreateZernioProfile.mockRejectedValue(
      new ZernioError("A profile with this name already exists", 409, "profile_name_conflict", {
        existingProfileId: "recovered-profile",
      }),
    );

    const id = await getOrCreateZernioProfile(orgId);

    expect(id).toBe("recovered-profile");
    expect(mockListZernioProfiles).not.toHaveBeenCalled();
    expect(mockOrgUpdate).toHaveBeenCalledWith({
      where: { id: orgId },
      data: { zernioProfileId: "recovered-profile" },
    });
  });

  it("falls back to listing profiles by name when 409 has no existingProfileId", async () => {
    mockOrgFindUnique.mockResolvedValue({
      zernioProfileId: null,
      name: "Acme",
    });
    mockCreateZernioProfile.mockRejectedValue(
      new ZernioError("A profile with this name already exists", 409, "profile_name_conflict"),
    );
    mockListZernioProfiles.mockResolvedValue([
      { _id: "listed-profile", name: `org_${orgId}` },
    ]);

    const id = await getOrCreateZernioProfile(orgId);

    expect(id).toBe("listed-profile");
    expect(mockListZernioProfiles).toHaveBeenCalledWith(`org_${orgId}`);
    expect(mockOrgUpdate).toHaveBeenCalledWith({
      where: { id: orgId },
      data: { zernioProfileId: "listed-profile" },
    });
  });

  it("rethrows when a 409 cannot be recovered", async () => {
    mockOrgFindUnique.mockResolvedValue({
      zernioProfileId: null,
      name: "Acme",
    });
    const conflict = new ZernioError(
      "A profile with this name already exists",
      409,
      "profile_name_conflict",
    );
    mockCreateZernioProfile.mockRejectedValue(conflict);
    mockListZernioProfiles.mockResolvedValue([]);

    await expect(getOrCreateZernioProfile(orgId)).rejects.toBe(conflict);
    expect(mockOrgUpdate).not.toHaveBeenCalled();
  });
});
