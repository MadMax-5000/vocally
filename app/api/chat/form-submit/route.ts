import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { handleFormSubmit } from "@/lib/api/form-submit-handler";
import { prisma } from "@/lib/db/prisma";
import { getOrgPrismaId } from "@/lib/server/organization";
import {
  denyIfOriginNotAllowed,
  isWidgetTokenRequired,
} from "@/lib/agent-security/widget-access";

const formSubmitSchema = z.object({
  agentId: z.string().min(1),
  widgetToken: z.string().min(1).optional(),
  sessionId: z.string().min(1),
  formId: z.string().min(1).max(64),
  values: z.record(z.string(), z.string()),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = formSubmitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { agentId, widgetToken, sessionId, formId, values } = parsed.data;

    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      include: {
        org: { select: { id: true } },
        channels: { where: { channel: "WEB_CHAT" } },
      },
    });

    if (!agent) {
      return NextResponse.json({ success: false, error: "Agent not found" }, { status: 404 });
    }

    const dbOrgId = await getOrgPrismaId();
    const isOwnerPreview = !!dbOrgId && agent.orgId === dbOrgId;

    if (!isOwnerPreview) {
      if (isWidgetTokenRequired(agent.id, isOwnerPreview)) {
        if (!widgetToken || !agent.widgetToken || agent.widgetToken !== widgetToken) {
          return NextResponse.json({ success: false, error: "Invalid widget token" }, { status: 401 });
        }
      }

      if (agent.visibility !== "PUBLIC" || agent.status !== "ACTIVE") {
        return NextResponse.json({ success: false, error: "Agent not available" }, { status: 403 });
      }

      const webChatChannel = agent.channels[0];
      if (!webChatChannel?.enabled) {
        return NextResponse.json(
          { success: false, error: "Web chat is not enabled for this agent" },
          { status: 403 },
        );
      }

      const originDenial = denyIfOriginNotAllowed(req.headers, agent.allowedHostnames);
      if (originDenial) {
        return NextResponse.json(
          { success: false, error: originDenial.error },
          { status: originDenial.status },
        );
      }
    }

    const result = await handleFormSubmit({
      orgId: agent.org.id,
      agentId,
      sessionId,
      formId,
      values,
    });

    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.error.message },
        { status: result.error.status },
      );
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
