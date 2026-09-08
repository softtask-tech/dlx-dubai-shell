import { useId, useMemo, useState } from "react";

import type { LeagueRow } from "./community-league";
import { cn } from "@/lib/utils";

/**
 * Price against yield, for every community that publishes both.
 *
 * The league table ranks communities. This answers the question ranking cannot:
 * does paying more get you less, and by how much.
 *
 * The received wisdom in Dubai is that cheap yields high and expensive yields
 * low. Drawn out, that is only a third true, and the honest version is more
 * useful than the slogan. Fitting price against yield on the published figures
 * explains about a fifth of the variation — too weak to draw a trend line
 * through, and drawing one anyway would dress a weak relationship up as a rule.
 *
 * What the figures do support is narrower and sharper: price sets a ceiling,
 * not a floor. Nothing in the most expensive third of Dubai yields above 6.5%.
 * But the cheapest third contains both the best yield in the city and the
 * worst, which means a low price buys you nothing on its own. Two communities
 * can sit at an identical price per square foot and be nearly two to one apart
 * on income, and this chart exists to put that pair on screen.
 *
 * SORTED, NOT FILTERED, like the table it sits under: every community with
 * both figures published is plotted, including the ones DLX does not sell in.
 */
type Point = {
  id: string;
  name: string;
  price: number;
  yieldPct: number;
  afterCharge: number | null;
  sales: number;
};

/** The widest yield gap between two communities priced within 5% of each other. */
type Twin = { low: Point; high: Point; gap: number };

function nearestPair(points: readonly Point[]): Twin | null {
  const byPrice = [...points].sort((a, b) => a.price - b.price);
  let best: Twin | null = null;
  for (let i = 0; i < byPrice.length; i += 1) {
    const left = byPrice[i]!;
    for (let j = i + 1; j < byPrice.length; j += 1) {
      const right = byPrice[j]!;
      /* Sorted by price, so once we are outside the band every later community
       * is too, and the inner loop can stop rather than scan on. */
      if (right.price > left.price * 1.05) break;
      const gap = Math.abs(left.yieldPct - right.yieldPct);
      if (!best || gap > best.gap) {
        best =
          left.yieldPct >= right.yieldPct
            ? { high: left, low: right, gap }
            : { high: right, low: left, gap };
      }
    }
  }
  /* Below about a point and a half the pair is a rounding difference rather
   * than a finding, and it should not be written up as one. */
  return best && best.gap >= 1.5 ? best : null;
}

const aed = (value: number) => `AED ${Math.round(value).toLocaleString("en-AE")}`;
const pct = (value: number) => `${value.toFixed(2)}%`;

