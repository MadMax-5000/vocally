export function formatPrice(cents: number | null | undefined, currencyCode: string): string {
  if (cents === null || cents === undefined || !Number.isFinite(cents)) return "—";

  const code = currencyCode.toUpperCase();

  if (code === "MAD") {
    return new Intl.NumberFormat("ar-MA", {
      style: "currency",
      currency: "MAD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(cents / 100);
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export function convertPrice(usdCents: number, targetCurrency: string): number {
  if (targetCurrency === "MAD") {
    const rate = Number(process.env.MAD_EXCHANGE_RATE) || 10.5;
    return Math.round(usdCents * rate);
  }
  return usdCents;
}
