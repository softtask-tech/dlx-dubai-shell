import { useId } from "react";

import { formatPeriod, type MarketGrain } from "@/data/market-public";
import type { RentGapPoint } from "@/data/market-insights";

/**
 * What a new tenant pays, against what a renewing one pays.
 *
 * The most useful chart this data can produce, and the reason is that both
 * medians are published separately and almost nobody puts them side by side.
 * The distance between the two lines is rental pressure, read directly: when a
 * newly signed tenancy registers well above a renewal, sitting tenants are
 * below the market, and an owner's income changes at the next re-let rather
 * than at renewal. When the lines close, that pressure has gone.
 *
 * For a buyer weighing a rented apartment it is the difference between an
 * asset whose income is already at market and one with a step change waiting
 * in it. For a tenant it is a warning about the renewal ahead.
 *
 * Drawn with a shaded band between the lines, because the band is the point:
 * the eye should read the gap, not the two levels.
 *
 * Both are medians across the whole city. They say nothing about any
 * individual building, which is stated under the chart rather than left to be
 * assumed.
 */
export function RentGap({
  points,
  grain,
  height = 260,
}: {
  points: readonly RentGapPoint[];
  grain: MarketGrain;
  height?: number;
}) {
  const id = useId();
  if (points.length < 2) return null;

  const width = 960;
  const values = points.flatMap((p) => [p.fresh, p.renewed]);
  /* Not a zero baseline here, and deliberately so: this chart is about the
   * distance between two lines, and a zero axis on rents in the tens of
   * thousands would flatten both into one. The axis is labelled with real
   * values at both ends so the scale is never implied. */
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = (max - min) * 0.18 || 1;
  const lo = min - pad;
  const hi = max + pad;

  const x = (i: number) => (i / (points.length - 1)) * width;
  const y = (v: number) => height - ((v - lo) / (hi - lo)) * height;

  const path = (pick: (p: RentGapPoint) => number) =>
    points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(pick(p))}`).join(" ");

  const freshLine = path((p) => p.fresh);
  const renewedLine = path((p) => p.renewed);
  const band = `${freshLine} L${x(points.length - 1)},${y(points[points.length - 1]!.renewed)} ${points
    .slice()
    .reverse()
    .map((p, i) => `L${x(points.length - 1 - i)},${y(p.renewed)}`)
    .join(" ")} Z`;

  const first = points[0]!;
  const last = points[points.length - 1]!;
  const fmt = (v: number) => `AED ${Math.round(v).toLocaleString("en-AE")}`;

  return (
    <figure className="m-0">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ height }}
        role="img"
        aria-labelledby={`${id}-t`}
        preserveAspectRatio="none"
      >
        <title id={`${id}-t`}>
          {`Median registered annual rent on new tenancies against renewals, ${formatPeriod(grain, first.periodStart)} to ${formatPeriod(grain, last.periodStart)}. In the latest period a new tenancy registered ${fmt(last.fresh)} against ${fmt(last.renewed)} on a renewal, a difference of ${last.gapPct.toFixed(1)}%. The figures follow in the table.`}
        </title>

        <defs>
          <linearGradient id={`${id}-band`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.34" />
            <stop offset="100%" stopColor="var(--gold)" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        <path d={band} fill={`url(#${id}-band)`} />
        <path
          d={renewedLine}
          fill="none"
          stroke="var(--green-mid)"
          strokeWidth="2.2"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d={freshLine}
          fill="none"
          stroke="var(--gold-ink)"
          strokeWidth="2.2"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      <div className="mt-4 flex flex-wrap items-center gap-x-7 gap-y-2">
        <p className="caption flex items-center gap-2">
          <span aria-hidden className="inline-block h-0.5 w-5 bg-gold-ink" />
          New tenancies
        </p>
        <p className="caption flex items-center gap-2">
          <span aria-hidden className="inline-block h-0.5 w-5 bg-green-mid" />
          Renewals
        </p>
        <p className="caption text-muted-foreground tabular-nums">
          Latest: {fmt(last.fresh)} against {fmt(last.renewed)}, a{" "}
          {last.gapPct >= 0 ? "premium" : "discount"} of {Math.abs(last.gapPct).toFixed(1)}%
        </p>
      </div>

      <figcaption className="body-text mt-5 max-w-measure text-muted-foreground">
        Both lines are medians across the whole of Dubai, so they describe the market rather than
        any one building. The gap is the useful part: while a new tenancy registers above a
        renewal, sitting tenants are below the market and an owner&rsquo;s income moves at the next
        re-let, not at renewal.
      </figcaption>

      <details className="mt-5 border-t border-border">
        <summary className="focus-ring eyebrow cursor-pointer list-none py-3 [&::-webkit-details-marker]:hidden">
          Show these figures as a table
        </summary>
        <div className="max-h-64 overflow-auto pb-4">
          <table className="w-full border-collapse">
            <caption className="sr-only">
              Median registered annual rent on new tenancies and on renewals, by period.
            </caption>
            <thead>
              <tr className="border-b border-border">
                <th scope="col" className="caption py-2 pe-4 text-start font-normal">
                  Period
                </th>
                <th scope="col" className="caption py-2 pe-4 text-start font-normal">
                  New tenancy
                </th>
                <th scope="col" className="caption py-2 pe-4 text-start font-normal">
                  Renewal
                </th>
                <th scope="col" className="caption py-2 text-start font-normal">
                  Difference
                </th>
              </tr>
            </thead>
            <tbody>
              {[...points].reverse().map((point) => (
                <tr key={point.periodStart} className="border-b border-border/60">
                  <th scope="row" className="caption py-2 pe-4 text-start font-normal">
                    {formatPeriod(grain, point.periodStart)}
                  </th>
                  <td className="caption py-2 pe-4 tabular-nums">{fmt(point.fresh)}</td>
                  <td className="caption py-2 pe-4 tabular-nums">{fmt(point.renewed)}</td>
                  <td className="caption py-2 tabular-nums">
                    {point.gapPct >= 0 ? "+" : ""}
                    {point.gapPct.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
