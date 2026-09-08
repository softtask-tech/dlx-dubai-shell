import { createFileRoute, Link } from "@tanstack/react-router";

import {
  METRIC_MEANINGS,
  TOO_FEW_RECORDS,
  formatExportDate,
  formatMetricValue,
  formatPeriod,
  latestRow,
  seriesFor,
  sourceLine,
  type MarketRow,
} from "@/data/market-public";
import { getMarketMetadataFn, getMarketOverviewFn } from "@/data/market-public.functions";
import { rentGapSeries, shareSeries } from "@/data/market-insights";
import { datasetSchema, faqSchema, type FaqEntry } from "@/lib/schema";
import { pageHead } from "@/lib/seo";
import { stagger } from "@/lib/motion";
import { QualifiedForm } from "@/components/forms/qualified-form";
import { RegisteredSeries } from "@/components/market/registered-series";
import { MarketBrief } from "@/components/market/market-brief";
import { CompositionSeries } from "@/components/market/composition-series";
import { RentGap } from "@/components/market/rent-gap";
import { Stat } from "@/components/market/stat";
import { Reveal } from "@/components/site/reveal";
import { PageHero } from "@/components/site/page-hero";
import { Section, Container, Eyebrow } from "@/components/ui/section";

const FAQS: readonly FaqEntry[] = [
  {
    question: "Where do these numbers come from?",
    answer:
      "Dubai Land Department open data, the registry every sale and every tenancy contract in Dubai is recorded in. We publish counts of registered activity and the median registered annual rent, each with the number of records behind it and the period it covers. DLX Properties is independent of the Dubai Land Department and is not endorsed by it.",
  },
  {
    question: "Do you publish prices as well as activity?",
    answer:
      "Yes. Alongside counts of registered activity we publish the middle registered sale price, the middle registered price per square foot, the middle registered rent per square foot and the gross rental yield those two imply, each with the number of records behind it. Every one is derived from what was registered with the Dubai Land Department, never from asking prices, and where a period has too few records we leave it out rather than estimate it.",
  },

  {
    question: "What does the median registered annual rent mean?",
    answer:
      "The middle figure among the tenancy contracts registered in that period: half were agreed below it, half above. It is the rent that was actually registered, not an asking rent, and it covers the whole period rather than a single day.",
  },
  {
    question: "Why is a community or period sometimes missing?",
    answer:
      "Because too few records were registered for us to publish a figure without describing individual transactions. Periods that are still running are also left out, so every figure covers a period that has finished. Where that happens the page says so instead of estimating.",
  },
  {
    question: "How current is this?",
    answer:
      "Every page states the source export date it was built from. Figures are recomputed when a new official export is published; nothing on this page is generated between exports.",
  },
];

const HEADLINE_METRICS = [
  "registered_sale_count",
  "registered_rental_contract_count",
  "registered_new_rental_contract_count",
  "registered_renewed_rental_contract_count",
  "median_registered_annual_rent_aed",
] as const;

export const Route = createFileRoute("/market-intelligence/")({
  loader: async () => {
    const [metadata, quarterly, monthly] = await Promise.all([
      getMarketMetadataFn(),
      getMarketOverviewFn({
        data: {
          metrics: [...HEADLINE_METRICS],
          grain: "quarter",
          from: "2019-01-01",
          to: "2026-12-31",
          limit: 900,
        },
      }),
      getMarketOverviewFn({
        data: {
          metrics: ["registered_sale_count", "registered_rental_contract_count"],
          grain: "month",
          from: "2021-01-01",
          to: "2026-12-31",
          limit: 900,
        },
      }),
    ]);
    return { metadata, quarterly, monthly };
  },
  head: ({ loaderData }) => {
    const exported = loaderData?.metadata.sourceExportDate ?? null;
    return pageHead({
      path: "/market-intelligence",
      title: "Dubai Market Intelligence",
      description:
        "Registered sale transactions, registered rental contracts and the median registered annual rent for Dubai, built from Dubai Land Department open data with the record count behind every figure.",
      breadcrumbs: [{ name: "Market Intelligence", path: "/market-intelligence" }],
      schema: [
        faqSchema(FAQS),
        datasetSchema({
          name: "Dubai registered property activity and registered rents",
          description:
            "Counts of registered sale transactions and registered tenancy contracts, the new and renewed composition of registered tenancies, and the median registered annual rent for Dubai and its communities, derived from Dubai Land Department open data.",
          path: "/market-intelligence",
          isOfficial: true,
          dateModified: exported ?? new Date().toISOString().slice(0, 10),
          spatialCoverage: "Dubai, United Arab Emirates",
        }),
      ],
    });
  },
  component: MarketIntelligencePage,
});

