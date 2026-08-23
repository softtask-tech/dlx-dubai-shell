import { useCurrency } from "./currency-context";
import { CURRENCIES, type CurrencyCode } from "@/data/currency";
import { useLocale } from "@/i18n";
import { cn } from "@/lib/utils";

/**
 * An amount in AED, with the visitor's currency beside it.
 *
 * AED always leads, and never moves to second place however the visitor sets
 * the picker. The dirham is what the sale and purchase agreement is written in
 * and what the Land Department registers; a page that showed a rupee figure
 * first would be quoting a number that appears on no document the buyer will
 * ever sign. The conversion is a courtesy — and it disappears rather than
 * guessing when there is no rate we can stand behind.
 */
export function Money({
  aed,
  className,
  size = "display",
}: {
  aed: number;
  className?: string;
  size?: "display" | "body" | "inline";
}) {
  const currency = useCurrency();
  const { t } = useLocale();
  const secondary = currency.converted(aed);

  /* Inline: one line, for running text and table cells where a stacked figure
   * would break the row. */
  if (size === "inline") {
    return (
      <span className={className}>
        {currency.aed(aed)}
        {secondary ? (
          <span className="text-muted-foreground">
            {" "}
            ({t.currency.approx} {secondary})
          </span>
        ) : null}
      </span>
    );
  }

  return (
    <span className={cn("inline-flex flex-col", className)}>
      <span className={size === "display" ? "display-2" : "body-text"}>{currency.aed(aed)}</span>
      {secondary ? (
        <span className="caption mt-1" dir="ltr">
          ≈ {secondary} {currency.currency}
        </span>
      ) : null}
    </span>
  );
}

/**
 * The currency picker.
 *
 * "field" is the labelled version the calculators use. "bare" is the compact
 * one in the site header — a select with no visible label, because a header
 * that explains its own controls is a header that has stopped being furniture.
 * Both carry an accessible name either way.
 */
export function CurrencyPicker({
  className,
  variant = "field",
}: {
  className?: string;
  variant?: "field" | "bare";
}) {
  const { currency, setCurrency, rates, detectedCountry } = useCurrency();
  const { t } = useLocale();

  const select = (
    <select
      id={variant === "field" ? "currency" : undefined}
      value={currency}
      aria-label={variant === "bare" ? t.currency.ariaLabel : undefined}
      onChange={(event) => setCurrency(event.target.value as CurrencyCode)}
      className={cn(
        "cursor-pointer border-0 bg-transparent text-foreground outline-none",
        variant === "field"
          ? "eyebrow border-b border-border pb-2 focus-visible:border-accent"
          : "text-sm text-foreground/70 transition-colors hover:text-accent",
      )}
    >
      {CURRENCIES.map((entry) => (
        <option key={entry.code} value={entry.code}>
          {variant === "bare" ? entry.code : `${entry.code} — ${entry.name}`}
        </option>
      ))}
    </select>
  );

  if (variant === "bare") return <div className={cn("flex items-center", className)}>{select}</div>;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor="currency" className="eyebrow">
        {t.currency.ariaLabel}
      </label>
      {select}
      {currency !== "AED" ? (
        <p className="caption">
          {rates.peggedOnly && currency !== "USD" ? t.currency.unavailable : rates.source}
        </p>
      ) : null}
      {/* Said once, where the visitor can act on it: a figure in their currency
       * that they did not ask for is confusing until they know why it is there. */}
      {detectedCountry && currency !== "AED" ? (
        <p className="caption">
          {t.currency.detected
            .replace("{currency}", currency)
            .replace("{country}", detectedCountry)}
        </p>
      ) : null}
    </div>
  );
}

/**
 * A listing price, with the visitor's currency beside it.
 *
 * The listing card, the listing page, the ticker and the project "from" prices
 * all reach for this rather than `formatPrice` directly. That is the whole of
 * "currency empathy": the moment that decides whether someone enquires is
 * seeing a number they can size against their own money, and until now that
 * only happened inside the calculators — a page most visitors never open.
 *
 * The conversion is parenthetical and set in the muted tone, so the dirham
 * figure still reads as the price and the rest reads as a note. It disappears
 * entirely when the visitor is reading in dirhams, when no rate is available,
 * or when there is no price to convert.
 */
export function Price({
  amount,
  currency: quoted = "AED",
  /** "year" / "month" for a rental. Omitted for a sale. */
  frequency,
  fallback,
  className,
}: {
  amount: number | null | undefined;
  currency?: string;
  frequency?: string | null;
  fallback?: string;
  className?: string;
}) {
  const money = useCurrency();
  const { t } = useLocale();

  if (amount === null || amount === undefined) {
    return <span className={className}>{fallback ?? "Price on application"}</span>;
  }

  /*
   * Only AED is converted. A listing quoted in another currency is rare and
   * would need a cross rate we do not hold — and inventing one on a
   * seven-figure price is precisely what the currency module exists to prevent.
   */
  const secondary = quoted === "AED" ? money.converted(amount) : null;
  const period = frequency ? ` / ${frequency.replace(/ly$/, "")}` : "";

  return (
    <span className={className}>
      <span dir="ltr" className="inline-block">
        {quoted === "AED" ? money.aed(amount) : `${quoted} ${amount.toLocaleString()}`}
        {period}
      </span>
      {secondary ? (
        <span dir="ltr" className="ms-2 inline-block text-muted-foreground">
          ({t.currency.approx} {secondary})
        </span>
      ) : null}
    </span>
  );
}
