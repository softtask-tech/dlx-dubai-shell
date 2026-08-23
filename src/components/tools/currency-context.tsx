import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import {
  convertFromAed,
  countryName,
  formatMoney,
  peggedRateTable,
  type CurrencyCode,
  type RateTable,
} from "@/data/currency";
import { getRatesFn } from "@/data/currency.functions";
import { getGeoHintFn } from "@/data/geo.functions";
import { useLocale } from "@/i18n";

/**
 * The visitor's currency, remembered across the site.
 *
 * Held once at the root rather than per calculator, so choosing rupees on the
 * yield tool means the listing you open next is priced in rupees too. Phase 4
 * scoped this to the calculators; it now covers every figure on the site,
 * because the moment that mattered was never the calculator — it was the
 * listing page, where someone decides whether a number is within reach.
 *
 * PRECEDENCE, HIGHEST FIRST: what the visitor chose, then what their country
 * suggests, then dirhams. A stored choice always wins — a visitor who picked
 * dollars in Dubai last week gets dollars this week, because they said so and
 * the edge did not.
 */

type CurrencyContextValue = {
  currency: CurrencyCode;
  setCurrency: (code: CurrencyCode) => void;
  rates: RateTable;
  /** The country the edge reported, named in the reader's language, or null. */
  detectedCountry: string | null;
  /** Formats an AED amount in AED. */
  aed: (amount: number) => string;
  /**
   * The same amount in the visitor's currency, or null when we have no rate we
   * can stand behind. Callers must handle null by showing AED alone.
   */
  converted: (amount: number) => string | null;
};

const STORAGE_KEY = "dlx.currency";

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const { locale } = useLocale();
  const [currency, setCurrencyState] = useState<CurrencyCode>("AED");
  const [rates, setRates] = useState<RateTable>(() => peggedRateTable());
  const [detected, setDetected] = useState<string | null>(null);

  /*
   * Restore the choice, or ask the edge where this visitor is.
   *
   * Both run client-side and after the first paint, deliberately: rendering a
   * converted price on the server would mean caching a page per country, and
   * the first thing every visitor sees stays the dirham figure that is actually
   * on the contract.
   */
  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch {
      /* Blocked storage: fall through to detection. */
    }

    if (stored) {
      setCurrencyState(stored as CurrencyCode);
      return;
    }

    let cancelled = false;
    void getGeoHintFn()
      .then((hint) => {
        if (cancelled || !hint.country) return;
        setDetected(hint.country);
        setCurrencyState(hint.currency);
      })
      .catch(() => {
        /* Dirhams it is. */
      });

    return () => {
      cancelled = true;
    };
  }, []);

  /* Rates are only worth fetching once someone is actually looking at a
   * conversion — which, with detection, is most visitors, but never the ones
   * reading in dirhams. */
  useEffect(() => {
    if (currency === "AED") return;
    let cancelled = false;
    void getRatesFn()
      .then((table) => {
        if (!cancelled) setRates(table);
      })
      .catch(() => {
        /* getRatesFn already falls back; nothing to add here. */
      });
    return () => {
      cancelled = true;
    };
  }, [currency]);

  const setCurrency = useCallback((code: CurrencyCode) => {
    setCurrencyState(code);
    /* A deliberate choice clears the detection note: the visitor now knows
     * exactly why they are seeing this currency, because they picked it. */
    setDetected(null);
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      /* Not worth telling the visitor about. */
    }
  }, []);

  const value = useMemo<CurrencyContextValue>(() => {
    const aedCurrency = { code: "AED" as const, name: "UAE Dirham", symbol: "AED", decimals: 0 };

    return {
      currency,
      setCurrency,
      rates,
      detectedCountry: detected ? countryName(detected, locale.intlLocale) : null,
      /* Both figures are formatted for the reader's language: Hindi groups
       * digits differently from English (12,34,567 rather than 1,234,567), and
       * a lakh-grouped figure is the one an Indian buyer can check at a glance. */
      aed: (amount: number) => formatMoney(amount, aedCurrency, locale.intlLocale),
      converted: (amount: number) => {
        if (currency === "AED") return null;
        const result = convertFromAed(amount, currency, rates);
        return result.available
          ? formatMoney(result.amount, result.currency, locale.intlLocale)
          : null;
      },
    };
  }, [currency, rates, setCurrency, detected, locale.intlLocale]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency(): CurrencyContextValue {
  const context = useContext(CurrencyContext);
  if (!context) throw new Error("useCurrency() was called outside CurrencyProvider.");
  return context;
}
