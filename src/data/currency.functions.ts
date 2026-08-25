/**
 * Fetching exchange rates.
 *
 * Server-side and cached, for three reasons: the rate provider's key never
 * reaches the browser, a hundred visitors on the tools pages produce one
 * upstream call rather than a hundred, and a provider outage degrades to the
 * dollar peg in one place instead of everywhere.
 */
import { createServerFn } from "@tanstack/react-start";

import { peggedRateTable, type CurrencyCode, type RateTable } from "./currency";

/**
 * An in-memory cache.
 *
 * Rates move slowly enough that an hour is generous, and the dirham's dollar
 * peg means the pair most visitors care about does not move at all. Module
 * scope survives between invocations while the isolate is warm; a cold start
 * simply fetches again.
 */
let cache: { table: RateTable; expiresAt: number } | null = null;

const CACHE_MS = 60 * 60 * 1000;

const WANTED: CurrencyCode[] = ["USD", "EUR", "GBP", "INR", "PKR", "SAR", "RUB", "CNY"];

/**
 * Fetches rates from a configurable endpoint.
 *
 * `FX_RATES_URL` should return `{ rates: { USD: 0.27, … } }` based on AED,
 * the shape most free providers use. Configurable because the free providers
 * come and go, and because a paid one should be a config change rather than a
 * code change.
 */
async function fetchRates(): Promise<RateTable> {
  const endpoint = process.env["FX_RATES_URL"];
  if (!endpoint) return peggedRateTable();

  const url = endpoint.includes("{base}") ? endpoint.replace("{base}", "AED") : endpoint;

  const response = await fetch(url, {
    headers: process.env["FX_RATES_KEY"]
      ? { Authorization: `Bearer ${process.env["FX_RATES_KEY"]}` }
      : {},
    signal: AbortSignal.timeout(6000),
  });

  if (!response.ok) throw new Error(`Rate provider responded ${response.status}`);

  const payload = (await response.json()) as { rates?: Record<string, number> };
  if (!payload.rates) throw new Error("Rate provider returned no rates");

  const rates: Partial<Record<CurrencyCode, number>> = { AED: 1 };
  for (const code of WANTED) {
    const rate = payload.rates[code];
    if (typeof rate === "number" && Number.isFinite(rate) && rate > 0) rates[code] = rate;
  }

  /* A response with no usable rates is a failed fetch, not an empty table. */
  if (Object.keys(rates).length <= 1) throw new Error("Rate provider returned nothing usable");

  return {
    rates,
    fetchedAt: new Date().toISOString(),
    source: "Live exchange rates",
    peggedOnly: false,
  };
}

/** Rates for the browser. Never throws, falls back to the peg. */
export const getRatesFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<RateTable> => {
    if (cache && cache.expiresAt > Date.now()) return cache.table;

    try {
      const table = await fetchRates();
      cache = { table, expiresAt: Date.now() + CACHE_MS };
      return table;
    } catch (error) {
      console.error("[currency] falling back to the dollar peg", error);
      const table = peggedRateTable();
      /* Cache the fallback briefly too, so an outage does not mean a failed
       * upstream call on every single page view. */
      cache = { table, expiresAt: Date.now() + 5 * 60 * 1000 };
      return table;
    }
  },
);
