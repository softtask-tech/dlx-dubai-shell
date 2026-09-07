import { useId, useState } from "react";

import {
  METRIC_LABELS,
  formatExportDate,
  formatMetricValue,
  formatPeriod,
  latestRow,
  seriesFor,
  type MarketMetric,
  type MarketRow,
} from "@/data/market-public";
import { CountUp } from "@/components/market/count-up";
import { cn } from "@/lib/utils";

/**
 * The record, condensed to one interactive moment.
 *
 * The full Market Intelligence page carries five headline metrics, four
 * charts, the new-versus-renewed composition and a methodology note, and it
 * should. This is not that page. The homepage's job is to make one claim, "we
 * check", and give a curious reader somewhere to go; putting the whole data
 * page on the homepage is how a brochure site turns into a portal.
 *
 * So: three figures, one chart, two series, one link out.
 *
 * The honesty rules from the full page still apply here, because they are not
 * page-level decoration. The count axis starts at zero, since a cropped
 * baseline exaggerates a movement that is not there. A period with no
 * published figure is not drawn, because an interpolated point is an invented
 * one. And the chart is never the only reading: the same numbers sit in a
 * table underneath it, reachable by keyboard and by a screen reader.
 */

const SERIES: readonly { metric: MarketMetric; label: string }[] = [
  { metric: "registered_sale_count", label: "Sales" },
  { metric: "registered_rental_contract_count", label: "Rentals" },
];

