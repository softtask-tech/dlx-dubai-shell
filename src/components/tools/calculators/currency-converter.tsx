import { useState } from "react";

import { useCurrency } from "../currency-context";
import { Assumptions, CalculatorLayout, Headline, NumberField } from "../calculator-shell";
import {
  AED_PER_USD,
  convertFromAed,
  CURRENCIES,
  formatMoney,
  type CurrencyCode,
} from "@/data/currency";
import { Select } from "@/components/forms/fields";
import { Eyebrow } from "@/components/ui/section";

/**
 * Currency conversion for Dubai prices.
 *
 * Converts in both directions, and shows a table of the currencies DLX's
 * audiences actually price in. Where a rate is unavailable the row says so
 * rather than being quietly dropped — a missing number that looks like an
 * absence is less confusing than one that looks like a zero.
 */
export function CurrencyConverter() {
  const { rates } = useCurrency();
  const [amount, setAmount] = useState(2_000_000);
  const [direction, setDirection] = useState<"from_aed" | "to_aed">("from_aed");
  const [other, setOther] = useState<CurrencyCode>("USD");

  const otherCurrency = CURRENCIES.find((currency) => currency.code === other)!;
  const aedCurrency = CURRENCIES[0]!;

  const rate = rates.rates[other];

  /* Converting into dirhams is the same rate inverted. */
  const converted =
    direction === "from_aed"
      ? convertFromAed(amount, other, rates)
      : rate
        ? { available: true as const, amount: amount / rate, currency: aedCurrency }
        : { available: false as const, reason: "No rate available for that currency." };

  return (
    <CalculatorLayout
      inputs={
        <>
          <div className="flex flex-col gap-2">
            <label htmlFor="direction" className="eyebrow">
              Convert
            </label>
            <Select
              id="direction"
              value={direction}
              onChange={(event) => setDirection(event.target.value as typeof direction)}
            >
              <option value="from_aed">From dirhams</option>
              <option value="to_aed">Into dirhams</option>
            </Select>
          </div>

          <NumberField
            label="Amount"
            unit={direction === "from_aed" ? "AED" : other}
            value={amount}
            onChange={setAmount}
            step={10_000}
          />

          <div className="flex flex-col gap-2">
            <label htmlFor="other" className="eyebrow">
              {direction === "from_aed" ? "Into" : "From"}
            </label>
            <Select
              id="other"
              value={other}
              onChange={(event) => setOther(event.target.value as CurrencyCode)}
            >
              {CURRENCIES.filter((currency) => currency.code !== "AED").map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.code} — {currency.name}
                </option>
              ))}
            </Select>
          </div>
        </>
      }
      result={
        <>
          <Headline
            label={direction === "from_aed" ? `In ${otherCurrency.name}` : "In dirhams"}
            value={
              <span className="display-2">
                {converted.available
                  ? formatMoney(converted.amount, converted.currency)
                  : "Rate unavailable"}
              </span>
            }
            meaning={
              converted.available
                ? other === "USD"
                  ? "The dirham is pegged to the US dollar, so this figure does not move. Dollar buyers face no currency risk on a Dubai purchase."
                  : "At the current rate. Rates move, and on a purchase of this size a small move is a real amount of money — fix your rate with your bank before you commit."
                : converted.reason
            }
          />

          <div className="mt-12">
            <Eyebrow>The same amount, elsewhere</Eyebrow>
            <ul className="mt-5">
              {CURRENCIES.filter((currency) => currency.code !== "AED").map((currency) => {
                const aedAmount = direction === "from_aed" ? amount : rate ? amount / rate : 0;
                const row = convertFromAed(aedAmount, currency.code, rates);
                return (
                  <li
                    key={currency.code}
                    className="flex items-baseline justify-between gap-6 border-t border-border/60 py-4"
                  >
                    <span className="body-text">
                      {currency.name}
                      <span className="caption"> · {currency.code}</span>
                    </span>
                    <span className="body-text">
                      {row.available ? (
                        formatMoney(row.amount, row.currency)
                      ) : (
                        <span className="caption">Rate unavailable</span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      }
      assumptions={
        <Assumptions
          entries={[
            {
              label: "AED / USD",
              value: `${AED_PER_USD} — fixed`,
              source: "UAE Central Bank peg since 1997",
            },
            { label: "Other rates", value: rates.source },
          ]}
        >
          <p className="caption max-w-measure">
            Indicative rates for planning. Your bank's rate on the day, including its spread, is
            what you will actually pay — and on a property purchase the difference is worth
            negotiating.
          </p>
        </Assumptions>
      }
    />
  );
}
