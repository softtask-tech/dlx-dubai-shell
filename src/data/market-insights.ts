/**
 * What the registry actually says, once you do the arithmetic.
 *
 * The published aggregates are counts and one median. On their own they are
 * facts without a reading: 36,857 registered sales is a number, not an
 * insight, and a page that prints it and stops has handed the reader the work.
 * This module does the work. Every function here takes published rows and
 * returns a comparison the rows support, and nothing else.
 *
 * Four rules, because this is the part of the site most able to mislead.
 *
 *  1. Nothing is estimated. A comparison is returned only when both sides of
 *     it were actually published. A missing quarter returns null and the page
 *     leaves the sentence out rather than reaching for the nearest period.
 *
 *  2. Year on year is a real year. It matches the same quarter twelve months
 *     back by date, not by counting four rows, because counting rows silently
 *     compares against the wrong period the moment one is unpublished.
 *
 *  3. Counts are compared with counts. A share is only taken between two
 *     segments of the same metric in the same period, so nothing is divided by
 *     a figure that was measuring something else.
 *
 *  4. The reading is separate from the figure. Each derivation returns the
 *     numbers; the sentence that interprets them is written next to the
 *     component that shows it, where a person can review the wording.
 */
import { latestRow, seriesFor, type MarketMetric, type MarketRow } from "./market-public";

/** Shifts an ISO period start by a whole number of months. */
function shiftMonths(periodStart: string, months: number): string {
  const [year, month] = periodStart.split("-").map(Number);
  if (!year || !month) return periodStart;
  const zero = (year * 12 + (month - 1)) + months;
  const y = Math.floor(zero / 12);
  const m = (zero % 12) + 1;
  return `${y}-${String(m).padStart(2, "0")}-01`;
}

/** Percentage change from `from` to `to`, or null where it cannot be taken. */
export function percentChange(from: number | undefined, to: number | undefined): number | null {
  if (from === undefined || to === undefined) return null;
  if (!Number.isFinite(from) || !Number.isFinite(to) || from === 0) return null;
  return ((to - from) / from) * 100;
}

export type Momentum = {
  latest: MarketRow;
  /** The period immediately before, where it was published. */
  previous: MarketRow | null;
  /** The same period one year earlier, matched by date. */
  yearAgo: MarketRow | null;
  /** Percent change against the previous period. */
  periodOnPeriod: number | null;
  /** Percent change against the same period a year earlier. */
  yearOnYear: number | null;
};

/**
 * The latest published figure for a metric, with both comparisons attached.
 *
 * Year on year is the one that matters in a market with a seasonal shape, and
 * Dubai has one: a quarter compared only with the quarter before it will
 * report a summer slowdown as a market turning.
 */
export function momentumFor(
  rows: readonly MarketRow[],
  metric: MarketMetric,
  segmentCode = "all",
  monthsPerPeriod = 3,
): Momentum | null {
  const series = seriesFor(rows, metric, segmentCode);
  const latest = latestRow(series);
  if (!latest) return null;

  const at = (periodStart: string) =>
    series.find((row) => row.period_start === periodStart) ?? null;

  const previous = at(shiftMonths(latest.period_start, -monthsPerPeriod));
  const yearAgo = at(shiftMonths(latest.period_start, -12));

  return {
    latest,
    previous,
    yearAgo,
    periodOnPeriod: percentChange(previous?.metric_value, latest.metric_value),
    yearOnYear: percentChange(yearAgo?.metric_value, latest.metric_value),
  };
}

export type SharePoint = {
  periodStart: string;
  a: number;
  b: number;
  total: number;
  /** Share of the total held by the first segment, 0 to 100. */
  aShare: number;
};

/**
 * How one metric splits between two of its segments, period by period.
 *
 * Only periods where both segments were published are returned. A period with
 * one side missing would otherwise render as a 100% share for whichever side
 * survived, which is the most misleading chart this data could produce.
 */
export function shareSeries(
  rows: readonly MarketRow[],
  metric: MarketMetric,
  segmentA: string,
  segmentB: string,
): SharePoint[] {
  const a = new Map(seriesFor(rows, metric, segmentA).map((row) => [row.period_start, row]));
  const b = new Map(seriesFor(rows, metric, segmentB).map((row) => [row.period_start, row]));

  const points: SharePoint[] = [];
  for (const [periodStart, rowA] of a) {
    const rowB = b.get(periodStart);
    if (!rowB) continue;
    const total = rowA.metric_value + rowB.metric_value;
    if (total <= 0) continue;
    points.push({
      periodStart,
      a: rowA.metric_value,
      b: rowB.metric_value,
      total,
      aShare: (rowA.metric_value / total) * 100,
    });
  }
  return points.sort((x, y) => x.periodStart.localeCompare(y.periodStart));
}

export type RentGapPoint = {
  periodStart: string;
  /** Median registered annual rent on contracts signed for the first time. */
  fresh: number;
  /** Median registered annual rent where an existing tenant stayed on. */
  renewed: number;
  /** How much more a new tenant paid, in percent. */
  gapPct: number;
};

/**
 * The premium a new tenant pays over a renewing one.
 *
 * This is the most useful thing in the published set and nobody publishes it.
 * Both medians are already there, separately, and the distance between them is
 * a direct read on rental pressure: when a new contract is registered well
 * above a renewal, the market has moved and sitting tenants are below it, so
 * an owner's next re-let is the moment the income changes. When the two
 * converge, that pressure has gone out of the market.
 *
 * It is a comparison of two published medians and nothing more. It is not a
 * forecast, and it says nothing about any individual building, which is why
 * the component that renders it says so.
 */
export function rentGapSeries(rows: readonly MarketRow[]): RentGapPoint[] {
  const fresh = new Map(
    seriesFor(rows, "median_registered_annual_rent_aed", "new").map((row) => [
      row.period_start,
      row.metric_value,
    ]),
  );
  const renewed = new Map(
    seriesFor(rows, "median_registered_annual_rent_aed", "renewed").map((row) => [
      row.period_start,
      row.metric_value,
    ]),
  );

  const points: RentGapPoint[] = [];
  for (const [periodStart, freshValue] of fresh) {
    const renewedValue = renewed.get(periodStart);
    if (renewedValue === undefined || renewedValue <= 0) continue;
    points.push({
      periodStart,
      fresh: freshValue,
      renewed: renewedValue,
      gapPct: ((freshValue - renewedValue) / renewedValue) * 100,
    });
  }
  return points.sort((x, y) => x.periodStart.localeCompare(y.periodStart));
}

/** "up 12.4%", "down 3.1%", "level" : a change, in words a reader uses. */
export function describeChange(change: number | null, precision = 1): string | null {
  if (change === null || !Number.isFinite(change)) return null;
  const magnitude = Math.abs(change);
  if (magnitude < 0.5) return "broadly level";
  return `${change > 0 ? "up" : "down"} ${magnitude.toFixed(precision)}%`;
}

/** The direction of a change, for an arrow or a colour. */
export function directionOf(change: number | null): "up" | "down" | "flat" {
  if (change === null || !Number.isFinite(change) || Math.abs(change) < 0.5) return "flat";
  return change > 0 ? "up" : "down";
}
