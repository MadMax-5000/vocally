import { headers } from "next/headers";

export type CurrencyInfo = {
  code: string;
  symbol: string;
  locale: string;
};

export function detectCurrency(): CurrencyInfo {
  const acceptLanguage = headers().get("accept-language") || "";
  const isMoroccan = /ar-MA|fr-MA|ber-MA/i.test(acceptLanguage);

  if (isMoroccan) {
    return { code: "MAD", symbol: "DH", locale: "ar-MA" };
  }

  return { code: "USD", symbol: "$", locale: "en-US" };
}
