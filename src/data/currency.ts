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

/**
 * "AED 4,250,000" / "$1,157,000".
 *
 * The digit grouping follows the reader's language, not ours. Indian and
 * Pakistani readers group in lakhs and crores — 42,50,000, not 4,250,000 — and
 * a figure grouped the wrong way is one a buyer has to re-read to be sure of
 * the magnitude. On a number this size that is not a small thing.
 */
export function formatMoney(amount: number, currency: Currency, locale = "en-AE"): string {
  let rounded: string;
  try {
    rounded = amount.toLocaleString(locale, {
      minimumFractionDigits: currency.decimals,
      maximumFractionDigits: currency.decimals,
    });
  } catch {
    /* An unknown locale tag should never cost the reader the price. */
    rounded = amount.toLocaleString("en-AE", {
      minimumFractionDigits: currency.decimals,
      maximumFractionDigits: currency.decimals,
    });
  }

  /* Codes read better before the number; glyphs read better against it. */
  return currency.symbol.length > 1
    ? `${currency.symbol} ${rounded}`
    : `${currency.symbol}${rounded}`;
}

/**
 * The currency a visitor from a given country most likely thinks in.
 *
 * Deliberately a short list rather than a complete ISO table. These are the
 * markets DLX actually advertises into; everywhere else falls through to the
 * dollar, which is the currency a cross-border property buyer is most likely to
 * hold a second account in anyway.
 *
 * A visitor in the UAE gets AED and no conversion at all — they are already
 * reading the contract currency, and a second figure beside it would be noise.
 */
const COUNTRY_CURRENCY: Record<string, CurrencyCode> = {
  AE: "AED",
  US: "USD",
  CA: "USD",
  SG: "USD",
  HK: "USD",
  GB: "GBP",
  IE: "EUR",
  DE: "EUR",
  FR: "EUR",
  IT: "EUR",
  ES: "EUR",
  NL: "EUR",
  BE: "EUR",
  AT: "EUR",
  PT: "EUR",
  GR: "EUR",
  FI: "EUR",
  CY: "EUR",
  LU: "EUR",
  IN: "INR",
  PK: "PKR",
  SA: "SAR",
  BH: "SAR",
  KW: "SAR",
  OM: "SAR",
  QA: "SAR",
  RU: "RUB",
  BY: "RUB",
  KZ: "RUB",
  CN: "CNY",
  TW: "CNY",
  MO: "CNY",
};

/** The currency to open with for a visitor from this ISO 3166-1 alpha-2 country. */
export function currencyForCountry(country: string | null | undefined): CurrencyCode {
  if (!country) return "AED";
  return COUNTRY_CURRENCY[country.toUpperCase()] ?? "USD";
}

/**
 * The country's name, for the line explaining why prices changed.
 *
 * `Intl.DisplayNames` knows every country in every language the site speaks, so
 * a Russian reader in Kazakhstan is told "Казахстан" rather than "KZ". Falls
 * back to the raw code where the runtime has no data for that locale.
 */
export function countryName(country: string, locale: string): string {
  try {
    return new Intl.DisplayNames([locale], { type: "region" }).of(country.toUpperCase()) ?? country;
  } catch {
    return country;
  }
}
