import { useCurrency } from "./currency-context";
import { CURRENCIES, type CurrencyCode } from "@/data/currency";
import { cn } from "@/lib/utils";

/**
 * An amount in AED, with the visitor's currency beside it.
 *
 * AED always leads because that is what the transaction is actually in. The
 * conversion is a courtesy, and it disappears rather than guessing when no rate
 * is available.
 */
export function Money({
  aed,
  className,
  size = "display",
}: {
  aed: number;
  className?: string;
  size?: "display" | "body";
}) {
  const currency = useCurrency();
  const secondary = currency.converted(aed);

  return (
    <span className={cn("inline-flex flex-col", className)}>
      <span className={size === "display" ? "display-2" : "body-text"}>{currency.aed(aed)}</span>
      {secondary ? (
        <span className="caption mt-1">
          ≈ {secondary} {currency.currency}
        </span>
      ) : null}
    </span>
  );
}

/** The currency picker shown at the top of the tools. */
export function CurrencyPicker({ className }: { className?: string }) {
  const { currency, setCurrency, rates } = useCurrency();

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor="currency" className="eyebrow">
        Show amounts in
      </label>
      <select
        id="currency"
        value={currency}
        onChange={(event) => setCurrency(event.target.value as CurrencyCode)}
        className="eyebrow cursor-pointer border-0 border-b border-border bg-transparent pb-2 text-foreground outline-none focus-visible:border-accent"
      >
        {CURRENCIES.map((entry) => (
          <option key={entry.code} value={entry.code}>
            {entry.code} — {entry.name}
          </option>
        ))}
      </select>
      {currency !== "AED" ? (
        <p className="caption">
          {rates.peggedOnly && currency !== "USD"
            ? "Live rates are unavailable right now, so figures are shown in dirhams only."
            : rates.source}
        </p>
      ) : null}
    </div>
  );
}
