/**
 * Presentation helpers for listing data.
 *
 * The rule running through all of these: an absent value is never rendered as
 * zero or as a guess. Price-on-application is a real, common state for the
 * off-market work DLX does, and it has to read as deliberate.
 */

const AED = new Intl.NumberFormat("en-AE", { maximumFractionDigits: 0 });

/** "AED 4,250,000", or the given fallback when there is no price. */
export function formatPrice(
  price: number | null | undefined,
  currency = "AED",
  fallback = "Price on application",
): string {
  if (price === null || price === undefined) return fallback;
  return `${currency} ${AED.format(price)}`;
}

/** "AED 180,000 / year" for a rental, plain price for a sale. */
export function formatRent(
  price: number | null | undefined,
  currency: string,
  frequency: string | null,
): string {
  const base = formatPrice(price, currency);
  if (price === null || price === undefined || !frequency) return base;
  return `${base} / ${frequency.replace(/ly$/, "")}`;
}

/** "2,140 sq ft", or an em dash. */
export function formatArea(sqft: number | null | undefined): string {
  if (sqft === null || sqft === undefined) return "—";
  return `${AED.format(sqft)} sq ft`;
}

/** "3 beds", "Studio", or an em dash. */
export function formatBedrooms(bedrooms: number | null | undefined): string {
  if (bedrooms === null || bedrooms === undefined) return "—";
  if (bedrooms === 0) return "Studio";
  return `${bedrooms} bed${bedrooms === 1 ? "" : "s"}`;
}

/** Turns an enum value into something a person would say. */
export function humanise(value: string | null | undefined): string {
  if (!value) return "—";
  return value.replace(/_/g, " ").replace(/^\w/, (character) => character.toUpperCase());
}

/** "Q4 2027" from the quarter and year a project hands over. */
export function formatHandover(quarter: number | null, year: number | null): string {
  if (!year) return "—";
  return quarter ? `Q${quarter} ${year}` : String(year);
}

/** "August 2026" — used on freshness stamps. */
export function formatMonth(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}
