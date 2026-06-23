import crypto from "crypto";

export function verifyMetaWebhookSignature(params: {
  appSecret: string;
  rawBody: Buffer;
  signatureHeader: string | null;
}): boolean {
  const signature = params.signatureHeader;
  if (!signature) return false;

  const expected =
    "sha256=" + crypto.createHmac("sha256", params.appSecret).update(params.rawBody).digest("hex");

  try {
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

