import { useId } from "react";

import { formatPeriod, type MarketGrain } from "@/data/market-public";
import type { SharePoint } from "@/data/market-insights";

/**
 * How a total splits between two kinds, over time.
 *
 * Drawn as a filled share rather than two counts, because the question this
 * answers is compositional: not "how many off-plan sales were there" but "what
 * proportion of the market was off-plan". Counts would let a busy quarter look
 * like a shift in composition when nothing about the mix had changed.
 *
 * The axis is fixed at 0 to 100 and labelled at both ends. A share chart with
 * a floating axis is the most quietly dishonest chart there is: a mix moving
 * between 48% and 52% can be drawn to look like a market inverting.
 *
 * Only periods where both segments were published are plotted, which
 * `shareSeries` guarantees, so a gap in the registry never renders as one side
 * taking the whole market.
 */
export function CompositionSeries({
  points,
  grain,
  aLabel,
  bLabel,
  caption,
  height = 220,
}: {
  points: readonly SharePoint[];
  grain: MarketGrain;
  /** The segment drawn along the bottom. */
  aLabel: string;
  /** The remainder, drawn above it. */
  bLabel: string;
  caption: string;
  height?: number;
}) {
  const id = useId();
  if (points.length < 2) return null;

  const width = 960;
  const x = (index: number) => (index / (points.length - 1)) * width;
  const y = (share: number) => height - (share / 100) * height;

  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p.aShare)}`).join(" ");
  const area = `${line} L${width},${height} L0,${height} Z`;

  const first = points[0]!;
  const last = points[points.length - 1]!;
  const halfway = y(50);

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
          Share of registered activity that was {aLabel}, {formatPeriod(grain, first.periodStart)} to{" "}
          {formatPeriod(grain, last.periodStart)}, moving between{" "}
          {Math.min(...points.map((p) => p.aShare)).toFixed(0)}% and{" "}
          {Math.max(...points.map((p) => p.aShare)).toFixed(0)}%. The figures follow in the table.
        </title>
        <defs>
          <linearGradient id={`${id}-f`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--green-mid)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--green-mid)" stopOpacity="0.06" />
          </linearGradient>
        </defs>

        {/* The halfway line, because "more than half" is the reading. */}
        <line
          x1="0"
          x2={width}
          y1={halfway}
          y2={halfway}
          stroke="var(--border-strong)"
          strokeDasharray="4 4"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
        <path d={area} fill={`url(#${id}-f)`} />
        <path
          d={line}
          fill="none"
          stroke="var(--green-mid)"
          strokeWidth="2.2"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <p className="caption text-muted-foreground">
          <span aria-hidden className="me-2 inline-block size-2 bg-green-mid/40" />
          {aLabel}, against {bLabel}. Dashed line is half the market.
        </p>
        <p className="caption text-muted-foreground tabular-nums">
          {formatPeriod(grain, first.periodStart)} to {formatPeriod(grain, last.periodStart)}
        </p>
      </div>

      <figcaption className="body-text mt-4 max-w-measure text-muted-foreground">
        {caption}
      </figcaption>

      <details className="mt-4 border-t border-border">
        <summary className="focus-ring eyebrow cursor-pointer list-none py-3 [&::-webkit-details-marker]:hidden">
          Show these figures as a table
        </summary>
        <div className="max-h-64 overflow-auto pb-4">
          <table className="w-full border-collapse">
            <caption className="sr-only">
              Share of registered activity that was {aLabel}, by period, with both counts.
            </caption>
            <thead>
              <tr className="border-b border-border">
                <th scope="col" className="caption py-2 pe-4 text-start font-normal">
                  Period
                </th>
                <th scope="col" className="caption py-2 pe-4 text-start font-normal">
                  {aLabel}
                </th>
                <th scope="col" className="caption py-2 pe-4 text-start font-normal">
                  {bLabel}
                </th>
                <th scope="col" className="caption py-2 text-start font-normal">
                  Share
                </th>
              </tr>
            </thead>
            <tbody>
              {[...points].reverse().map((point) => (
                <tr key={point.periodStart} className="border-b border-border/60">
                  <th scope="row" className="caption py-2 pe-4 text-start font-normal">
                    {formatPeriod(grain, point.periodStart)}
                  </th>
                  <td className="caption py-2 pe-4 tabular-nums">
                    {Math.round(point.a).toLocaleString("en-AE")}
                  </td>
                  <td className="caption py-2 pe-4 tabular-nums">
                    {Math.round(point.b).toLocaleString("en-AE")}
                  </td>
                  <td className="caption py-2 tabular-nums">{point.aShare.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
