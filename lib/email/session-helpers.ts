import { prisma } from "@/lib/db/prisma";

export async function findActiveEmailSession(
  orgId: string,
  customerId: string,
): Promise<string | null> {
  const session = await prisma.session.findFirst({
    where: {
      orgId,
      customerId,
      channel: "EMAIL",
      status: { in: ["ACTIVE", "WAITING", "BOT"] },
    },
    select: { id: true },
    orderBy: { createdAt: "desc" },
  });
  return session?.id ?? null;
}

export async function createEmailSession(
  orgId: string,
  agentId: string | null,
  customerId: string,
): Promise<string> {
  const session = await prisma.session.create({
    data: {
      orgId,
      agentId,
      channel: "EMAIL",
      status: "ACTIVE",
      customerId,
      language: "auto",
    },
  });
  return session.id;
}

export async function storeEmailMessage(
  sessionId: string,
  role: "USER" | "BOT",
  content: string,
): Promise<void> {
  await prisma.message.create({
    data: { sessionId, role, content },
  });
}

export async function resolveActiveEmailAgent(orgId: string): Promise<string | null> {
  const agent = await prisma.agent.findFirst({
    where: {
      orgId,
      status: "ACTIVE",
      channels: { some: { channel: "EMAIL", enabled: true } },
    },
    select: { id: true },
  });
  return agent?.id ?? null;
}
