import { decryptToken } from "@/lib/crypto/token-encryption";

import { graphUrl } from "./graph";

export async function sendMessengerText(params: {
  pageId: string;
  pageAccessTokenEnc: string;
  recipientPsid: string;
  text: string;
}): Promise<void> {
  const token = decryptToken(params.pageAccessTokenEnc);

  const url = new URL(graphUrl(`/${params.pageId}/messages`));
  url.searchParams.set("access_token", token);

  const body = {
    messaging_type: "RESPONSE",
    recipient: { id: params.recipientPsid },
    message: { text: params.text },
  };

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Meta Send API failed (${res.status}): ${text.slice(0, 240)}`);
  }
}

