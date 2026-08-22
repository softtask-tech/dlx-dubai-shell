/**
 * Currency handling.
 *
 * DLX's audiences price in dollars, euros, pounds, rupees and Pakistani rupees,
 * and a Dubai price in AED alone is a number they have to go and convert. So
 * every figure is shown in AED with the visitor's own currency beside it.
 *
 * The rule that governs this module: a converted figure is only ever shown when
 * we have a rate we can stand behind. If rates are unavailable the site shows
 * AED alone and says why. Quietly converting at a stale or invented rate on a
 * multi-million-dirham purchase would be worse than not converting at all.
 */

export type CurrencyCode = "AED" | "USD" | "EUR" | "GBP" | "INR" | "PKR" | "SAR" | "RUB" | "CNY";

export type Currency = {
  code: CurrencyCode;
  name: string;
  symbol: string;
  /** Decimal places used when displaying an amount. */
  decimals: number;
};

export const CURRENCIES: readonly Currency[] = [
  { code: "AED", name: "UAE Dirham", symbol: "AED", decimals: 0 },
  { code: "USD", name: "US Dollar", symbol: "$", decimals: 0 },
  { code: "EUR", name: "Euro", symbol: "€", decimals: 0 },
  { code: "GBP", name: "British Pound", symbol: "£", decimals: 0 },
  { code: "INR", name: "Indian Rupee", symbol: "₹", decimals: 0 },
  { code: "PKR", name: "Pakistani Rupee", symbol: "₨", decimals: 0 },
  { code: "SAR", name: "Saudi Riyal", symbol: "SAR", decimals: 0 },
  { code: "RUB", name: "Russian Ruble", symbol: "₽", decimals: 0 },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥", decimals: 0 },
];

export function currencyByCode(code: string): Currency | undefined {
  return CURRENCIES.find((currency) => currency.code === code);
}

/**
 * The dirham's peg to the US dollar.
 *
 * This is not a market rate. The UAE Central Bank has held the dirham at a
 * fixed 3.6725 to the dollar since 1997, so unlike every other pair in this
 * module it does not need a live feed and does not go stale. It is the one
 * conversion the site can always offer.
 */
export const AED_PER_USD = 3.6725;

export type RateTable = {
  /** How many units of each currency one AED buys. */
  rates: Partial<Record<CurrencyCode, number>>;
  /** When the rates were fetched. */
  fetchedAt: string;
  /** Where they came from, for the note beneath a converted figure. */
  source: string;
  /** True when only the dollar peg is available. */
  peggedOnly: boolean;
};

/** What the site falls back to: AED and the pegged dollar, nothing invented. */
export function peggedRateTable(): RateTable {
  return {
    rates: { AED: 1, USD: 1 / AED_PER_USD },
    fetchedAt: new Date().toISOString(),
    source: "UAE Central Bank peg (AED 3.6725 = USD 1)",
    peggedOnly: true,
  };
}

export type ConversionResult =
  { available: true; amount: number; currency: Currency } | { available: false; reason: string };

/** Converts an AED amount, or explains why it cannot. */
export function convertFromAed(
  amountAed: number,
  code: CurrencyCode,
  table: RateTable,
): ConversionResult {
  const currency = currencyByCode(code);
  if (!currency) return { available: false, reason: "Unknown currency" };
  if (code === "AED") return { available: true, amount: amountAed, currency };

  const rate = table.rates[code];
  if (!rate) {
    return {
      available: false,
      reason: table.peggedOnly
        ? "Live rates are unavailable, so only US dollars can be shown."
        : "No rate available for that currency.",
    };
  }

  return { available: true, amount: amountAed * rate, currency };
}

/** "AED 4,250,000" / "$1,157,000". */
export function formatMoney(amount: number, currency: Currency): string {
  const rounded = amount.toLocaleString("en-AE", {
    minimumFractionDigits: currency.decimals,
    maximumFractionDigits: currency.decimals,
  });
  /* Codes read better before the number; glyphs read better against it. */
  return currency.symbol.length > 1
    ? `${currency.symbol} ${rounded}`
    : `${currency.symbol}${rounded}`;
}
