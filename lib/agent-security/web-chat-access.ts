import type { NextRequest } from "next/server";

import { parseWebChatConfig } from "@/lib/deploy/web-chat-config";
import { prisma } from "@/lib/db/prisma";
import { getOrgPrismaId } from "@/lib/server/organization";

import {
  denyIfChatRateLimited,
  denyIfOriginNotAllowed,
  isWidgetTokenRequired,
  resolveWidgetChatRateLimit,
} from "./widget-access";

export type WebChatDeployment = "widget" | "help";

export type WebChatAccessResult =
  | { ok: true; orgId: string }
  | { ok: false; status: 401 | 403 | 404 | 429; error: string };

/**
 * Shared access gate for public web-chat endpoints (messages + history).
 * Mirrors the original /api/chat checks so history cannot bypass token,
 * visibility, origin, help-page, or rate-limit enforcement.
 */
export async function authorizeWebChatRequest(input: {
  req: NextRequest;
  agentId: string;
  widgetToken?: string | null;
  deployment?: WebChatDeployment;
}): Promise<WebChatAccessResult> {
  const { req, agentId, widgetToken, deployment = "widget" } = input;

  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    include: {
      org: { select: { id: true } },
      channels: { where: { channel: "WEB_CHAT" } },
    },
  });

  if (!agent) {
    return { ok: false, status: 404, error: "Agent not found" };
  }

  const dbOrgId = await getOrgPrismaId();
  const isOwnerPreview = !!dbOrgId && agent.orgId === dbOrgId;

  if (!isOwnerPreview) {
    if (isWidgetTokenRequired(agent.id, isOwnerPreview)) {
      if (!widgetToken || !agent.widgetToken || agent.widgetToken !== widgetToken) {
        return { ok: false, status: 401, error: "Invalid widget token" };
      }
    }

    if (agent.visibility !== "PUBLIC" || agent.status !== "ACTIVE") {
      return { ok: false, status: 403, error: "Agent not available" };
    }

    const webChatChannel = agent.channels[0];
    if (!webChatChannel?.enabled) {
      return {
        ok: false,
        status: 403,
        error: "Web chat is not enabled for this agent",
      };
    }

    if (deployment === "help") {
      const config = parseWebChatConfig(webChatChannel.config);
      if (config.helpPage?.enabled === false) {
        return {
          ok: false,
          status: 403,
          error: "Help page is not enabled for this agent",
        };
      }
    }

    const originDenial = denyIfOriginNotAllowed(
      req.headers,
      agent.allowedHostnames,
    );
    if (originDenial) {
      return {
        ok: false,
        status: originDenial.status,
        error: originDenial.error,
      };
    }

    const rateDenial = denyIfChatRateLimited(
      req.headers,
      agent.id,
      resolveWidgetChatRateLimit(agent.id, agent.chatRateLimitPerMinute),
    );
    if (rateDenial) {
      return {
        ok: false,
        status: rateDenial.status,
        error: rateDenial.error,
      };
    }
  }

  return { ok: true, orgId: agent.org.id };
}
