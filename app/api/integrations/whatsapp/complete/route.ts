import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { e164PhoneSchema } from "@/lib/deploy/whatsapp-config";
import { prisma } from "@/lib/db/prisma";
import {
  completeWhatsappConnect,
  verifyWhatsappOtpForAgent,
} from "@/lib/integrations/whatsapp/connect";
import { getOrgPrismaId } from "@/lib/server/organization";

const completeSchema = z.object({
  agentId: z.string().min(1),
  phoneNumber: e164PhoneSchema,
  wabaId: z.string().min(1).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const orgId = await getOrgPrismaId();
    if (!orgId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = completeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message ?? "Invalid request" },
        { status: 400 },
      );
    }

    const agent = await prisma.agent.findFirst({
      where: { id: parsed.data.agentId, orgId },
      select: { id: true },
    });
    if (!agent) {
      return NextResponse.json({ success: false, error: "Agent not found" }, { status: 404 });
    }

    const result = await completeWhatsappConnect({
      orgId,
      agentId: parsed.data.agentId,
      phoneNumber: parsed.data.phoneNumber,
      wabaId: parsed.data.wabaId,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not connect WhatsApp";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

const otpSchema = z.object({
  agentId: z.string().min(1),
  verificationCode: z.string().min(4).max(10),
});

export async function PUT(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const orgId = await getOrgPrismaId();
    if (!orgId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = otpSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message ?? "Invalid request" },
        { status: 400 },
      );
    }

    const result = await verifyWhatsappOtpForAgent({
      orgId,
      agentId: parsed.data.agentId,
      verificationCode: parsed.data.verificationCode,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not verify OTP";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
