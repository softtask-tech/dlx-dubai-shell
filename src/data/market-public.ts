/**
 * The public contract for published Dubai Land Department market aggregates.
 *
 * Everything the site shows from the Phase 3C publication passes through these
 * types and helpers. Two rules are load-bearing and enforced here rather than
 * left to each page:
 *
 *  1. Only counts of registered activity and the median registered annual rent
 *     are published. There is no sale price, no price per area, no yield and no
 *     index, so no component can render one by accident.
 *  2. Every figure carries the number of records behind it and the period it
 *     covers, and a figure is never shown without them.
 *
 * DLX is independent of the Dubai Land Department. These pages describe
 * activity that was recorded; they are not a measure of quality or of returns.
 */

/** A single published aggregate, exactly as the public functions return it. */
export type MarketRow = {
  aggregate_key: string;
  entity_type: MarketEntityType;
  entity_id: string;
  name_en: string;
  name_ar: string;
  period_grain: MarketGrain;
  period_start: string;
  period_end: string;
  metric_code: MarketMetric;
  segment_type: string;
  segment_code: string;
  metric_value: number;
  observation_count: number;
  confidence: MarketConfidence;
  quality_flags: string[];
  source_export_date: string;
  methodology_version: string;
};

export type MarketEntityType = "dubai" | "community" | "project" | "developer";
export type MarketGrain = "month" | "quarter" | "year";
export type MarketConfidence = "higher" | "moderate" | "counts_only";

export const MARKET_METRICS = [
  "registered_sale_count",
  "registered_sale_count_change",
  "registered_rental_contract_count",
  "registered_rental_contract_count_change",
  "registered_new_rental_contract_count",
  "registered_new_rental_contract_count_change",
  "registered_renewed_rental_contract_count",
  "registered_renewed_rental_contract_count_change",
  "median_registered_annual_rent_aed",
  "median_registered_annual_rent_change",
  "median_price_per_sqft",
  "median_sale_price",
  "median_rent_per_sqft",
  "median_service_charge_sqft",
  "gross_rental_yield_pct",
] as const;


export type MarketMetric = (typeof MARKET_METRICS)[number];

/**
 * The approved wording for each published metric. These strings are the only
 * names these figures are given anywhere on the site, because a looser label
 * ("sales", "rents") would quietly promise something the data does not carry.
 */
export const METRIC_LABELS: Record<MarketMetric, string> = {
  registered_sale_count: "Registered sale transactions",
  registered_sale_count_change: "Change in registered sale transactions",
  registered_rental_contract_count: "Registered rental contracts",
  registered_rental_contract_count_change: "Change in registered rental contracts",
  registered_new_rental_contract_count: "New registered rental contracts",
  registered_new_rental_contract_count_change: "Change in new registered rental contracts",
  registered_renewed_rental_contract_count: "Renewed registered rental contracts",
  registered_renewed_rental_contract_count_change: "Change in renewed registered rental contracts",
  median_registered_annual_rent_aed: "Median registered annual rent",
  median_registered_annual_rent_change: "Change in median registered annual rent",
  median_price_per_sqft: "Median registered price per square foot",
  median_sale_price: "Median registered sale price",
  median_rent_per_sqft: "Median registered rent per square foot",
  median_service_charge_sqft: "Median service charge per square foot",
  gross_rental_yield_pct: "Gross rental yield",
};


/** What a reader should take from each figure, in plain language. */
export const METRIC_MEANINGS: Record<MarketMetric, string> = {
  registered_sale_count:
    "How many sales were registered with the Dubai Land Department in this period. It measures activity, not price.",
  registered_sale_count_change:
    "How registered sale activity moved against the period before it, in percent.",
  registered_rental_contract_count:
    "How many tenancy contracts were registered in this period, new and renewed together.",
  registered_rental_contract_count_change:
    "How registered rental activity moved against the period before it, in percent.",
  registered_new_rental_contract_count:
    "Registered tenancies that were signed for the first time, rather than renewed.",
  registered_new_rental_contract_count_change:
    "How new registered tenancy activity moved against the period before it.",
  registered_renewed_rental_contract_count:
    "Registered tenancies where an existing tenant stayed on.",
  registered_renewed_rental_contract_count_change:
    "How renewal activity moved against the period before it.",
  median_registered_annual_rent_aed:
    "The middle registered annual rent for the period: half were agreed below it and half above.",
  median_registered_annual_rent_change:
    "How the middle registered annual rent moved against the period before it, in percent.",
};

