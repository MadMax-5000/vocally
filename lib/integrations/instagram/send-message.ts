import { META_GRAPH_VERSION } from "./constants";

export async function sendInstagramTextMessage(args: {
  pageAccessToken: string;
  recipientIgScopedId: string;
  text: string;
  replyToMessageId?: string;
}): Promise<void> {
  const u = new URL(`https://graph.facebook.com/${META_GRAPH_VERSION}/me/messages`);
  u.searchParams.set("access_token", args.pageAccessToken);

  const body: Record<string, unknown> = {
    recipient: { id: args.recipientIgScopedId },
    message: { text: args.text },
  };
  if (args.replyToMessageId) {
    body.reply_to = { mid: args.replyToMessageId };
  }

  const res = await fetch(u.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Meta send message failed: ${text}`);
  }
}