function MarketIntelligencePage() {
  const { metadata, quarterly, monthly } = Route.useLoaderData();

  const saleQuarters = seriesFor(quarterly, "registered_sale_count");
  const rentalQuarters = seriesFor(quarterly, "registered_rental_contract_count");
  const rentQuarters = seriesFor(quarterly, "median_registered_annual_rent_aed");
  const newQuarters = seriesFor(quarterly, "registered_new_rental_contract_count", "new");
  const renewedQuarters = seriesFor(
    quarterly,
    "registered_renewed_rental_contract_count",
    "renewed",
  );

  const latestSale = latestRow(saleQuarters);
  const latestRental = latestRow(rentalQuarters);
  const latestRent = latestRow(rentQuarters);
  const latestNew = latestRow(newQuarters);
  const latestRenewed = latestRow(renewedQuarters);

  const period = latestSale ?? latestRental ?? latestRent;
  const periodLabel = period ? formatPeriod("quarter", period.period_start) : null;
  const published = metadata.rowCount > 0;

  /* The two derived readings the page leads with. Both come back empty where
   * the registry has not published both sides of the comparison, and the
   * sections that use them simply do not render. */
  const offPlanShare = shareSeries(quarterly, "registered_sale_count", "off_plan", "existing");
  const homeTypeShare = shareSeries(quarterly, "registered_sale_count", "apartment", "villa");
  const rentGap = rentGapSeries(quarterly);

  const compositionTotal = (latestNew?.metric_value ?? 0) + (latestRenewed?.metric_value ?? 0);
  const newShare = compositionTotal
    ? Math.round(((latestNew?.metric_value ?? 0) / compositionTotal) * 100)
    : null;

  return (
    <>
      <PageHero
        photo="downtown-interchange-day"
        eyebrow="Market intelligence"
        title="Dubai, in registered activity."
        lead="Not asking prices and not agency sentiment. How many sales and tenancies were actually registered with the Dubai Land Department, and what the middle registered rent was."
      >
        {metadata.sourceExportDate ? (
          <p className="caption mt-8 text-muted-foreground">
            Source export: {formatExportDate(metadata.sourceExportDate)} · Source: Dubai Land
            Department
          </p>
        ) : null}
      </PageHero>

      {!published ? (
        <Section className="pt-0">
          <div className="border border-border p-12 text-center">
            <Eyebrow>Being prepared</Eyebrow>
            <h2 className="display-3 mt-5">The official figures are not available right now.</h2>
            <p className="body-text mx-auto mt-6 max-w-measure text-muted-foreground">
              This page publishes only figures that come from an official Dubai Land Department
              export. Rather than show an estimate, it waits.
            </p>
            <Link to="/contact" className="eyebrow link-underline mt-10 inline-block text-accent">
              Ask us what we are seeing
            </Link>
          </div>
        </Section>
      ) : (
        <>
          <Section data-surface="dark">
            <Eyebrow className="text-gold">
              Latest complete period{periodLabel ? ` · ${periodLabel}` : ""}
            </Eyebrow>
            <div className="mt-10 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
              <Reveal delay={stagger(0)}>
                <Stat
                  label="Registered sale transactions"
                  value={latestSale?.metric_value ?? null}
                  meaning={METRIC_MEANINGS.registered_sale_count}
                />
              </Reveal>
              <Reveal delay={stagger(1)}>
                <Stat
                  label="Registered rental contracts"
                  value={latestRental?.metric_value ?? null}
                  meaning={METRIC_MEANINGS.registered_rental_contract_count}
                />
              </Reveal>
              <Reveal delay={stagger(2)}>
                <Stat
                  label="Median registered annual rent"
                  value={latestRent?.metric_value ?? null}
                  prefix="AED "
                  meaning={METRIC_MEANINGS.median_registered_annual_rent_aed}
                />
              </Reveal>
              <Reveal delay={stagger(3)}>
                <Stat
                  label="New contracts"
                  value={newShare}
                  suffix="%"
                  meaning="The share of registered tenancies in the period that were signed for the first time rather than renewed."
                />
              </Reveal>
            </div>
            <p className="caption mt-12 max-w-measure text-on-dark-muted">
              {sourceLine(metadata.sourceExportDate)}
            </p>
          </Section>

          {/*
           * The reading, before the series.
           *
           * A page of charts asks the reader to do the analysis, and most will
           * not. Every sentence here is assembled from published rows, so a
           * comparison the registry cannot support is simply absent rather
           * than filled in.
           */}
          <Section data-surface="light">
            <Reveal>
              <Eyebrow>The read</Eyebrow>
              <h2 className="display-2 mt-5 max-w-[20ch] text-balance">
                What the quarter actually says.
              </h2>
            </Reveal>
            <Reveal>
              <MarketBrief rows={quarterly} periodLabel={periodLabel} />
            </Reveal>
          </Section>

          {offPlanShare.length > 1 ? (
            <Section data-surface="cream">
              <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
                <div className="lg:col-span-4">
                  <Reveal>
                    <Eyebrow>Composition</Eyebrow>
                    <h2 className="display-2 mt-5 text-balance">
                      Are you buying from a developer, or from an owner?
                    </h2>
                    <p className="body-text mt-6 text-muted-foreground">
                      Two very different purchases sit inside one word. Off-plan is bought from a
                      developer on a payment plan against a handover date. Existing property is
                      bought from an owner and can be occupied, or let, the week it transfers.
                      Which of the two dominates decides how you should be negotiating.
                    </p>
                  </Reveal>
                </div>
                <div className="lg:col-span-8">
                  <Reveal delay={0.1}>
                    <CompositionSeries
                      points={offPlanShare}
                      grain="quarter"
                      aLabel="Off-plan"
                      bLabel="Existing property"
                      caption="The share of registered sale transactions that were off-plan, quarter by quarter. Both counts come from the same registry and the same period, so the share is a fact about the mix rather than a comparison across sources."
                    />
                  </Reveal>
                </div>
              </div>

              {homeTypeShare.length > 1 ? (
                <Reveal>
                  <div className="mt-16 border-t border-border pt-12">
                    <Eyebrow>Apartments against villas</Eyebrow>
                    <h3 className="display-3 mt-4 max-w-[30ch]">
                      Which kind of home is actually changing hands.
                    </h3>
                    <div className="mt-8">
                      <CompositionSeries
                        points={homeTypeShare}
                        grain="quarter"
                        aLabel="Apartments"
                        bLabel="Villas and townhouses"
                        height={180}
                        caption="Villa demand and apartment demand move on different cycles in Dubai, and a headline transaction count hides which one is carrying the quarter."
                      />
                    </div>
                  </div>
                </Reveal>
              ) : null}
            </Section>
          ) : null}

          {rentGap.length > 1 ? (
            <Section data-surface="light">
              <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
                <div className="lg:col-span-4">
                  <Reveal>
                    <Eyebrow>Rental pressure</Eyebrow>
                    <h2 className="display-2 mt-5 text-balance">
                      What a new tenant pays, against what a renewing one pays.
                    </h2>
                    <p className="body-text mt-6 text-muted-foreground">
                      Both medians are published separately and almost nobody puts them side by
                      side. The distance between them is the clearest read on rental pressure
                      there is, and it is the figure that decides whether a tenanted apartment is
                      already earning what it should.
                    </p>
                  </Reveal>
                </div>
                <div className="lg:col-span-8">
                  <Reveal delay={0.1}>
                    <RentGap points={rentGap} grain="quarter" />
                  </Reveal>
                </div>
              </div>
            </Section>
          ) : null}

          <Section className="bg-secondary">
            <Reveal>
              <Eyebrow>Over time</Eyebrow>
              <h2 className="display-2 mt-5">How much changes hands, month by month</h2>
              <p className="body-text mt-6 max-w-measure text-muted-foreground">
                Two counts, drawn from the registry itself. Both axes start at zero and no period is
                filled in where the registry has too few records to report.
              </p>
            </Reveal>
            <div className="mt-14 grid gap-16 lg:grid-cols-2">
              <Reveal>
                <RegisteredSeries
                  rows={seriesFor(monthly, "registered_sale_count")}
                  metric="registered_sale_count"
                  grain="month"
                />
              </Reveal>
              <Reveal delay={0.1}>
                <RegisteredSeries
                  rows={seriesFor(monthly, "registered_rental_contract_count")}
                  metric="registered_rental_contract_count"
                  grain="month"
                />
              </Reveal>
            </div>
          </Section>

          <Section>
            <div className="grid gap-14 lg:grid-cols-12">
              <div className="lg:col-span-4">
                <Reveal>
                  <h2 className="display-2">New tenants, or the same ones staying?</h2>
                  <p className="body-text mt-6 max-w-measure text-muted-foreground">
                    A market where most registered tenancies are renewals behaves differently from
                    one where most are new. This is the composition of registered contracts, quarter
                    by quarter, and beneath it the middle registered rent over the same periods.
                  </p>
                  <Link
                    to="/market-intelligence/compare"
                    className="eyebrow link-underline mt-10 inline-block text-accent"
                  >
                    Compare communities side by side
                  </Link>
                </Reveal>
              </div>
              <div className="grid gap-16 lg:col-span-7 lg:col-start-6">
                <Reveal>
                  <Composition news={newQuarters} renewals={renewedQuarters} />
                </Reveal>
                <Reveal delay={0.1}>
                  <RegisteredSeries
                    rows={rentQuarters}
                    metric="median_registered_annual_rent_aed"
                    grain="quarter"
                  />
                </Reveal>
              </div>
            </div>
          </Section>

          <Section className="bg-secondary">
            <Reveal>
              <Eyebrow>Methodology</Eyebrow>
              <h2 className="display-3 mt-5">What these figures are, exactly</h2>
            </Reveal>
            <div className="mt-10 grid gap-10 md:grid-cols-3">
              <Reveal>
                <h3 className="lead">Registered, not advertised</h3>
                <p className="body-text mt-4 text-muted-foreground">
                  Every figure counts something that was registered with the Dubai Land Department.
                  Nothing here is drawn from listings, asking prices or agency reporting.
                </p>
              </Reveal>
              <Reveal delay={0.05}>
                <h3 className="lead">Complete periods only</h3>
                <p className="body-text mt-4 text-muted-foreground">
                  A period appears only once it has finished, so a partial month never masquerades
                  as a trend. The record count behind each figure is published alongside it.
                </p>
              </Reveal>
              <Reveal delay={0.1}>
                <h3 className="lead">Left out rather than estimated</h3>
                <p className="body-text mt-4 text-muted-foreground">
                  Where too few records exist to report a period without describing individual
                  transactions, we publish nothing for it and say so. {TOO_FEW_RECORDS}
                </p>
              </Reveal>
            </div>
            <p className="caption mt-12 max-w-measure">{sourceLine(metadata.sourceExportDate)}</p>
          </Section>
        </>
      )}

      <Section>
        <div className="grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Reveal>
              <h2 className="display-2">Ask about a community.</h2>
              <p className="body-text mt-8 max-w-measure text-muted-foreground">
                Tell us which community and what you are trying to do, and a consultant will go
                through the registered activity behind it with you. This is information, not
                personalised advice, until we have spoken.
              </p>
            </Reveal>
          </div>
          <div className="lg:col-span-7 lg:col-start-6">
            <Reveal delay={0.1}>
              <QualifiedForm
                sourceType="market_report"
                sourceDetail="market-intelligence-dubai"
                defaultIntent="invest"
                title="Ask about this market"
                description="Tell us where to send our answer. A consultant reads every request personally."
                submitLabel="Send my question"
              />
            </Reveal>
          </div>
        </div>
      </Section>

      <Section className="bg-secondary">
        <div className="grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <Reveal>
              <h2 className="display-3">Asked and answered</h2>
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
          <p className="caption">Keep reading</p>
          <nav className="flex flex-wrap gap-8" aria-label="Related pages">
            <Link to="/market-intelligence/compare" className="eyebrow link-underline">
              Compare communities
            </Link>
            <Link to="/areas" className="eyebrow link-underline">
              Community guides
            </Link>
            <Link to="/directory" className="eyebrow link-underline">
              Official DLD directory
            </Link>
            <Link to="/guides" className="eyebrow link-underline">
              Buyer guides
            </Link>
          </nav>
        </Container>
      </Section>
    </>
  );
}

