import { z } from "zod";

/** Response shape for GET `/emails/receiving/{id}` — fields may vary slightly by API version. */
const resendReceivingBodySchema = z
  .object({
    html: z.string().optional(),
    text: z.string().optional(),
    subject: z.string().optional(),
    from: z.string().optional(),
    to: z.union([z.array(z.string()), z.string()]).optional(),
    message_id: z.string().optional(),
  })
  .passthrough();

export type ResendReceivedEmailPayload = z.infer<typeof resendReceivingBodySchema>;

export async function fetchResendReceivedEmail(
  emailId: string,
): Promise<{ text?: string; html?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  const res = await fetch(`https://api.resend.com/emails/receiving/${encodeURIComponent(emailId)}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Resend receiving API failed: ${res.status} ${errText.slice(0, 200)}`);
  }

  const raw: unknown = await res.json();
  const parsed = resendReceivingBodySchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error("Resend receiving API returned unexpected JSON shape");
  }

  return {
    text: parsed.data.text,
    html: parsed.data.html,
  };
}
