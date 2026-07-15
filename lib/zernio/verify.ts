import { createHmac, timingSafeEqual } from "crypto";

const ZERNIO_WEBHOOK_SECRET = process.env.ZERNIO_WEBHOOK_SECRET;

export function verifyZernioSignature(
  body: string,
  signatureHeader: string | null,
): boolean {
  if (!ZERNIO_WEBHOOK_SECRET) {
    console.warn("ZERNIO_WEBHOOK_SECRET not set — skipping signature verification");
    return true;
  }

  if (!signatureHeader) return false;

  const computedSig = createHmac("sha256", ZERNIO_WEBHOOK_SECRET)
    .update(body)
    .digest("hex");

  if (signatureHeader.length !== computedSig.length) return false;

  return timingSafeEqual(Buffer.from(signatureHeader), Buffer.from(computedSig));
}
