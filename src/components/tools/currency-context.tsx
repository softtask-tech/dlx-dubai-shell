import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import {
  convertFromAed,
  formatMoney,
  peggedRateTable,
  type CurrencyCode,
  type RateTable,
} from "@/data/currency";
import { getRatesFn } from "@/data/currency.functions";

/**
 * The visitor's chosen currency, remembered across the site.
 *
 * Held once at the root rather than per calculator, so choosing rupees on the
 * yield tool means the buying-cost tool speaks rupees too. The choice is a
 * per-browser convenience, so localStorage is the right home for it — nothing
 * here is worth a round trip.
 */

type CurrencyContextValue = {
  currency: CurrencyCode;
  setCurrency: (code: CurrencyCode) => void;
  rates: RateTable;
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
  const [currency, setCurrencyState] = useState<CurrencyCode>("AED");
  const [rates, setRates] = useState<RateTable>(() => peggedRateTable());

  /* Restore the choice before the visitor notices the default. */
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setCurrencyState(stored as CurrencyCode);
    } catch {
      /* Blocked storage: the default is fine. */
    }
  }, []);

  /* Rates are only worth fetching once someone has asked for a conversion. */
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
      aed: (amount: number) => formatMoney(amount, aedCurrency),
      converted: (amount: number) => {
        if (currency === "AED") return null;
        const result = convertFromAed(amount, currency, rates);
        return result.available ? formatMoney(result.amount, result.currency) : null;
      },
    };
  }, [currency, rates, setCurrency]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency(): CurrencyContextValue {
  const context = useContext(CurrencyContext);
  if (!context) throw new Error("useCurrency() was called outside CurrencyProvider.");
  return context;
}
