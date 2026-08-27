import { Link } from "@tanstack/react-router";

import { CountUp } from "./count-up";
import { FreshnessStamp } from "./freshness-stamp";
import { TrendChart } from "./trend-chart";
import type { MarketSummary } from "@/data/market";
import type { AreaPricePoint, AreaWithStats } from "@/data/market-types";
import { PinnedSequence } from "@/components/motion";
import { Photo } from "@/components/site/photo";
import { Container, Eyebrow } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STAGE_LABELS = ["The verdict", "The evidence", "Where to read it"] as const;

/**
 * The market, read from the record. The page's one pinned moment.
 *
 * This section has an argument to make in a fixed order, which is the only
 * thing that justifies taking the scroll away from a reader:
 *
 *   1. the verdict, in a sentence anyone understands in two seconds;
 *   2. the evidence it came from, as one chart and four figures;
 *   3. the invitation to go and read the rest.
 *
 * Pinning lets those land in sequence instead of scrolling past as three
 * unrelated blocks. It is also the site's whole differentiator compressed into
 * one moment: a small brokerage citing the official record.
 *
 * ## Why the frame exists
 *
 * The first build of this put the three stages, and nothing else, in a held
 * viewport of flat black. Held still, the two thirds of the screen the copy did
 * not reach did not read as space, it read as a page that had failed to load.
 * So the pinned field is now composed rather than empty: a night photograph of
 * the skyline the numbers describe, dimmed almost to a texture; a top rail that
 * names the section and stamps its source; and a bottom rail that says which
 * part of the argument is on screen and how much is left. Those rails do not
 * move, so the reader sees one composition changing its middle, which is what a
 * pin is for.
 *
 * Below 768px and under reduced motion the pin releases and the three stages
 * become three ordinary blocks in the same order. Nothing is behind the
 * interaction.
 */