/**
 * New against renewed, as a share of each quarter.
 *
 * A stacked share rather than two lines: the question this answers is what
 * proportion of registered tenancies were new, and a proportion is easier to
 * read as one bar than as the distance between two curves.
 */
function Composition({
  news,
  renewals,
}: {
  news: readonly MarketRow[];
  renewals: readonly MarketRow[];
}) {
  const byPeriod = new Map<string, { newCount: number; renewedCount: number }>();
  for (const row of news) {
    byPeriod.set(row.period_start, {
      newCount: row.metric_value,
      renewedCount: byPeriod.get(row.period_start)?.renewedCount ?? 0,
    });
  }
  for (const row of renewals) {
    byPeriod.set(row.period_start, {
      newCount: byPeriod.get(row.period_start)?.newCount ?? 0,
      renewedCount: row.metric_value,
    });
  }
  const periods = [...byPeriod.entries()]
    .filter(([, value]) => value.newCount > 0 && value.renewedCount > 0)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12);

  if (periods.length === 0) {
    return (
      <div className="border border-border p-8">
        <h3 className="lead">New and renewed registered rental contracts</h3>
        <p className="body-text mt-4 max-w-measure text-muted-foreground">{TOO_FEW_RECORDS}</p>
      </div>
    );
  }

  return (
    <figure className="m-0">
      <figcaption>
        <h3 className="lead">New and renewed registered rental contracts</h3>
        <p className="body-text mt-3 max-w-measure text-muted-foreground">
          The share of registered tenancy contracts that were signed for the first time, against
          those where an existing tenant stayed on.
        </p>
      </figcaption>

      <ul className="mt-6 space-y-3">
        {periods.map(([periodStart, value]) => {
          const total = value.newCount + value.renewedCount;
          const share = (value.newCount / total) * 100;
          return (
            <li key={periodStart} className="grid items-center gap-4 sm:grid-cols-12">
              <span className="caption sm:col-span-2">{formatPeriod("quarter", periodStart)}</span>
              <span className="sm:col-span-8" aria-hidden="true">
                <span className="flex h-[6px] w-full overflow-hidden">
                  <span className="block bg-accent" style={{ width: `${share}%` }} />
                  <span className="block flex-1 bg-border" />
                </span>
              </span>
              <span className="caption sm:col-span-2 sm:text-right">{Math.round(share)}% new</span>
            </li>
          );
        })}
      </ul>

      <details className="mt-6 border-t border-border">
        <summary className="eyebrow cursor-pointer list-none py-4 [&::-webkit-details-marker]:hidden">
          Show these figures as a table
        </summary>
        <div className="overflow-x-auto pb-6">
          <table className="w-full min-w-[32rem] border-collapse">
            <caption className="caption pb-4 text-left">
              New and renewed registered rental contracts by quarter.
            </caption>
            <thead>
              <tr className="border-b border-border">
                <th scope="col" className="eyebrow py-3 pr-6 text-left font-normal">
                  Quarter
                </th>
                <th scope="col" className="eyebrow py-3 pr-6 text-left font-normal">
                  New contracts
                </th>
                <th scope="col" className="eyebrow py-3 text-left font-normal">
                  Renewals
                </th>
              </tr>
            </thead>
            <tbody>
              {periods.map(([periodStart, value]) => (
                <tr key={periodStart} className="border-b border-border/60">
                  <th scope="row" className="caption py-3 pr-6 text-left font-normal">
                    {formatPeriod("quarter", periodStart)}
                  </th>
                  <td className="caption py-3 pr-6">
                    {formatMetricValue("registered_new_rental_contract_count", value.newCount)}
                  </td>
                  <td className="caption py-3">
                    {formatMetricValue(
                      "registered_renewed_rental_contract_count",
                      value.renewedCount,
                    )}
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
