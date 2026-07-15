import { createHmac, timingSafeEqual } from "crypto";

const FIWANO_WEBHOOK_SECRET = process.env.FIWANO_WEBHOOK_SECRET;

export function verifyFiwanoSignature(
  body: string,
  signatureHeader: string | null,
): boolean {
  if (!FIWANO_WEBHOOK_SECRET) {
    console.warn("FIWANO_WEBHOOK_SECRET not set — skipping signature verification");
    return true;
  }

  if (!signatureHeader) return false;

  const prefix = "sha256=";
  if (!signatureHeader.startsWith(prefix)) return false;

  const expectedSig = signatureHeader.slice(prefix.length);
  const computedSig = createHmac("sha256", FIWANO_WEBHOOK_SECRET)
    .update(body)
    .digest("hex");

  if (expectedSig.length !== computedSig.length) return false;

  return timingSafeEqual(Buffer.from(expectedSig), Buffer.from(computedSig));
}