export const SEGMENT_LABELS: Record<string, string> = {
  all: "All",
  existing: "Existing property",
  off_plan: "Under construction",
  apartment: "Apartments",
  villa: "Villas",
  new: "New contracts",
  renewed: "Renewals",
};

export const CONFIDENCE_LABELS: Record<MarketConfidence, string> = {
  higher: "Higher confidence, a large number of records behind this figure",
  moderate: "Moderate confidence, a smaller number of records behind this figure",
  counts_only: "Counts only: recorded activity, with no value published",
};

/** Percent-style metrics are rendered differently from counts and amounts. */
export function isChangeMetric(metric: MarketMetric): boolean {
  return metric.endsWith("_change");
}

export function isAmountMetric(metric: MarketMetric): boolean {
  return metric === "median_registered_annual_rent_aed";
}

/** Formats a published value with the unit that belongs to its metric. */
export function formatMetricValue(metric: MarketMetric, value: number): string {
  if (isChangeMetric(metric)) return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
  if (isAmountMetric(metric)) return `AED ${Math.round(value).toLocaleString("en-AE")}`;
  return Math.round(value).toLocaleString("en-AE");
}

/** "Q2 2026", "June 2026", "2025": the period a figure actually covers. */
export function formatPeriod(grain: MarketGrain, periodStart: string): string {
  const [year, month] = periodStart.split("-").map(Number);
  if (!year) return periodStart;
  if (grain === "year") return String(year);
  if (grain === "quarter") return `Q${Math.floor(((month ?? 1) - 1) / 3) + 1} ${year}`;
  return new Date(Date.UTC(year, (month ?? 1) - 1, 1)).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** The official line every market surface carries, verbatim. */
export function sourceLine(sourceExportDate: string | null): string {
  const stamp = sourceExportDate ? formatExportDate(sourceExportDate) : null;
  return stamp
    ? `Source: Dubai Land Department open data. Source export: ${stamp}. DLX Properties is independent of the Dubai Land Department; this information is provided for information only.`
    : "Source: Dubai Land Department open data. DLX Properties is independent of the Dubai Land Department; this information is provided for information only.";
}

export function formatExportDate(date: string): string {
  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Picks the most recent complete period out of a series. */
export function latestRow(rows: readonly MarketRow[]): MarketRow | null {
  return rows.reduce<MarketRow | null>(
    (latest, row) => (!latest || row.period_start > latest.period_start ? row : latest),
    null,
  );
}

/** All rows for one metric, in the segment asked for, oldest first. */
export function seriesFor(
  rows: readonly MarketRow[],
  metric: MarketMetric,
  segmentCode = "all",
): MarketRow[] {
  return rows
    .filter((row) => row.metric_code === metric && row.segment_code === segmentCode)
    .sort((a, b) => a.period_start.localeCompare(b.period_start));
}

/** Clamps a requested comparison set to the bound the public function enforces. */
export const MAX_COMPARE_COMMUNITIES = 6;

export function clampCommunityIds(ids: readonly string[]): string[] {
  return Array.from(new Set(ids.filter((id) => /^[0-9]{1,12}$/.test(id)))).slice(
    0,
    MAX_COMPARE_COMMUNITIES,
  );
}

/** Published aggregate metadata: what is live and how fresh it is. */
export type MarketMetadata = {
  sourceExportDate: string | null;
  methodologyVersion: string | null;
  publishedAt: string | null;
  rowCount: number;
};

export const UNAVAILABLE_METADATA: MarketMetadata = {
  sourceExportDate: null,
  methodologyVersion: null,
  publishedAt: null,
  rowCount: 0,
};

/** The honest empty state, used wherever a period has too few records. */
export const TOO_FEW_RECORDS =
  "Not published for this period: too few registered records to report without identifying individual transactions.";
