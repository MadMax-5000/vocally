"use server";

import { prisma } from "@/lib/db/prisma";
import { getOrgPrismaId, getOrgPlan } from "@/lib/server/organization";
import { SOCIAL_CHANNELS_ENABLED } from "@/lib/billing/plan-features";
import { revalidatePath } from "next/cache";
import {
  listZernioAccounts,
  createZernioProfile,
  getZernioConnectUrl,
  listZernioProfiles,
  ZernioError,
} from "@/lib/zernio/client";

const PLATFORM_TO_CHANNEL: Record<string, string> = {
  instagram: "INSTAGRAM",
  facebook: "MESSENGER",
  whatsapp: "WHATSAPP",
};

function existingProfileIdFromError(err: ZernioError): string | undefined {
  const id = err.details?.existingProfileId;
  return typeof id === "string" && id.length > 0 ? id : undefined;
}

function mapZernioUserError(err: unknown): string {
  if (err instanceof ZernioError) {
    if (err.code === "PAYMENT_REQUIRED" || err.code === "account_limit_exceeded") {
      return "Zernio account limit reached — add a payment method in Zernio billing";
    }
    if (err.message === "ZERNIO_API_KEY not configured") {
      return "Social connection is not configured. Contact support.";
    }
    return err.message;
  }
  return err instanceof Error ? err.message : "Failed to initiate connection";
}

export async function getOrCreateZernioProfile(orgId: string): Promise<string | null> {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { zernioProfileId: true, name: true },
  });
  if (!org) return null;
  if (org.zernioProfileId) return org.zernioProfileId;

  const profileName = `org_${orgId}`;

  try {
    const profile = await createZernioProfile(profileName, org.name);
    await prisma.organization.update({
      where: { id: orgId },
      data: { zernioProfileId: profile._id },
    });
    return profile._id;
  } catch (err) {
    if (err instanceof ZernioError && err.status === 409) {
      const existingId =
        existingProfileIdFromError(err) ??
        (await listZernioProfiles(profileName))[0]?._id;
      if (existingId) {
        await prisma.organization.update({
          where: { id: orgId },
          data: { zernioProfileId: existingId },
        });
        return existingId;
      }
    }
    throw err;
  }
}

export async function initiateZernioOAuth(
  agentId: string,
  platform: "instagram" | "facebook" | "whatsapp",
) {
  try {
    const orgId = await getOrgPrismaId();
    if (!orgId) return { success: false as const, error: "Unauthorized" };

    const agent = await prisma.agent.findFirst({
      where: { id: agentId, orgId },
      select: { id: true },
    });
    if (!agent) return { success: false as const, error: "Agent not found" };

    const plan = await getOrgPlan();
    if (!plan || !SOCIAL_CHANNELS_ENABLED[plan as keyof typeof SOCIAL_CHANNELS_ENABLED]) {
      return { success: false as const, error: "Social channels are not available on your plan. Upgrade to continue." };
    }

    const profileId = await getOrCreateZernioProfile(orgId);
    if (!profileId) return { success: false as const, error: "Failed to create Zernio profile" };

    const channelType = PLATFORM_TO_CHANNEL[platform];
    if (!channelType) return { success: false as const, error: "Unsupported platform" };

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://anselio.com";
    const redirectUrl = `${baseUrl}/api/connect/callback?agentId=${agentId}&channel=${channelType}`;

    const { authUrl } = await getZernioConnectUrl(platform, profileId, redirectUrl);
    return { success: true as const, data: { authUrl } };
  } catch (err) {
    return { success: false as const, error: mapZernioUserError(err) };
  }
}

export async function saveZernioChannel(
  agentId: string,
  accountId: string,
  channelType: "INSTAGRAM" | "MESSENGER" | "WHATSAPP",
  platformUsername?: string,
) {
  const orgId = await getOrgPrismaId();
  if (!orgId) return { success: false, error: "Unauthorized" };

  const agent = await prisma.agent.findFirst({
    where: { id: agentId, orgId },
    select: { id: true },
  });
  if (!agent) return { success: false, error: "Agent not found" };

  await prisma.zernioChannel.upsert({
    where: { accountId },
    update: { agentId, orgId, channelType, platformUsername },
    create: { accountId, agentId, orgId, channelType, platformUsername },
  });

  revalidatePath(`/dashboard/agents/${agentId}/deploy/instagram`);
  revalidatePath(`/dashboard/agents/${agentId}/deploy/messenger`);
  revalidatePath(`/dashboard/agents/${agentId}/deploy/whatsapp`);
  return { success: true };
}

export async function getZernioChannelsForAgent(agentId: string) {
  const orgId = await getOrgPrismaId();
  if (!orgId) return { success: false as const, error: "Unauthorized" };

  const channels = await prisma.zernioChannel.findMany({
    where: { agentId, orgId },
    select: { accountId: true, channelType: true, platformUsername: true, connectedAt: true },
  });

  return { success: true as const, data: channels };
}

export async function getAvailableZernioAccounts(
  platform: "instagram" | "facebook" | "whatsapp",
) {
  try {
    const accounts = await listZernioAccounts(platform);
    return { success: true as const, data: accounts };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch accounts";
    return { success: false as const, error: message };
  }
}

export async function removeZernioChannel(agentId: string, accountId: string) {
  const orgId = await getOrgPrismaId();
  if (!orgId) return { success: false as const, error: "Unauthorized" };

  await prisma.zernioChannel.deleteMany({
    where: { accountId, agentId, orgId },
  });

  revalidatePath(`/dashboard/agents/${agentId}/deploy/instagram`);
  revalidatePath(`/dashboard/agents/${agentId}/deploy/messenger`);
  revalidatePath(`/dashboard/agents/${agentId}/deploy/whatsapp`);
  return { success: true as const };
}

export async function checkSocialChannelsEnabled(): Promise<{ enabled: boolean; plan: string | null }> {
  const plan = await getOrgPlan();
  if (!plan) return { enabled: false, plan: null };
  return {
    enabled: SOCIAL_CHANNELS_ENABLED[plan as keyof typeof SOCIAL_CHANNELS_ENABLED] ?? false,
    plan,
  };
}
