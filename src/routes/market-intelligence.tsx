import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

import { site } from "@/config/site";
import {
  attributionFor,
  getMarketPriceIndex,
  getMarketSummary,
  listAreasWithStats,
  listRecentTransactions,
} from "@/data/market";
import { datasetSchema, faqSchema, type FaqEntry } from "@/lib/schema";
import { pageHead } from "@/lib/seo";
import { stagger } from "@/lib/motion";
import { QualifiedForm } from "@/components/forms/qualified-form";
import { FreshnessStamp } from "@/components/market/freshness-stamp";
import { Stat } from "@/components/market/stat";
import { TransactionTicker } from "@/components/market/transaction-ticker";
import { TrendChart } from "@/components/market/trend-chart";
import { Reveal } from "@/components/site/reveal";
import { Section, Container, Eyebrow } from "@/components/ui/section";

const FAQS: readonly FaqEntry[] = [
  {
    question: "Where do these numbers come from?",
    answer:
      "Dubai Land Department open data — the same registry every sale in Dubai is recorded in — cleaned into our own database and recomputed on a schedule. Every page states which data it is showing and when it was last updated. DLX is not affiliated with the Dubai Land Department.",
  },
  {
    question: "Why is your median different from the figure I saw elsewhere?",
    answer:
      "Most published figures are asking prices, which are what sellers hope for. Ours are recorded sale prices, which are what buyers paid. They are usually not the same number, and the second one is the one that matters when you are negotiating.",
  },
  {
    question: "Is the rental yield you show net or gross?",
    answer:
      "Gross — a year's registered rent divided by the typical sale price. Service charges, which in Dubai are significant and vary a lot by building, come out of that. We will model the net figure for a specific property when you ask.",
  },
  {
    question: "How current is this?",
    answer:
      "The headline metrics cover a rolling twelve months and are recomputed when new records are ingested. The stamp beneath every figure tells you when that last happened, so you never have to guess whether you are looking at something stale.",
  },
];

export const Route = createFileRoute("/market-intelligence")({
  loader: async () => {
    const [summary, index, areas, recent] = await Promise.all([
      getMarketSummary(),
      getMarketPriceIndex(),
      listAreasWithStats(),
      listRecentTransactions(12),
    ]);
    return { summary, index, areas, recent };
  },
  head: ({ loaderData }) => {
    const summary = loaderData?.summary;
    const attribution = summary?.attribution ?? attributionFor(null, null);

    return pageHead({
      path: "/market-intelligence",
      breadcrumbs: [{ name: "Market Intelligence", path: "/market-intelligence" }],
      schema: [
        faqSchema(FAQS),
        datasetSchema({
          name: "Dubai residential transaction statistics by community",
          description:
            "Median and average price per square foot, transaction volume, year-on-year movement and gross rental yield for Dubai's prime residential communities, derived from recorded sales and registered tenancy contracts.",
          path: "/market-intelligence",
          isOfficial: attribution.isOfficial,
          dateModified: attribution.updatedAt ?? new Date().toISOString(),
          spatialCoverage: "Dubai, United Arab Emirates",
        }),
      ],
    });
  },
  component: MarketIntelligencePage,
});

