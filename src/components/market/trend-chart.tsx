import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";

import type { AreaPricePoint } from "@/data/market-types";
import { cn } from "@/lib/utils";

/**
 * A price line that draws itself.
 *
 * Hand-built SVG rather than a charting library: this is one line, one accent,
 * and a couple of labels, and a library would bring 40kB of axes and legends
 * we would then spend longer suppressing than drawing.
 *
 * The path is server-rendered complete. The drawing effect is a dash offset
 * animated on the client, so the chart is a finished picture for anyone who
 * never runs the animation — including under reduced motion, where it appears
 * fully drawn immediately.
 */
export function TrendChart({
  points,
  className,
  height = 260,
  label,
}: {
  points: readonly AreaPricePoint[];
  className?: string;
  height?: number;
  label?: string;
}) {
  const reduced = useReducedMotion();
  const ref = useRef<SVGSVGElement>(null);
  const [drawn, setDrawn] = useState(false);

  const usable = points.filter(
    (point): point is AreaPricePoint & { median_price_per_sqft: number } =>
      point.median_price_per_sqft !== null,
  );

  useEffect(() => {
    if (reduced || usable.length < 2) {
      setDrawn(true);
      return;
    }
    const element = ref.current;
    if (!element || typeof IntersectionObserver === "undefined") {
      setDrawn(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        setDrawn(true);
        observer.disconnect();
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [reduced, usable.length]);

  /* Two points is the minimum that can honestly be called a trend. */
  if (usable.length < 2) return null;

  const width = 1000;
  const padding = { top: 24, right: 8, bottom: 32, left: 8 };
  const values = usable.map((point) => point.median_price_per_sqft);
  const min = Math.min(...values);
  const max = Math.max(...values);
  /* A little headroom, so the line never grazes the frame. */
  const range = max - min || 1;
  const low = min - range * 0.12;
  const high = max + range * 0.12;

  const x = (index: number) =>
    padding.left + (index / (usable.length - 1)) * (width - padding.left - padding.right);
  const y = (value: number) =>
    padding.top + (1 - (value - low) / (high - low)) * (height - padding.top - padding.bottom);

  const line = usable
    .map(
      (point, index) =>
        `${index === 0 ? "M" : "L"} ${x(index).toFixed(1)} ${y(point.median_price_per_sqft).toFixed(1)}`,
    )
    .join(" ");

  const areaPath =
    `${line} L ${x(usable.length - 1).toFixed(1)} ${height - padding.bottom} ` +
    `L ${x(0).toFixed(1)} ${height - padding.bottom} Z`;

  const first = usable[0];
  const last = usable[usable.length - 1];
  const monthLabel = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GB", { month: "short", year: "2-digit" });

  return (
    <figure className={cn("w-full", className)}>
      <svg
        ref={ref}
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full overflow-visible"
        role="img"
        aria-label={
          label ??
          `Median price per square foot from ${monthLabel(first!.period_month)} to ${monthLabel(last!.period_month)}`
        }
      >
        {/* A soft sand wash under the line, for weight rather than decoration. */}
        <path
          d={areaPath}
          fill="var(--color-accent-soft)"
          opacity={drawn ? 0.5 : 0}
          className="transition-opacity duration-slow ease-editorial"
        />

        <path
          d={line}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          /* pathLength normalises the dash maths regardless of real length. */
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={drawn ? 0 : 1}
          style={{
            transition: reduced
              ? "none"
              : "stroke-dashoffset 1600ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        />

        {/* The end point, so the eye lands where the line finishes. */}
        <circle
          cx={x(usable.length - 1)}
          cy={y(last!.median_price_per_sqft)}
          r={4}
          fill="var(--color-accent)"
          opacity={drawn ? 1 : 0}
          className="transition-opacity duration-slow ease-editorial"
        />
      </svg>

      <figcaption className="mt-3 flex items-baseline justify-between">
        <span className="caption">{monthLabel(first!.period_month)}</span>
        <span className="caption">{monthLabel(last!.period_month)}</span>
      </figcaption>
    </figure>
  );
}
