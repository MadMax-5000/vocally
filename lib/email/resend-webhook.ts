import { Webhook } from "svix";
import { z } from "zod";

/** Resend `email.received` webhook envelope (Svix-signed). See https://resend.com/docs/webhooks/emails/received */
export const resendEmailReceivedSchema = z.object({
  type: z.literal("email.received"),
  created_at: z.string().optional(),
  data: z.object({
    email_id: z.string().min(1),
    created_at: z.string().optional(),
    from: z.string(),
    to: z.array(z.string()),
    subject: z.string().optional(),
    message_id: z.string().optional(),
    bcc: z.array(z.string()).optional(),
    cc: z.array(z.string()).optional(),
    attachments: z.array(z.unknown()).optional(),
  }),
});

export type ResendEmailReceivedEvent = z.infer<typeof resendEmailReceivedSchema>;

export function verifyResendWebhookSignature(
  rawBody: string,
  headers: {
    svixId: string | null;
    svixTimestamp: string | null;
    svixSignature: string | null;
  },
  webhookSecret: string,
): boolean {
  const { svixId, svixTimestamp, svixSignature } = headers;
  if (!svixId || !svixTimestamp || !svixSignature) {
    return false;
  }

  const wh = new Webhook(webhookSecret);
  try {
    wh.verify(rawBody, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    });
    return true;
  } catch {
    return false;
  }
}
