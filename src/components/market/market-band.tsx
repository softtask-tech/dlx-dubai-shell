import { Link } from "@tanstack/react-router";
import { useState } from "react";

import { CountUp } from "./count-up";
import { FreshnessStamp } from "./freshness-stamp";
import { Stat } from "./stat";
import { TrendChart } from "./trend-chart";
import type { AreaPricePoint, AreaWithStats } from "@/data/market-types";
import type { MarketSummary } from "@/data/market";
import { stagger } from "@/lib/motion";
import { Reveal } from "@/components/site/reveal";
import { Section, Eyebrow } from "@/components/ui/section";

/**
 * The homepage market band.
 *
 * Three layers, in the order the golden rule asks for them:
 *
 *   1. a headline anyone understands in two seconds — the market moved this
 *      much, here is what that means for you;
 *   2. an "explore" reveal holding the chart and the per-community detail, for
 *      the reader who wants it; and
 *   3. a route through to the full report, which is where the lead is captured.
 *
 * Deliberately not a dashboard. Four numbers, one line, and a sentence against
 * each — a visitor who reads nothing else should still leave knowing which way
 * the market moved and why they might care.
 */
export function MarketBand({
  summary,
  index,
  areas,
}: {
  summary: MarketSummary;
  index: readonly AreaPricePoint[];
  areas: readonly AreaWithStats[];
}) {
  const [expanded, setExpanded] = useState(false);

  /* Nothing loaded: say so quietly rather than showing a band of dashes. */
  if (summary.areasCovered === 0) return null;

  const direction = (summary.yoyPriceChangePct ?? 0) >= 0 ? "risen" : "fallen";
  const magnitude = Math.abs(summary.yoyPriceChangePct ?? 0);

  return (
    <Section className="bg-secondary">
      <div className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Reveal>
            <Eyebrow>Dubai market intelligence</Eyebrow>
            <h2 className="display-2 mt-6">
              Prime Dubai has {direction} <CountUp value={magnitude} decimals={1} suffix="%" /> in a
              year.
            </h2>
          </Reveal>
        </div>
        <div className="lg:col-span-6 lg:col-start-7">
          <Reveal delay={0.1}>
            <p className="lead text-muted-foreground">
              That is the median across {summary.areasCovered} communities we track, weighted by how
              much actually changed hands. It is the number a valuation should start from — not an
              asking price, and not an agency's opinion.
            </p>
            <FreshnessStamp attribution={summary.attribution} className="mt-8" />
          </Reveal>
        </div>
      </div>

      {/* Layer one: the headline figures */}
      <div className="mt-16 grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
        <Reveal className="bg-secondary p-8 pl-0 sm:pl-8 lg:pl-0" delay={stagger(0)}>
          <Stat
            label="Median price"
            value={summary.medianPricePerSqft}
            decimals={0}
            prefix="AED "
            suffix=" /sq ft"
            meaning="What a square foot has actually transacted at across the communities we cover."
          />
        </Reveal>
        <Reveal className="bg-secondary p-8" delay={stagger(1)}>
          <Stat
            label="Year on year"
            value={summary.yoyPriceChangePct}
            decimals={1}
            suffix="%"
            meaning={
              (summary.yoyPriceChangePct ?? 0) >= 0
                ? "Prices are higher than a year ago. If you are buying, waiting has had a cost."
                : "Prices are below a year ago. If you are buying, patience has been rewarded."
            }
          />
        </Reveal>
        <Reveal className="bg-secondary p-8" delay={stagger(2)}>
          <Stat
            label="Sales recorded"
            value={summary.transactionCount}
            meaning="Registered sales behind these figures over the last twelve months. More sales, more confidence in the number."
          />
        </Reveal>
        <Reveal className="bg-secondary p-8" delay={stagger(3)}>
          <Stat
            label="Best gross yield"
            value={summary.bestYield?.yieldPct ?? null}
            decimals={1}
            suffix="%"
            meaning={
              summary.bestYield
                ? `${summary.bestYield.areaName} currently returns the most rent against price. Gross, before service charges.`
                : "We show a yield only where we hold registered tenancy contracts to support it."
            }
          />
        </Reveal>
      </div>

      {/* Layer two: the explore reveal */}
      <div className="mt-12">
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          aria-expanded={expanded}
          aria-controls="market-detail"
          className="eyebrow link-underline text-foreground"
        >
          {expanded ? "Hide the detail" : "Explore the numbers"}
        </button>

        <div id="market-detail" hidden={!expanded} className="mt-10">
          <div className="grid gap-14 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <Eyebrow>Three years of prime Dubai</Eyebrow>
              <p className="caption mt-3 max-w-measure">
                Median price per square foot, weighted by transaction volume across the communities
                we track.
              </p>
              <TrendChart points={index} className="mt-8" />
            </div>

            <div className="lg:col-span-4 lg:col-start-9">
              <Eyebrow>By community</Eyebrow>
              <dl className="mt-6">
                {areas
                  .filter((area) => area.stats?.median_price_per_sqft)
                  .slice(0, 6)
                  .map((area) => (
                    <div
                      key={area.id}
                      className="flex items-baseline justify-between gap-6 border-t border-border/60 py-4"
                    >
                      <dt className="body-text">
                        <Link
                          to="/areas/$slug"
                          params={{ slug: area.slug }}
                          className="link-underline text-foreground"
                        >
                          {area.name}
                        </Link>
                      </dt>
                      <dd className="caption whitespace-nowrap">
                        AED {Math.round(area.stats!.median_price_per_sqft!).toLocaleString("en-AE")}
                        <span className="text-muted-foreground"> /sq ft</span>
                      </dd>
                    </div>
                  ))}
              </dl>

              <Link
                to="/market-intelligence"
                className="eyebrow link-underline mt-8 inline-block text-accent"
              >
                Full market intelligence
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
