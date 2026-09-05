import { useId } from "react";

import {
  CONFIDENCE_LABELS,
  METRIC_LABELS,
  METRIC_MEANINGS,
  TOO_FEW_RECORDS,
  formatMetricValue,
  formatPeriod,
  isChangeMetric,
  type MarketGrain,
  type MarketMetric,
  type MarketRow,
} from "@/data/market-public";
import { cn } from "@/lib/utils";

/**
 * One published series, drawn honestly.
 *
 * The chart is hand-built SVG for the same reason the price line is: this is a
 * single quantity over time and a charting library would arrive with axes and
 * legends we would spend longer suppressing than drawing.
 *
 * Three things it will not do. It will not draw a period with no published
 * value, because an interpolated point is an invented figure. It will not start
 * a count axis anywhere but zero, because a cropped baseline exaggerates a
 * movement that is not there. And it never appears without the table beneath
 * it: the table is the accessible reading of exactly the same numbers, keyboard
 * reachable and readable by a screen reader, not a fallback for one.
 */
export function RegisteredSeries({
  rows,
  metric,
  grain,
  title,
  description,
  className,
  height = 260,
}: {
  rows: readonly MarketRow[];
  metric: MarketMetric;
  grain: MarketGrain;
  title?: string;
  description?: string;
  className?: string;
  height?: number;
}) {
  const tableId = useId();
  const heading = title ?? METRIC_LABELS[metric];
  const points = [...rows].sort((a, b) => a.period_start.localeCompare(b.period_start));

  if (points.length === 0) {
    return (
      <div className={cn("border border-border p-8", className)}>
        <h3 className="lead">{heading}</h3>
        <p className="body-text mt-4 max-w-measure text-muted-foreground">{TOO_FEW_RECORDS}</p>
      </div>
    );
  }

  const values = points.map((point) => point.metric_value);
  const change = isChangeMetric(metric);
  const max = Math.max(...values, change ? 0 : 1);
  const min = change ? Math.min(...values, 0) : 0;
  const span = max - min || 1;
  const width = 1000;
  const inner = height - 28;

  const coordinates = points.map((point, index) => ({
    point,
    x: points.length === 1 ? width / 2 : (index / (points.length - 1)) * width,
    y: inner - ((point.metric_value - min) / span) * inner,
  }));

  const path = coordinates
    .map((coordinate, index) => `${index === 0 ? "M" : "L"}${coordinate.x} ${coordinate.y}`)
    .join(" ");

  const zeroY = change ? inner - ((0 - min) / span) * inner : inner;
  const observations = points.reduce((total, point) => total + point.observation_count, 0);
  const first = points[0]!;
  const last = points[points.length - 1]!;

  return (
    <figure className={cn("m-0", className)}>
      <figcaption>
        <h3 className="lead">{heading}</h3>
        <p className="body-text mt-3 max-w-measure text-muted-foreground">
          {description ?? METRIC_MEANINGS[metric]}
        </p>
        <p className="caption mt-3">
          {formatPeriod(grain, first.period_start)} to {formatPeriod(grain, last.period_start)} ·{" "}
          {observations.toLocaleString("en-AE")} registered records ·{" "}
          {CONFIDENCE_LABELS[last.confidence]}
        </p>
      </figcaption>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="mt-6 w-full"
        style={{ height }}
        role="img"
        aria-labelledby={`${tableId}-alt`}
        preserveAspectRatio="none"
      >
        <title id={`${tableId}-alt`}>
          {heading}, {formatPeriod(grain, first.period_start)} to{" "}
          {formatPeriod(grain, last.period_start)}. Full figures follow in the table below.
        </title>
        <line
          x1="0"
          x2={width}
          y1={zeroY}
          y2={zeroY}
          stroke="var(--border)"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d={path}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
        {coordinates.map((coordinate) => (
          <circle
            key={coordinate.point.aggregate_key}
            cx={coordinate.x}
            cy={coordinate.y}
            r="3"
            fill="var(--accent)"
          >
            <title>
              {formatPeriod(grain, coordinate.point.period_start)}:{" "}
              {formatMetricValue(metric, coordinate.point.metric_value)} from{" "}
              {coordinate.point.observation_count.toLocaleString("en-AE")} registered records
            </title>
          </circle>
        ))}
      </svg>

      <details className="mt-4 border-t border-border">
        <summary className="eyebrow cursor-pointer list-none py-4 [&::-webkit-details-marker]:hidden">
          Show these figures as a table
        </summary>
        <div className="overflow-x-auto pb-6">
          <table className="w-full min-w-[32rem] border-collapse">
            <caption className="caption pb-4 text-left">
              {heading} by {grain === "year" ? "year" : grain}, with the number of registered
              records behind each figure.
            </caption>
            <thead>
              <tr className="border-b border-border">
                <th scope="col" className="eyebrow py-3 pr-6 text-left font-normal">
                  Period
                </th>
                <th scope="col" className="eyebrow py-3 pr-6 text-left font-normal">
                  {heading}
                </th>
                <th scope="col" className="eyebrow py-3 text-left font-normal">
                  Records
                </th>
              </tr>
            </thead>
            <tbody>
              {points.map((point) => (
                <tr key={point.aggregate_key} className="border-b border-border/60">
                  <th scope="row" className="caption py-3 pr-6 text-left font-normal">
                    {formatPeriod(grain, point.period_start)}
                  </th>
                  <td className="caption py-3 pr-6 whitespace-nowrap">
                    {formatMetricValue(metric, point.metric_value)}
                  </td>
                  <td className="caption py-3">
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
