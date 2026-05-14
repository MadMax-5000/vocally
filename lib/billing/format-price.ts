/** Variant `price` from Lemon Squeezy is in minor units (cents). */
export function formatVariantPrice(cents: number | null | undefined, currencyCode: string): string {
  if (cents === null || cents === undefined || !Number.isFinite(cents)) {
    return "—";
  }
  const code = /^[A-Z]{3}$/i.test(currencyCode) ? currencyCode.toUpperCase() : "USD";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: code,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}