export function YieldPriceMap({
  rows,
  periodLabel,
}: {
  rows: readonly LeagueRow[];
  periodLabel: string;
}) {
  const id = useId();
  const [active, setActive] = useState<string | null>(null);

  const points = useMemo<Point[]>(
    () =>
      rows.flatMap((row) => {
        const price = row.values["median_price_per_sqft"];
        const yieldPct = row.values["gross_rental_yield_pct"];
        if (price == null || yieldPct == null) return [];
        return [
          {
            id: row.entityId,
            name: row.name,
            price,
            yieldPct,
            afterCharge: row.values["yield_after_charge_pct"] ?? null,
            sales: row.observations,
          },
        ];
      }),
    [rows],
  );

  const twin = useMemo(() => nearestPair(points), [points]);

  /* Under a dozen communities this is a handful of dots rather than a picture
   * of a market, and the table above says it better. */
  if (points.length < 12) return null;

  const box = { w: 960, h: 460 };
  const prices = points.map((point) => point.price);
  const yields = points.map((point) => point.yieldPct);

  /*
   * The axes start from the data, not from zero.
   *
   * A price axis beginning at zero when the cheapest community is AED 1,036
   * would squeeze every point into the right-hand third and flatten the exact
   * spread this chart exists to show. Both ends of both axes are printed, so
   * the scale is stated rather than implied.
   */
  const lo = { x: Math.min(...prices), y: Math.min(...yields) };
  const hi = { x: Math.max(...prices), y: Math.max(...yields) };
  const span = {
    x0: lo.x - (hi.x - lo.x) * 0.06,
    x1: hi.x + (hi.x - lo.x) * 0.06,
    y0: lo.y - (hi.y - lo.y) * 0.12,
    y1: hi.y + (hi.y - lo.y) * 0.12,
  };

  const fx = (value: number) => ((value - span.x0) / (span.x1 - span.x0)) * box.w;
  const fy = (value: number) => box.h - ((value - span.y0) / (span.y1 - span.y0)) * box.h;
  /* Percentages of the plot box, for the axis labels — which are HTML rather
   * than SVG text, so they hold a real font size on a phone instead of being
   * scaled down with the drawing until they are unreadable. */
  const px = (value: number) => `${(fx(value) / box.w) * 100}%`;
  const py = (value: number) => `${(fy(value) / box.h) * 100}%`;

  const maxSales = Math.max(...points.map((point) => point.sales));
  /* Area tracks volume, not radius: scaling the radius by the count would make
   * a community with ten times the sales look a hundred times bigger. */
  const radius = (count: number) => 5 + Math.sqrt(count / maxSales) * 19;

  const median = (values: readonly number[]) => {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
  };
  const midYield = median(yields);

  /*
   * The three price bands, and what each one actually pays.
   *
   * This is the ceiling-and-floor claim, computed rather than asserted. The
   * sentence "the cheapest third of Dubai contains both the best yield in the
   * city and the worst" is true of this export, and writing it into the copy
   * would leave it standing after the next one whether or not it survived.
   * So the bands are measured here and the claim is only made below when the
   * figures still support it.
   */
  const byPrice = [...points].sort((a, b) => a.price - b.price);
  const cut = Math.floor(byPrice.length / 3);
  const bands = [
    { label: "Cheapest third", of: byPrice.slice(0, cut) },
    { label: "Middle third", of: byPrice.slice(cut, cut * 2) },
    { label: "Dearest third", of: byPrice.slice(cut * 2) },
  ].map((band) => {
    const bandYields = band.of.map((point) => point.yieldPct);
    const bandPrices = band.of.map((point) => point.price);
    return {
      label: band.label,
      priceLow: Math.min(...bandPrices),
      priceHigh: Math.max(...bandPrices),
      low: Math.min(...bandYields),
      high: Math.max(...bandYields),
      mid: median(bandYields),
      count: band.of.length,
    };
  });

  const cheapest = bands[0]!;
  const dearest = bands[2]!;
  /* Does the cheapest band really hold both extremes of the whole city? */
  const cheapestSpansAll = cheapest.low <= lo.y + 0.01 && cheapest.high >= hi.y - 0.01;
  /* And does price cap the top end — is the dearest band's best below the
   * cheapest band's best by a margin worth calling a ceiling? */
  const priceCaps = dearest.high < cheapest.high - 0.5;

  const shown = points.find((point) => point.id === active) ?? null;
  const inPair = (point: Point) =>
    twin != null && (twin.high.id === point.id || twin.low.id === point.id);

  return (
    <figure className="m-0">
      {/*
       * The finding first, in words, then the chart for anyone who wants to
       * check it. A reader who stops after this line has still got the point.
       */}
      {twin ? (
        <div className="border-t-2 border-gold pt-6">
          <p className="display-3 max-w-[46rem] text-balance">
            {twin.high.name} and {twin.low.name} cost the same. One earns nearly twice what the
            other does.
          </p>
          <dl className="mt-7 grid gap-px border border-border bg-border sm:grid-cols-3">
            {[
              {
                term: "Price per square foot",
                value: aed(twin.high.price),
                note: `${twin.low.name} is ${aed(twin.low.price)}, inside 5% of it.`,
              },
              {
                term: `${twin.high.name} yields`,
                value: pct(twin.high.yieldPct),
                note: `${twin.high.sales.toLocaleString("en-AE")} registered sales this quarter.`,
              },
              {
                term: `${twin.low.name} yields`,
                value: pct(twin.low.yieldPct),
                note: `${twin.low.sales.toLocaleString("en-AE")} registered sales this quarter.`,
              },
            ].map((cell) => (
              <div key={cell.term} className="bg-paper p-6">
                <dt className="eyebrow text-gold-ink">{cell.term}</dt>
                <dd>
                  <span className="font-display mt-4 block text-3xl leading-none tabular-nums lg:text-4xl">
                    {cell.value}
                  </span>
                  <span className="caption mt-3 block text-muted-foreground">{cell.note}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}

      {/* Scrolls sideways on a phone rather than shrinking to unreadable, the
          same way the league table beneath it does.

          dir="ltr" on the drawing only. The plot is positioned in percentages
          from a left origin and would mirror itself under an Arabic document
          direction, putting the cheap end on the right while the axis labels
          stayed put. The prose around it is left to flow with the page. */}
      <div dir="ltr" className="mt-12 overflow-x-auto">
        <div className="relative min-w-[32rem] pb-9 pl-16 pr-6">
          <div className="relative aspect-[96/46]">
            <svg
              viewBox={`0 0 ${box.w} ${box.h}`}
              className="absolute inset-0 size-full overflow-visible"
              role="img"
              aria-labelledby={`${id}-title`}
            >
              <title id={`${id}-title`}>
                {`${points.length} Dubai communities plotted on median price per square foot against gross rental yield, ${periodLabel}. Price runs from ${aed(lo.x)} to ${aed(hi.x)} and yield from ${pct(lo.y)} to ${pct(hi.y)}. Price sets a ceiling on yield but not a floor: the cheapest communities include both the highest and the lowest yields in the city. Every figure plotted here is in the sortable table above.`}
              </title>

              {/* The Dubai median yield, so every point reads as above or below it. */}
              <line
                x1={0}
                x2={box.w}
                y1={fy(midYield)}
                y2={fy(midYield)}
                stroke="var(--border-strong)"
                strokeDasharray="5 6"
              />
              <line x1={0} x2={box.w} y1={box.h} y2={box.h} stroke="var(--border)" />
              <line x1={0} x2={0} y1={0} y2={box.h} stroke="var(--border)" />

              {points.map((point) => {
                const on = active === point.id;
                const pair = inPair(point);
                return (
                  <circle
                    key={point.id}
                    cx={fx(point.price)}
                    cy={fy(point.yieldPct)}
                    r={radius(point.sales)}
                    onMouseEnter={() => setActive(point.id)}
                    onMouseLeave={() => setActive(null)}
                    onClick={() => setActive((held) => (held === point.id ? null : point.id))}
                    className={cn(
                      "cursor-pointer transition-[fill,stroke] duration-quick ease-editorial",
                      on || pair
                        ? "fill-[color-mix(in_srgb,var(--green-mid)_70%,transparent)] stroke-[var(--green)]"
                        : "fill-[color-mix(in_srgb,var(--gold)_45%,transparent)] stroke-[var(--gold-ink)]",
                    )}
                    strokeWidth={on ? 3 : pair ? 2 : 1}
                  />
                );
              })}
            </svg>

            {/* Axis labels in HTML, positioned by percentage over the drawing. */}
            {/* Keyed by slot, not by value: on a tight spread the median can
                land on the minimum, and two spans keyed by the same figure
                would collide. */}
            {[lo.y, midYield, hi.y].map((value, index) => (
              <span
                key={`y${index}`}
                aria-hidden
                className="caption absolute right-full -translate-y-1/2 pr-3 tabular-nums text-muted-foreground"
                style={{ top: py(value) }}
              >
                {value.toFixed(1)}%
              </span>
            ))}
            {[lo.x, hi.x].map((value, index) => (
              <span
                key={`x${index}`}
                aria-hidden
                className={cn(
                  "caption absolute top-full pt-2 tabular-nums text-muted-foreground",
                  index === 0 ? "-translate-x-1/2" : "-translate-x-full",
                )}
                style={{ left: px(value) }}
              >
                {aed(value)}
              </span>
            ))}
            <span
              aria-hidden
              className="caption absolute left-1/2 top-full -translate-x-1/2 pt-2 text-muted-foreground"
            >
              Median price per square foot
            </span>
          </div>
        </div>
      </div>

      {/*
       * One readout under the chart rather than a tooltip floating over it. It
       * never covers the point being read, it does not jump under the cursor,
       * and it holds still long enough to write a number down.
       */}
      <div aria-live="polite" className="mt-6 min-h-[4.5rem] border-t border-border pt-5">
        {shown ? (
          <div className="flex flex-wrap items-baseline gap-x-8 gap-y-2">
            <p className="display-3">{shown.name}</p>
            <p className="caption tabular-nums text-muted-foreground">
              {aed(shown.price)} per sqft · {pct(shown.yieldPct)} gross
              {shown.afterCharge != null ? ` · ${pct(shown.afterCharge)} after service charge` : ""}{" "}
              · {shown.sales.toLocaleString("en-AE")} registered sales
            </p>
          </div>
        ) : (
          <p className="caption text-muted-foreground">
            Point at a community for its figures. A bigger circle registered more sales this
            quarter, and the dashed line is the Dubai median yield of {pct(midYield)}.
          </p>
        )}
      </div>

      {/*
       * The same 39 communities in three price bands, which is the claim in
       * the caption shown as figures. Each band prints the range it pays, not
       * an average, because the width of that range is the whole point: a
       * single figure per band would hide the thing worth seeing.
       */}
      <div className="mt-14 border-t border-border">
        {bands.map((band) => (
          <div
            key={band.label}
            className="grid grid-cols-2 gap-x-6 gap-y-2 border-b border-border py-5 sm:grid-cols-12 sm:items-baseline"
          >
            <p className="eyebrow text-gold-ink sm:col-span-3">{band.label}</p>
            <p className="caption tabular-nums text-muted-foreground sm:col-span-4">
              {aed(band.priceLow)} – {aed(band.priceHigh)} per sqft
            </p>
            <p className="caption text-muted-foreground sm:col-span-2">Yields anywhere from</p>
            <p className="font-display text-xl tabular-nums sm:col-span-3 sm:text-2xl">
              {band.low.toFixed(2)}% to {band.high.toFixed(2)}%
            </p>
          </div>
        ))}
      </div>

      <figcaption className="body-text mt-8 max-w-measure text-muted-foreground">
        Read it left to right and the cloud tilts down, which is the rule everyone repeats: pay
        more, earn less.{" "}
        {priceCaps ? (
          <>
            Read it up and down and the rule only half holds. Price sets a ceiling — nothing in the
            dearest third of Dubai pays above {dearest.high.toFixed(2)}% — but it does not set a
            floor.{" "}
          </>
        ) : (
          <>Read it up and down and the rule falls apart. </>
        )}
        {cheapestSpansAll ? (
          <strong className="font-normal text-foreground">
            The cheapest third of the city contains both the highest yield in Dubai and the lowest.
          </strong>
        ) : (
          <strong className="font-normal text-foreground">
            The cheapest third of the city runs from {cheapest.low.toFixed(2)}% to{" "}
            {cheapest.high.toFixed(2)}%, so a low price tells you almost nothing about the income.
          </strong>
        )}{" "}
        A low price per square foot is not, on its own, a reason to buy anything. {periodLabel},{" "}
        {points.length} communities, every one of them in the table above.
      </figcaption>
    </figure>
  );
}
