export function formatPrice(cents: number | null | undefined): string {
  if (cents === null || cents === undefined || !Number.isFinite(cents)) return "—";

  const amount = new Intl.NumberFormat("ar-MA", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(cents / 100);

  return `${amount} MAD`;
}
