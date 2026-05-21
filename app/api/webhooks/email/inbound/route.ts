import { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { plainTextFromInboundParts } from "@/lib/email/email-body";
import { fetchResendReceivedEmail } from "@/lib/email/resend-received-api";
import {
  resendEmailReceivedSchema,
  verifyResendWebhookSignature,
} from "@/lib/email/resend-webhook";
import { emailService } from "@/lib/email/service";
import { logServerError, logServerWarning } from "@/lib/logger";

function getSvixHeaders(req: NextRequest) {
  return {
    svixId: req.headers.get("svix-id"),
    svixTimestamp: req.headers.get("svix-timestamp"),
    svixSignature: req.headers.get("svix-signature"),
  };
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
  if (webhookSecret) {
    const h = getSvixHeaders(req);
    if (!h.svixId || !h.svixTimestamp || !h.svixSignature) {
      logServerWarning("resend_email_webhook_missing_svix", {});
      return new Response("Missing svix headers", { status: 400 });
    }
    const ok = verifyResendWebhookSignature(rawBody, h, webhookSecret);
    if (!ok) {
      logServerWarning("resend_email_webhook_invalid_signature", {});
      return new Response("Invalid signature", { status: 401 });
    }
  } else {
    logServerWarning("resend_email_webhook_unsigned", {
      devMode: process.env.NODE_ENV !== "production",
    });
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(rawBody) as unknown;
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const eventParse = resendEmailReceivedSchema.safeParse(parsedJson);
  if (!eventParse.success) {
    // Acknowledge other event types without processing
    return new Response("OK", { status: 200 });
  }

  const { data } = eventParse.data;
  const { email_id: emailId, from, to, subject } = data;

  if (!to.length) {
    return new Response("OK", { status: 200 });
  }

  try {
    const { text, html } = await fetchResendReceivedEmail(emailId);

    const plain = plainTextFromInboundParts(text, html);
    if (!plain) {
      return new Response("OK", { status: 200 });
    }

    try {
      await prisma.inboundEmailDedupe.create({
        data: { resendEmailId: emailId },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        return new Response("OK", { status: 200 });
      }
      logServerError("resend_email_dedupe_create_failed", {
        code: e instanceof Prisma.PrismaClientKnownRequestError ? e.code : "unknown",
      });
      return new Response("Dedupe persistence failed", { status: 500 });
    }

    try {
      await emailService.handleInboundEmail({
        subject: subject ?? "(no subject)",
        from,
        to,
        text,
        html,
        messageId: data.message_id,
      });

      return new Response("OK", { status: 200 });
    } catch (processErr) {
      try {
        await prisma.inboundEmailDedupe.deleteMany({ where: { resendEmailId: emailId } });
      } catch {
        logServerWarning("resend_email_dedupe_rollback_failed", {});
      }
      const message = processErr instanceof Error ? processErr.message : "unknown";
      logServerError("resend_email_inbound_processing_failed", {
        errorPreview: message.slice(0, 120),
      });
      return new Response("Processing failed", { status: 500 });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    logServerError("resend_email_inbound_fetch_or_outer_failed", {
      errorPreview: message.slice(0, 120),
    });
    return new Response("Upstream fetch failed", { status: 500 });
  }
}
