import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

import { formatWhatsappDisplay } from "@/lib/deploy/whatsapp-config";
import { prisma } from "@/lib/db/prisma";
import { refreshWhatsappConnectionStatus } from "@/lib/integrations/whatsapp/connect";
import { getOrgPrismaId } from "@/lib/server/organization";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const orgId = await getOrgPrismaId();
    if (!orgId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const agentId = req.nextUrl.searchParams.get("agentId");
    if (!agentId) {
      return NextResponse.json({ success: false, error: "Missing agentId" }, { status: 400 });
    }

    const agent = await prisma.agent.findFirst({
      where: { id: agentId, orgId },
      select: { id: true },
    });
    if (!agent) {
      return NextResponse.json({ success: false, error: "Agent not found" }, { status: 404 });
    }

    const refreshed = await refreshWhatsappConnectionStatus({ orgId, agentId });
    if (refreshed) {
      return NextResponse.json({
        success: true,
        data: {
          ...refreshed,
          twilioNumberDisplay: formatWhatsappDisplay(refreshed.twilioNumber),
        },
      });
    }

    const connection = await prisma.whatsappPhoneNumber.findFirst({
      where: { orgId, agentId, isActive: true },
    });

    if (!connection) {
      return NextResponse.json({ success: true, data: null });
    }

    return NextResponse.json({
      success: true,
      data: {
        connectionId: connection.id,
        status: connection.status,
        twilioNumber: connection.twilioNumber,
        twilioNumberDisplay: formatWhatsappDisplay(connection.twilioNumber),
        twilioSenderSid: connection.twilioSenderSid,
        needsOtp: connection.status === "VERIFYING_OTP",
        statusMessage: connection.statusMessage,
        qualityRating: connection.qualityRating,
        messagingLimit: connection.messagingLimit,
        isLegacy: !connection.twilioSenderSid,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Could not load connection status" },
      { status: 500 },
    );
  }
}
