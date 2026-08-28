import { prisma } from "@/lib/db/prisma";
import { CONVERSATION_RETENTION_DAYS } from "./constants";

export function isRetentionDays(
  value: number | null | undefined,
): value is (typeof CONVERSATION_RETENTION_DAYS)[number] {
  return (
    value === 7 || value === 30 || value === 90 || value === 365
  );
}

async function deleteSessionsByIds(sessionIds: string[]): Promise<number> {
  if (sessionIds.length === 0) return 0;

  await prisma.message.deleteMany({ where: { sessionId: { in: sessionIds } } });
  await prisma.toolExecutionLog.deleteMany({
    where: { sessionId: { in: sessionIds } },
  });
  await prisma.vapiCallMetadata.deleteMany({
    where: { sessionId: { in: sessionIds } },
  });
  await prisma.callLog.deleteMany({ where: { sessionId: { in: sessionIds } } });
  await prisma.ticket.updateMany({
    where: { sessionId: { in: sessionIds } },
    data: { sessionId: null },
  });
  await prisma.agentLead.updateMany({
    where: { sessionId: { in: sessionIds } },
    data: { sessionId: null },
  });
  await prisma.formSubmission.updateMany({
    where: { sessionId: { in: sessionIds } },
    data: { sessionId: null },
  });

  const deleted = await prisma.session.deleteMany({
    where: { id: { in: sessionIds } },
  });
  return deleted.count;
}

export async function purgeExpiredSessionsForAgent(
  agentId: string,
  retentionDays: number,
): Promise<number> {
  if (!isRetentionDays(retentionDays)) return 0;

  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
  const expired = await prisma.session.findMany({
    where: { agentId, createdAt: { lt: cutoff } },
    select: { id: true },
    take: 500,
  });

  return deleteSessionsByIds(expired.map((row) => row.id));
}

export async function purgeExpiredConversations(): Promise<{
  purged: number;
  agents: number;
}> {
  const agents = await prisma.agent.findMany({
    where: { conversationRetentionDays: { not: null } },
    select: { id: true, conversationRetentionDays: true },
  });

  let purged = 0;
  for (const agent of agents) {
    if (agent.conversationRetentionDays == null) continue;
    purged += await purgeExpiredSessionsForAgent(
      agent.id,
      agent.conversationRetentionDays,
    );
  }

  return { purged, agents: agents.length };
}
