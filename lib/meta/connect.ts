import { Prisma } from "@prisma/client";
import crypto from "crypto";

import { encryptToken } from "@/lib/crypto/token-encryption";
import { prisma } from "@/lib/db/prisma";

import { graphUrl } from "./graph";
import { exchangeCodeForUserAccessToken } from "./oauth";

type MetaPageRow = {
  id: string;
  name: string;
  access_token?: string;
  tasks?: string[];
};

async function listManagedPages(userAccessToken: string): Promise<MetaPageRow[]> {
  const params = new URLSearchParams({
    fields: "id,name,access_token,tasks",
    access_token: userAccessToken,
    limit: "200",
  });
  const res = await fetch(`${graphUrl("/me/accounts")}?${params.toString()}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Meta /me/accounts failed (${res.status}): ${text.slice(0, 240)}`);
  }
  const json = (await res.json()) as { data?: MetaPageRow[] };
  return Array.isArray(json.data) ? json.data : [];
}

function pickBestPage(pages: MetaPageRow[]): MetaPageRow | null {
  const withTokens = pages.filter((p) => p.access_token && p.id && p.name);
  if (withTokens.length === 0) return null;

  const score = (p: MetaPageRow) => {
    const tasks = new Set((p.tasks ?? []).map((t) => t.toUpperCase()));
    if (tasks.has("MESSAGING")) return 3;
    if (tasks.has("MODERATE")) return 2;
    return 1;
  };

  return withTokens.sort((a, b) => score(b) - score(a))[0] ?? null;
}

function createVerifyToken(): string {
  return `vocally_${crypto.randomUUID()}`;
}

export async function connectMessengerForAgent(params: {
  orgId: string;
  agentId: string;
  code: string;
}): Promise<{ pageId: string; pageName: string }> {
  const { orgId, agentId, code } = params;

  const agent = await prisma.agent.findFirst({
    where: { id: agentId, orgId },
    select: { id: true },
  });
  if (!agent) throw new Error("Agent not found");

  const userAccessToken = await exchangeCodeForUserAccessToken(code);
  const pages = await listManagedPages(userAccessToken);
  const selected = pickBestPage(pages);
  if (!selected?.access_token) {
    throw new Error(
      "No Facebook Page with messaging access was found for your account. Make sure you have access to a Page and granted permissions.",
    );
  }

  const pageAccessTokenEnc = encryptToken(selected.access_token);
  const verifyTokenEnc = encryptToken(createVerifyToken());

  await prisma.messengerConnection.upsert({
    where: { agentId },
    create: {
      orgId,
      agentId,
      pageId: selected.id,
      pageName: selected.name,
      pageAccessTokenEnc,
      verifyTokenEnc,
    },
    update: {
      pageId: selected.id,
      pageName: selected.name,
      pageAccessTokenEnc,
      verifyTokenEnc,
    },
  });

  await prisma.agentChannel.upsert({
    where: { agentId_channel: { agentId, channel: "MESSENGER" } },
    create: { agentId, channel: "MESSENGER", enabled: true, config: Prisma.JsonNull },
    update: { enabled: true },
  });

  return { pageId: selected.id, pageName: selected.name };
}

export async function disconnectMessengerForAgent(params: {
  orgId: string;
  agentId: string;
}): Promise<void> {
  const { orgId, agentId } = params;
  const existing = await prisma.messengerConnection.findFirst({
    where: { orgId, agentId },
    select: { id: true },
  });
  if (existing) {
    await prisma.messengerConnection.delete({ where: { id: existing.id } });
  }
}