function MarketIntelligencePage() {
  const { summary, index, areas, recent } = Route.useLoaderData();
  const covered = areas.filter((area) => area.stats !== null);
  const [showAllAreas, setShowAllAreas] = useState(false);

  const byYield = [...covered]
    .filter((area) => area.stats?.gross_yield_pct)
    .sort((a, b) => (b.stats!.gross_yield_pct ?? 0) - (a.stats!.gross_yield_pct ?? 0));

  const visibleAreas = showAllAreas ? covered : covered.slice(0, 6);

  return (
    <>
      <Section className="pt-44 pb-16 lg:pt-56">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Reveal>
              <Eyebrow>Research</Eyebrow>
              <h1 className="display-1 mt-8">Dubai, in recorded numbers</h1>
            </Reveal>
          </div>
          <div className="lg:col-span-4 lg:col-start-9">
            <Reveal delay={0.12}>
              <p className="body-text text-muted-foreground">
                Not asking prices, not agency sentiment — what buyers actually paid, recorded in the
                registry every Dubai sale passes through.
              </p>
              <FreshnessStamp attribution={summary.attribution} className="mt-8" />
            </Reveal>
          </div>
        </div>
      </Section>

      {summary.areasCovered === 0 ? (
        <Section className="pt-0">
          <div className="border border-border p-12 text-center">
            <Eyebrow>Being prepared</Eyebrow>
            <h2 className="display-3 mt-6">The market data is loading.</h2>
            <p className="body-text mx-auto mt-6 max-w-measure text-muted-foreground">
              Once the Dubai Land Department snapshot is in, this page carries the recorded prices,
              yields and volumes for every community we cover.
            </p>
            <Link to="/contact" className="eyebrow link-underline mt-10 inline-block text-accent">
              Ask us what we are seeing
            </Link>
          </div>
        </Section>
      ) : (
        <>
          {/* Headline figures */}
          <Section className="pt-0">
            <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
              <Reveal delay={stagger(0)}>
                <Stat
                  label="Median price"
                  value={summary.medianPricePerSqft}
                  prefix="AED "
                  suffix=" /sq ft"
                  meaning="Across every community we track, weighted by how much actually changed hands."
                />
              </Reveal>
              <Reveal delay={stagger(1)}>
                <Stat
                  label="Year on year"
                  value={summary.yoyPriceChangePct}
                  decimals={1}
                  suffix="%"
                  meaning="How far the median has moved against the same twelve months a year earlier."
                />
              </Reveal>
              <Reveal delay={stagger(2)}>
                <Stat
                  label="Sales recorded"
                  value={summary.transactionCount}
                  meaning="Registered sales behind these figures. Volume is what makes a median trustworthy."
                />
              </Reveal>
              <Reveal delay={stagger(3)}>
                <Stat
                  label="Communities"
                  value={summary.areasCovered}
                  meaning="Each with its own page, its own evidence and its own verdict."
                />
              </Reveal>
            </div>
          </Section>

          {/* The trend */}
          <Section className="bg-secondary">
            <div className="grid gap-14 lg:grid-cols-12">
              <div className="lg:col-span-3">
                <Reveal>
                  <Eyebrow>The trend</Eyebrow>
                  <h2 className="display-3 mt-6">Three years of prime Dubai</h2>
                  <p className="body-text mt-6 text-muted-foreground">
                    Median price per square foot by month, weighted by transaction volume across the
                    communities we cover.
                  </p>
                </Reveal>
              </div>
              <div className="lg:col-span-8 lg:col-start-5">
                <Reveal delay={0.1}>
                  <TrendChart points={index} height={320} />
                </Reveal>
              </div>
            </div>
          </Section>

          {/* Yields by area */}
          {byYield.length > 0 ? (
            <Section>
              <Reveal>
                <Eyebrow>Yields by community</Eyebrow>
                <h2 className="display-2 mt-6">Where the rent covers the most</h2>
                <p className="body-text mt-6 max-w-measure text-muted-foreground">
                  Gross yield — a year's registered rent against the typical sale price. Service
                  charges come out of this, and they are not small in Dubai.
                </p>
              </Reveal>

              <div className="mt-12">
                {byYield.map((area, rank) => {
                  const yieldPct = area.stats!.gross_yield_pct ?? 0;
                  const best = byYield[0]!.stats!.gross_yield_pct ?? 1;
                  return (
                    <Reveal
                      key={area.id}
                      delay={stagger(rank)}
                      className="border-t border-border/60 py-5"
                    >
                      <Link
                        to="/areas/$slug"
                        params={{ slug: area.slug }}
                        className="group grid items-center gap-4 md:grid-cols-12"
                      >
                        <span className="body-text md:col-span-3">{area.name}</span>
                        <span className="md:col-span-7">
                          {/* The bar is the comparison; the number is the fact. */}
                          <span
                            aria-hidden="true"
                            className="block h-px bg-accent transition-all duration-slow ease-editorial group-hover:h-0.5"
                            style={{ width: `${Math.max(6, (yieldPct / best) * 100)}%` }}
                          />
                        </span>
                        <span className="eyebrow text-foreground md:col-span-2 md:text-right">
                          {yieldPct.toFixed(1)}% gross
                        </span>
                      </Link>
                    </Reveal>
                  );
                })}
              </div>
            </Section>
          ) : null}

          {/* Every community, behind a reveal */}
          <Section className="bg-secondary">
            <Reveal>
              <Eyebrow>By community</Eyebrow>
              <h2 className="display-2 mt-6">The whole table</h2>
            </Reveal>

            <div className="mt-10 overflow-x-auto">
              <table className="w-full min-w-[44rem] border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    {[
                      "Community",
                      "Median /sq ft",
                      "Typical sale",
                      "Year on year",
                      "Gross yield",
                      "Sales",
                    ].map((heading) => (
                      <th key={heading} className="eyebrow py-4 pr-6 text-left font-normal">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleAreas.map((area) => (
                    <tr key={area.id} className="border-b border-border/60">
                      <td className="body-text py-4 pr-6">
                        <Link
                          to="/areas/$slug"
                          params={{ slug: area.slug }}
                          className="link-underline text-foreground"
                        >
                          {area.name}
                        </Link>
                      </td>
                      <td className="caption py-4 pr-6 whitespace-nowrap">
                        {area.stats?.median_price_per_sqft
                          ? `AED ${Math.round(area.stats.median_price_per_sqft).toLocaleString("en-AE")}`
                          : "—"}
                      </td>
                      <td className="caption py-4 pr-6 whitespace-nowrap">
                        {area.stats?.median_price
                          ? `AED ${(area.stats.median_price / 1_000_000).toFixed(2)}M`
                          : "—"}
                      </td>
                      <td className="caption py-4 pr-6 whitespace-nowrap">
                        {area.stats?.yoy_price_change_pct !== null &&
                        area.stats?.yoy_price_change_pct !== undefined
                          ? `${area.stats.yoy_price_change_pct >= 0 ? "+" : ""}${area.stats.yoy_price_change_pct.toFixed(1)}%`
                          : "—"}
                      </td>
                      <td className="caption py-4 pr-6 whitespace-nowrap">
                        {area.stats?.gross_yield_pct
                          ? `${area.stats.gross_yield_pct.toFixed(1)}%`
                          : "—"}
                      </td>
                      <td className="caption py-4 pr-6">{area.stats?.transaction_count ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {covered.length > 6 ? (
              <button
                type="button"
                onClick={() => setShowAllAreas((current) => !current)}
                aria-expanded={showAllAreas}
                className="eyebrow link-underline mt-8 text-foreground"
              >
                {showAllAreas ? "Show fewer" : `Show all ${covered.length} communities`}
              </button>
            ) : null}
          </Section>

          {/* The evidence itself */}
          <Section>
            <div className="grid gap-14 lg:grid-cols-12">
              <div className="lg:col-span-3">
                <Reveal>
                  <Eyebrow>The evidence</Eyebrow>
                  <h2 className="display-3 mt-6">Individual sales</h2>
                  <p className="body-text mt-6 text-muted-foreground">
                    The most recent records behind the figures above. This is the raw material, not
                    a summary of it.
                  </p>
                </Reveal>
              </div>
              <div className="lg:col-span-8 lg:col-start-5">
                <Reveal delay={0.1}>
                  <TransactionTicker transactions={recent} />
                </Reveal>
              </div>
            </div>
          </Section>
        </>
      )}

      {/* The gated report */}
      <Section className="bg-secondary">
        <div className="grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Reveal>
              <Eyebrow>The full report</Eyebrow>
              <h2 className="display-2 mt-6">The Dubai market report.</h2>
              <p className="body-text mt-8 max-w-measure text-muted-foreground">
                Every community, the rent evidence behind each yield, three years of movement, and
                where we think the value is. Written for someone deciding.
              </p>
            </Reveal>
          </div>
          <div className="lg:col-span-7 lg:col-start-6">
            <Reveal delay={0.1}>
              <QualifiedForm
                sourceType="market_report"
                sourceDetail="market-report-dubai"
                defaultIntent="invest"
                title="Get the Dubai market report"
                description="Tell us where to send it. A consultant reads every request personally."
                submitLabel="Send me the report"
              />
            </Reveal>
          </div>
        </div>
      </Section>

      {/* Answer-shaped content, matching the FAQ schema */}
      <Section>
        <div className="grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <Reveal>
              <Eyebrow>About this data</Eyebrow>
              <h2 className="display-3 mt-6">Asked and answered</h2>
            </Reveal>
          </div>
          <div className="lg:col-span-8 lg:col-start-5">
            {FAQS.map((faq) => (
              <Reveal key={faq.question} className="border-t border-border last:border-b">
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-baseline justify-between gap-8 py-7 [&::-webkit-details-marker]:hidden">
                    <h3 className="lead transition-colors group-open:text-accent">
                      {faq.question}
                    </h3>
                    <span
                      aria-hidden="true"
                      className="eyebrow shrink-0 transition-transform duration-base ease-editorial group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <p className="body-text max-w-measure pb-8 text-muted-foreground">{faq.answer}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </Section>

      <Section flush className="border-t border-border py-10">
        <Container className="flex flex-wrap items-center justify-between gap-6">
          <FreshnessStamp attribution={summary.attribution} />
          <p className="caption">{site.name} is not affiliated with the Dubai Land Department.</p>
        </Container>
      </Section>
    </>
  );
}