export function MarketSequence({
  summary,
  index,
  areas,
}: {
  summary: MarketSummary;
  index: readonly AreaPricePoint[];
  areas: readonly AreaWithStats[];
}) {
  /* Nothing loaded: say nothing rather than show a band of dashes. */
  if (summary.areasCovered === 0) return null;

  const direction = (summary.yoyPriceChangePct ?? 0) >= 0 ? "risen" : "fallen";
  const magnitude = Math.abs(summary.yoyPriceChangePct ?? 0);

  const verdict = (
    <Container>
      <div className="max-w-3xl">
        <h2 className="display-1 text-balance">
          Prime Dubai has {direction} <CountUp value={magnitude} decimals={1} suffix="%" /> in a
          year.
        </h2>
        <p className="lead mt-8 max-w-2xl text-on-dark-muted">
          That is the median across {summary.areasCovered} communities we track, weighted by how
          much actually changed hands. It is the number a valuation should start from, not an asking
          price and not an agency's opinion.
        </p>
      </div>
    </Container>
  );

  const evidence = (
    <Container>
      <div className="grid gap-x-14 gap-y-12 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <p className="eyebrow">Median price per square foot, weighted by volume</p>
          <TrendChart points={index} className="mt-6" />
        </div>

        <dl className="grid grid-cols-2 gap-x-8 gap-y-10 lg:col-span-4 lg:col-start-9">
          <Figure
            label="Median"
            value={summary.medianPricePerSqft}
            prefix="AED "
            note="per sq ft"
          />
          <Figure label="Year on year" value={summary.yoyPriceChangePct} decimals={1} suffix="%" />
          <Figure label="Sales recorded" value={summary.transactionCount} />
          <Figure
            label="Best gross yield"
            value={summary.bestYield?.yieldPct ?? null}
            decimals={1}
            suffix="%"
            note={summary.bestYield?.areaName}
          />
        </dl>
      </div>
    </Container>
  );

  const invitation = (
    <Container>
      <div className="grid gap-x-14 gap-y-10 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <h3 className="display-2 text-balance">Every community, with the same honesty.</h3>
          <p className="body-text mt-6 max-w-lg text-on-dark-muted">
            Price direction, liquidity and rental return for each district we cover, and a plain
            answer on whether it is worth buying there.
          </p>
          <Link to="/market-intelligence" className="mt-9 inline-block">
            <Button>Explore the full market</Button>
          </Link>
        </div>

        {/* The top of the ranking, as a taste of what is behind the link. */}
        <dl className="lg:col-span-5 lg:col-start-8">
          {areas
            .filter((area) => area.stats?.median_price_per_sqft)
            .slice(0, 5)
            .map((area) => (
              <div
                key={area.id}
                className="flex items-baseline justify-between gap-6 border-t border-border py-3.5"
              >
                <dt className="body-text">{area.name}</dt>
                <dd className="caption whitespace-nowrap text-on-dark-muted">
                  AED {Math.round(area.stats!.median_price_per_sqft!).toLocaleString("en-AE")}
                  <span className="opacity-70"> /sq ft</span>
                </dd>
              </div>
            ))}
        </dl>
      </div>
    </Container>
  );

  return (
    <div data-surface="dark" className="bg-ink">
      <PinnedSequence
        aria-label="Dubai market, read from the record"
        stages={[verdict, evidence, invitation]}
        dwell={1.1}
        stageClassName="w-full"
        /* Room for the two rails, so a stage never collides with the frame. */
        pinnedStageClassName="pt-40 pb-32 lg:pt-44 lg:pb-36"
        backdrop={
          <>
            {/* The skyline the figures are about, held at the threshold of
                visible. Any brighter and it competes with a chart; any darker
                and the field is flat black again. */}
            <Photo
              slug="downtown-skyline-night"
              sizes="100vw"
              className="h-full w-full object-cover opacity-30"
            />
            <div className="absolute inset-0 bg-linear-to-r from-ink via-ink/92 to-ink/70" />
            <div className="absolute inset-0 bg-linear-to-b from-ink via-transparent to-ink/90" />
          </>
        }
        frame={({ active, count, pinned }) => (
          /* The top rail clears the masthead rather than sliding under it:
             while the section is pinned it sits at the very top of the
             viewport, which is exactly where the fixed header already is. */
          <Container
            className={
              pinned ? "flex h-full flex-col justify-between pt-28 pb-9 lg:pt-32 lg:pb-12" : "block"
            }
          >
            <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2">
              <Eyebrow>Dubai market, read from the record</Eyebrow>
              <FreshnessStamp attribution={summary.attribution} />
            </div>

            {/* Where the reader is in the argument, named rather than numbered.
                It only appears while the pin holds, because in the stacked
                fallback the three stages are simply three blocks and a progress
                rail for a thing that is not progressing is furniture. */}
            {pinned ? (
              <div className="flex items-center gap-5">
                <p className="eyebrow text-on-dark">{STAGE_LABELS[active]}</p>
                <div className="flex flex-1 gap-1.5" aria-hidden="true">
                  {Array.from({ length: count }, (_, i) => (
                    <span
                      key={i}
                      className={cn(
                        "h-px flex-1 transition-colors duration-slow ease-editorial",
                        i <= active ? "bg-gold" : "bg-on-dark/20",
                      )}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <span />
            )}
          </Container>
        )}
      />
    </div>
  );
}

function Figure({
  label,
  value,
  decimals = 0,
  prefix,
  suffix,
  note,
}: {
  label: string;
  value: number | null;
  decimals?: number;
  prefix?: string | undefined;
  suffix?: string | undefined;
  note?: string | undefined;
}) {
  return (
    <div>
      <dt className="eyebrow">{label}</dt>
      {/* The unit goes on the `note` line rather than inside the figure. At
          display scale "AED 1,714 /sq ft" is wider than a half-column and wraps
          with the unit orphaned on its own line, which makes a confident number
          look like a mistake. */}
      <dd className="display-3 mt-2 whitespace-nowrap">
        <CountUp
          value={value}
          decimals={decimals}
          {...(prefix ? { prefix } : {})}
          {...(suffix ? { suffix } : {})}
        />
      </dd>
      {note ? <p className="caption mt-1">{note}</p> : null}
    </div>
  );
}
