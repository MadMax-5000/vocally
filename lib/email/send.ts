import { Resend } from "resend";

let resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY is not configured");
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  body: string;
  from?: string;
}): Promise<{ messageId: string }> {
  const client = getResendClient();
  const from = params.from ?? process.env.RESEND_FROM_EMAIL ?? "noreply@vocally.app";

  const { data, error } = await client.emails.send({
    from,
    to: [params.to],
    subject: params.subject,
    text: params.body,
  });

  if (error || !data) {
    throw new Error(`Failed to send email: ${error?.message ?? "Unknown error"}`);
  }

  return { messageId: data.id };
}
