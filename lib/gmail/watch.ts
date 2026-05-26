import { prisma } from "@/lib/db/prisma";
import { parseLabelIds } from "@/lib/deploy/email-channel-config";

import { getGmailClientForAgent } from "./client";
import { getPubSubTopic } from "./oauth";

export type WatchResult = {
  historyId: string;
  expiration: Date;
};

export async function startGmailWatch(
  agentId: string,
  orgId: string,
  labelIds?: string[],
): Promise<WatchResult> {
  const { gmail, connection } = await getGmailClientForAgent(agentId, orgId);
  const labels = labelIds ?? parseLabelIds(connection.labelIds);
  const topicName = getPubSubTopic();

  const res = await gmail.users.watch({
    userId: "me",
    requestBody: {
      topicName,
      labelIds: labels,
      labelFilterBehavior: "INCLUDE",
    },
  });

  const historyId = res.data.historyId;
  const expirationMs = res.data.expiration ? Number(res.data.expiration) : Date.now() + 7 * 86400000;

  if (!historyId) {
    throw new Error("Gmail watch did not return historyId");
  }

  const expiration = new Date(expirationMs);

  await prisma.gmailConnection.update({
    where: { id: connection.id },
    data: {
      historyId,
      watchExpiration: expiration,
      ...(labelIds ? { labelIds } : {}),
    },
  });

  return { historyId, expiration };
}

export async function stopGmailWatch(agentId: string, orgId: string): Promise<void> {
  try {
    const { gmail } = await getGmailClientForAgent(agentId, orgId);
    await gmail.users.stop({ userId: "me" });
  } catch {
    /* connection may already be removed */
  }
}

export async function renewExpiringWatches(withinHours = 48): Promise<{ renewed: number; failed: number }> {
  const cutoff = new Date(Date.now() + withinHours * 60 * 60 * 1000);
  const connections = await prisma.gmailConnection.findMany({
    where: {
      OR: [{ watchExpiration: null }, { watchExpiration: { lte: cutoff } }],
    },
    select: { agentId: true, orgId: true },
  });

  let renewed = 0;
  let failed = 0;

  for (const { agentId, orgId } of connections) {
    try {
      await startGmailWatch(agentId, orgId);
      renewed += 1;
    } catch {
      failed += 1;
    }
  }

  return { renewed, failed };
}