export function MarketGlance({
  rows,
  sourceExportDate,
  marketHref,
}: {
  rows: readonly MarketRow[];
  sourceExportDate: string | null;
  marketHref: string;
}) {
  const [active, setActive] = useState<MarketMetric>("registered_sale_count");

  const sales = seriesFor(rows, "registered_sale_count");
  const rentals = seriesFor(rows, "registered_rental_contract_count");
  const rent = seriesFor(rows, "median_registered_annual_rent_aed");

  const latestSale = latestRow(sales);
  const latestRental = latestRow(rentals);
  const latestRent = latestRow(rent);

  /* Nothing published yet means no section at all, rather than a card of
   * dashes explaining that there is nothing to say. */
  if (!latestSale && !latestRental && !latestRent) return null;

  const period = latestSale ?? latestRental ?? latestRent;
  const periodLabel = period ? formatPeriod("quarter", period.period_start) : null;
  const points = active === "registered_sale_count" ? sales : rentals;

  const figures = [
    {
      row: latestSale,
      metric: "registered_sale_count" as const,
      label: "Registered sale transactions",
      note: periodLabel ? `Latest complete quarter, ${periodLabel}` : "Latest complete quarter",
    },
    {
      row: latestRental,
      metric: "registered_rental_contract_count" as const,
      label: "Registered rental contracts",
      note: "Same period",
    },
    {
      row: latestRent,
      metric: "median_registered_annual_rent_aed" as const,
      label: "Median registered annual rent",
      note: "Half were agreed below it, half above",
    },
  ].filter((figure) => figure.row !== null);

  return (
    <div className="glass mt-12 grid lg:grid-cols-[0.85fr_1.15fr]">
      <div className="flex flex-col justify-center gap-8 border-b border-white/12 p-7 sm:p-9 lg:border-b-0 lg:border-e">
        {figures.map((figure) => (
          <div key={figure.metric}>
            <p className="font-display text-3xl leading-none tabular-nums sm:text-4xl">
              {figure.metric === "median_registered_annual_rent_aed" ? (
                <CountUp value={figure.row!.metric_value} prefix="AED " />
              ) : (
                <CountUp value={figure.row!.metric_value} />
              )}
            </p>
            <p className="caption mt-2 text-on-dark">{figure.label}</p>
            <p className="caption text-on-dark-muted">{figure.note}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col p-7 sm:p-9">
        <div role="group" aria-label="Which series to show" className="flex gap-2">
          {SERIES.map((series) => (
            <button
              key={series.metric}
              type="button"
              aria-pressed={active === series.metric}
              onClick={() => setActive(series.metric)}
              className={cn(
                "focus-ring min-h-11 rounded-full border px-5 text-xs font-semibold transition-colors",
                active === series.metric
                  ? "border-gold bg-gold text-ink"
                  : "border-white/20 text-on-dark-muted hover:text-on-dark",
              )}
            >
              {series.label}
            </button>
          ))}
        </div>

        <GlanceChart points={points} metric={active} />

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/12 pt-5">
          <p className="caption text-on-dark-muted">
            <span aria-hidden className="me-2 inline-block size-1.5 rounded-full bg-gold" />
            Source: Dubai Land Department
            {sourceExportDate ? `, export ${formatExportDate(sourceExportDate)}` : null}
          </p>
          <a href={marketHref} className="focus-ring caption font-semibold text-gold hover:underline">
            Open full Market Intelligence
          </a>
        </div>
      </div>
    </div>
  );
}

/**
 * One series, drawn as an area under a line that draws itself in.
 *
 * The stroke animates via `stroke-dashoffset` on a path whose length is
 * measured in the browser, so the line writes itself on rather than fading.
 * Switching series re-runs it, which is what makes the toggle feel like a
 * redraw rather than a swap.
 */
function GlanceChart({
  points,
  metric,
}: {
  points: readonly MarketRow[];
  metric: MarketMetric;
}) {
  const id = useId();

  if (points.length < 2) {
    return (
      <p className="body-text mt-8 text-on-dark-muted">
        Not enough published periods to draw this series yet.
      </p>
    );
  }

  const width = 480;
  const height = 170;
  const values = points.map((point) => point.metric_value);
  /* Zero baseline, always. A cropped axis is the easiest way to make a flat
   * quarter look like a boom. */
  const max = Math.max(...values, 1);

  const coordinates = points.map((point, index) => ({
    point,
    x: (index / (points.length - 1)) * width,
    y: height - (point.metric_value / max) * height,
  }));

  const line = coordinates
    .map((coordinate, index) => `${index === 0 ? "M" : "L"}${coordinate.x},${coordinate.y}`)
    .join(" ");
  const area = `${line} L${width},${height} L0,${height} Z`;

  const first = points[0]!;
  const last = points[points.length - 1]!;

  return (
    <figure className="m-0 mt-7 flex flex-1 flex-col">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-[170px] w-full"
        role="img"
        aria-labelledby={`${id}-title`}
        preserveAspectRatio="none"
      >
        <title id={`${id}-title`}>
          {METRIC_LABELS[metric]} by quarter, {formatPeriod("quarter", first.period_start)} to{" "}
          {formatPeriod("quarter", last.period_start)}. The same figures are in the table below.
        </title>
        <defs>
          <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="var(--gold)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Keyed on the metric so React replaces the nodes on a toggle, which
            restarts the draw-in instead of tweening between two shapes. */}
        <path key={`${metric}-area`} d={area} fill={`url(#${id}-fill)`} className="glance-area" />
        <path
          key={`${metric}-line`}
          d={line}
          fill="none"
          stroke="var(--gold)"
          strokeWidth="2.4"
          vectorEffect="non-scaling-stroke"
          className="glance-line"
        />
      </svg>

      <figcaption className="sr-only">
        {METRIC_LABELS[metric]}, {formatPeriod("quarter", first.period_start)} to{" "}
        {formatPeriod("quarter", last.period_start)}.
      </figcaption>

      <details className="mt-4">
        <summary className="focus-ring caption cursor-pointer list-none py-1 text-on-dark-muted [&::-webkit-details-marker]:hidden">
          Show these figures as a table
        </summary>
        <div className="mt-2 max-h-56 overflow-auto">
          <table className="w-full border-collapse text-start">
            <caption className="sr-only">
              {METRIC_LABELS[metric]} by quarter, with the number of registered records behind each
              figure.
            </caption>
            <thead>
              <tr className="border-b border-white/12">
                <th scope="col" className="caption py-2 pe-4 text-start font-normal">
                  Quarter
                </th>
                <th scope="col" className="caption py-2 pe-4 text-start font-normal">
                  {METRIC_LABELS[metric]}
                </th>
                <th scope="col" className="caption py-2 text-start font-normal">
                  Records
                </th>
              </tr>
            </thead>
            <tbody>
              {[...points].reverse().map((point) => (
                <tr key={point.aggregate_key} className="border-b border-white/8">
                  <th scope="row" className="caption py-2 pe-4 text-start font-normal">
                    {formatPeriod("quarter", point.period_start)}
                  </th>
                  <td className="caption py-2 pe-4 tabular-nums whitespace-nowrap">
                    {formatMetricValue(metric, point.metric_value)}
                  </td>
                  <td className="caption py-2 tabular-nums">
                    {point.observation_count.toLocaleString("en-AE")}
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
