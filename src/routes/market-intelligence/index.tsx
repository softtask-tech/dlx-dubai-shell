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
  type OffPlanSplitRow,
} from "@/data/market-public";
import {
  getCommunityLeaderboardFn,
  getLatestPeriodFn,
  getOffPlanSplitFn,
  getOffPlanSplitPeriodFn,
  getMarketMetadataFn,
  getMarketOverviewFn,
} from "@/data/market-public.functions";
import {
  CommunityLeague,
  LEAGUE_COLUMNS,
  buildLeague,
} from "@/components/market/community-league";
import { YieldPriceMap } from "@/components/market/yield-price-map";
import { OffPlanGap } from "@/components/market/offplan-gap";
import { rentGapSeries, shareSeries } from "@/data/market-insights";
import { datasetSchema, faqSchema, type FaqEntry } from "@/lib/schema";
import { pageHead } from "@/lib/seo";
import { retrying, tolerant } from "@/lib/resilient";

import { stagger } from "@/lib/motion";
import { QualifiedForm } from "@/components/forms/qualified-form";
import { RegisteredSeries } from "@/components/market/registered-series";
import { MarketBrief } from "@/components/market/market-brief";
import { CompositionSeries } from "@/components/market/composition-series";
import { RentGap } from "@/components/market/rent-gap";
import { Stat } from "@/components/market/stat";
import { Reveal } from "@/components/site/reveal";
import { ReportMasthead } from "@/components/market/report-masthead";
import { Section, Container, Eyebrow } from "@/components/ui/section";
import { SectionOpener } from "@/components/site/section-opener";
import { site } from "@/config/site";

const FAQS: readonly FaqEntry[] = [
  {
    question: "Where do these numbers come from?",
    answer:
      "Dubai Land Department open data, the registry every sale and every tenancy contract in Dubai is recorded in. We publish counts of registered activity, registered prices and rents and the yield they imply, each with the number of records behind it and the period it covers. DLX Properties is independent of the Dubai Land Department and is not endorsed by it.",
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

/* Published from the same export as the counts, and allowed at Dubai level for
 * the quarter grain only. Kept in a separate request so a scope the registry
 * later withdraws empties one section rather than the whole page. */
const LEAGUE_METRICS = [
  "median_price_per_sqft",
  "median_rent_per_sqft",
  "gross_rental_yield_pct",
] as const;

const PRICE_METRICS = [
  "median_price_per_sqft",
  "median_sale_price",
  "median_rent_per_sqft",
  "gross_rental_yield_pct",
] as const;

/**
 * Strips the fields nothing on this page reads, before they are serialised.
 *
 * Measured on the live page: 530 KB of hydration payload across 1,098 rows,
 * every one carrying `aggregate_key` (about seventy characters), a
 * `methodology_version` and a `source_export_date`. None of the three is read
 * by any component; the export date is fetched once as metadata and shown from
 * there. They were sent 1,098 times so the browser could throw them away,
 * which is most of why this page felt like it was not loading.
 *
 * The shape is kept rather than narrowed, so nothing downstream changes type.
 * React keys used to be built from `aggregate_key` and are now composed from
 * metric, segment and period, which is unique per row by construction.
 */
function forClient(rows: readonly MarketRow[]): MarketRow[] {
  return rows.map((row) => ({
    ...row,
    aggregate_key: "",
    methodology_version: "",
    source_export_date: "",
    name_ar: "",
  }));
}

export const Route = createFileRoute("/market-intelligence/")({
  loader: async () => {
    /*
     * Two round trips deep, not seven.
     *
     * Three of these reads depend on a period lookup, and written the obvious
     * way — look up a period, fetch with it, repeat — the page waited on seven
     * requests in a row before it could render a byte. This page has been slow
     * once already for exactly that kind of reason.
     *
     * So every lookup that depends on nothing goes in the first wave, and
     * everything that needed a period from it goes in the second. Which period
     * to use is still asked rather than assumed: the price series, the yearly
     * service charge and the off-plan split do not land in the same quarter,
     * and guessing renders an empty section the week before an export.
     */
    const [leaguePeriod, chargePeriod, offPlanSplitPeriod, metadata, quarterly, monthly, prices] =
      await Promise.all([
        tolerant(
          () =>
            getLatestPeriodFn({
              data: { entityType: "community", metric: "median_price_per_sqft", grain: "quarter" },
            }),
          null,
          "league period",
        ),
        tolerant(
          () =>
            getLatestPeriodFn({
              data: {
                entityType: "community",
                metric: "median_service_charge_sqft",
                grain: "year",
              },
            }),
          null,
          "service charge period",
        ),
        tolerant(
          () =>
            getOffPlanSplitPeriodFn({
              data: { metric: "median_price_per_sqft", grain: "quarter", minObservations: 30 },
            }),
          null,
          "off-plan split period",
        ),
        retrying(() => getMarketMetadataFn(), "market metadata"),
        tolerant(
          () =>
            getMarketOverviewFn({
              data: {
                metrics: [...HEADLINE_METRICS],
                grain: "quarter",
                /* Four years reads as a series. Seven is the same shape at twice
                 * the payload, and the older quarters are in the CSV behind the
                 * methodology note for anyone who wants them. */
                from: "2022-01-01",
                to: "2026-12-31",
                limit: 900,
              },
            }),
          [],
          "quarterly overview",
        ),
        tolerant(
          () =>
            getMarketOverviewFn({
              data: {
                metrics: ["registered_sale_count", "registered_rental_contract_count"],
                grain: "month",
                from: "2023-01-01",
                to: "2026-12-31",
                limit: 900,
              },
            }),
          [],
          "monthly overview",
        ),
        tolerant(
          () =>
            getMarketOverviewFn({
              data: {
                metrics: [...PRICE_METRICS],
                grain: "quarter",
                from: "2022-01-01",
                to: "2026-12-31",
                limit: 900,
              },
            }),
          [],
          "price overview",
        ),
      ]);


    const [leagueEntries, charges, offPlanSplit] = await Promise.all([
      leaguePeriod
        ? Promise.all(
            LEAGUE_METRICS.map(async (metric) => {
              const rows = await tolerant(
                () =>
                  getCommunityLeaderboardFn({
                    data: { metric, grain: "quarter", period: leaguePeriod, limit: 120 },
                  }),
                [] as MarketRow[],
                `leaderboard ${metric}`,
              );
              return [metric, rows] as const;
            }),
          )
        : Promise.resolve([] as (readonly [string, MarketRow[]])[]),
      /* The service charge is a yearly budget rather than a quarterly market,
       * so it comes back on its own grain and is joined in by community. */
      chargePeriod
        ? tolerant(
            () =>
              getCommunityLeaderboardFn({
                data: {
                  metric: "median_service_charge_sqft",
                  grain: "year",
                  period: chargePeriod,
                  limit: 200,
                },
              }),
            [] as MarketRow[],
            "service charge leaderboard",
          )
        : Promise.resolve([] as MarketRow[]),
      offPlanSplitPeriod
        ? tolerant(
            () =>
              getOffPlanSplitFn({
                data: {
                  metric: "median_price_per_sqft",
                  grain: "quarter",
                  period: offPlanSplitPeriod,
                  minObservations: 30,
                  limit: 80,
                },
              }),
            [] as OffPlanSplitRow[],
            "off-plan split",
          )
        : Promise.resolve([] as OffPlanSplitRow[]),
    ]);


    /*
     * Joined here rather than in the component, which is a page-weight fix.
     *
     * Whatever a loader returns is serialised into the HTML so the client can
     * hydrate without re-fetching. These four leaderboards are roughly 560
     * MarketRows at about 400 bytes each — a couple of hundred kilobytes of
     * document — and the table built from them is 58 rows carrying four
     * numbers apiece. The page was shipping the raw ingredients and cooking
     * them in the browser.
     *
     * buildLeague is pure, so running it here costs nothing and the reader
     * downloads the answer instead of the working.
     */
    const leagueRows = buildLeague(
      { ...Object.fromEntries(leagueEntries), median_service_charge_sqft: charges },
      "median_price_per_sqft",
    );

    return {
      metadata,
      quarterly: forClient(quarterly),
      monthly: forClient(monthly),
      prices: forClient(prices),
      leagueRows,
      leaguePeriod,
      offPlanSplit,
      offPlanSplitPeriod,
    };
  },

  head: ({ loaderData }) => {
    const exported = loaderData?.metadata.sourceExportDate ?? null;
    return pageHead({
      path: "/market-intelligence",
      title: "Dubai Market Intelligence",
      description:
        "Registered sale prices, price and rent per square foot, gross rental yield and registered transaction volumes for Dubai, built from Dubai Land Department open data with the record count behind every figure.",
      breadcrumbs: [{ name: "Market Intelligence", path: "/market-intelligence" }],
      schema: [
        faqSchema(FAQS),
        datasetSchema({
          name: "Dubai registered property prices, rents and activity",
          description:
            "Median registered sale price and price per square foot, median registered rent per square foot and gross rental yield, alongside counts of registered sale transactions and tenancy contracts for Dubai and its communities, derived from Dubai Land Department open data.",

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
  const {
    metadata,
    quarterly,
    monthly,
    prices,
    leagueRows,
    leaguePeriod,
    offPlanSplit,
    offPlanSplitPeriod,
  } = Route.useLoaderData();

  const saleQuarters = seriesFor(quarterly, "registered_sale_count");
  const rentalQuarters = seriesFor(quarterly, "registered_rental_contract_count");
  const rentQuarters = seriesFor(quarterly, "median_registered_annual_rent_aed");
  const newQuarters = seriesFor(quarterly, "registered_new_rental_contract_count", "new");
  const renewedQuarters = seriesFor(
    quarterly,
    "registered_renewed_rental_contract_count",
    "renewed",
  );

  const ppsfQuarters = seriesFor(prices, "median_price_per_sqft");
  const salePriceQuarters = seriesFor(prices, "median_sale_price");
  const rentPsfQuarters = seriesFor(prices, "median_rent_per_sqft");
  const yieldQuarters = seriesFor(prices, "gross_rental_yield_pct");

  const latestSale = latestRow(saleQuarters);
  const latestRental = latestRow(rentalQuarters);
  const latestRent = latestRow(rentQuarters);
  const latestNew = latestRow(newQuarters);
  const latestRenewed = latestRow(renewedQuarters);
  const latestPpsf = latestRow(ppsfQuarters);
  const latestSalePrice = latestRow(salePriceQuarters);
  const latestRentPsf = latestRow(rentPsfQuarters);
  const latestYield = latestRow(yieldQuarters);

  const period = latestSale ?? latestRental ?? latestRent;
  const periodLabel = period ? formatPeriod("quarter", period.period_start) : null;
  const pricePeriodLabel = latestPpsf ? formatPeriod("quarter", latestPpsf.period_start) : null;
  const published = metadata.rowCount > 0;




  /* The two derived readings the page leads with. Both come back empty where
   * the registry has not published both sides of the comparison, and the
   * sections that use them simply do not render. */
  const offPlanShare = shareSeries(quarterly, "registered_sale_count", "off_plan", "existing");
  const homeTypeShare = shareSeries(quarterly, "registered_sale_count", "apartment", "villa");
  const rentGap = rentGapSeries(quarterly);

  /*
   * The four the page leads with, and the order is the order a buyer asks
   * them in: what does it cost, what is one square foot, what does it earn,
   * how busy is the market. Anything the registry has not published for the
   * latest period is left out rather than shown as a dash.
   */
  const figureFor = (
    row: MarketRow | null,
    label: string,
    format: (value: number) => string,
    note: string,
  ) =>
    row
      ? [
          {
            label,
            value: format(row.metric_value),
            note,
            basis: `${row.observation_count.toLocaleString("en-AE")} records · ${formatPeriod("quarter", row.period_start)}`,
          },
        ]
      : [];

  const mastheadFigures = [
    ...figureFor(
      latestPpsf,
      "Median price per sqft",
      (value) => `AED ${Math.round(value).toLocaleString("en-AE")}`,
      "The middle registered sale, by area rather than by unit, so a studio and a villa compare.",
    ),
    ...figureFor(
      latestSalePrice,
      "Median registered sale",
      (value) => `AED ${Math.round(value).toLocaleString("en-AE")}`,
      "Half of registered sales were agreed below this figure and half above.",
    ),
    ...figureFor(
      latestYield,
      "Gross rental yield",
      (value) => `${value.toFixed(2)}%`,
      "Rent per square foot over ready-property price. Before the service charge.",
    ),
    ...figureFor(
      latestSale,
      "Registered sales",
      (value) => Math.round(value).toLocaleString("en-AE"),
      "How busy the quarter was. It measures activity, not price.",
    ),
  ];

  const compositionTotal = (latestNew?.metric_value ?? 0) + (latestRenewed?.metric_value ?? 0);
  const newShare = compositionTotal
    ? Math.round(((latestNew?.metric_value ?? 0) / compositionTotal) * 100)
    : null;

  return (
    <>
      {/*
       * Figures above the fold, and no photograph.
       *
       * This page opened on a decorative skyline, so a reader arriving from a
       * search for "Dubai price per square foot" had to scroll past a picture
       * to reach the number they came for. There is no image of Dubai that
       * adds anything to a median price.
       */}
      <ReportMasthead
        eyebrow="Market intelligence"
        title="Dubai, in registered figures."
        lead="Not asking prices and not agency sentiment. What actually changed hands, what it went for, and what it earns, taken from the register every sale and tenancy in Dubai is recorded in."
        figures={mastheadFigures}
        source={
          metadata.sourceExportDate
            ? `Source: Dubai Land Department open data, export ${formatExportDate(metadata.sourceExportDate)}. ${site.name} is independent of the Dubai Land Department and is not endorsed by it.`
            : `Source: Dubai Land Department open data. ${site.name} is independent of the Dubai Land Department and is not endorsed by it.`
        }
      />

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
           * Prices, and what they earn.
           *
           * Published at Dubai level for whole quarters only, so the section
           * disappears entirely rather than half-renders where the registry has
           * not released a figure.
           */}
          {latestPpsf || latestSalePrice || latestRentPsf || latestYield ? (
            <Section data-surface="light">
              <Reveal>
                <Eyebrow>
                  Prices and yield{pricePeriodLabel ? ` · ${pricePeriodLabel}` : ""}
                </Eyebrow>
                <h2 className="display-2 mt-5 max-w-[22ch] text-balance">
                  What Dubai actually sold for, and what it earns.
                </h2>
                <p className="body-text mt-6 max-w-measure text-muted-foreground">
                  The middle registered figures for the last complete quarter. A median is the
                  middle of what was registered, so one tower of penthouses cannot pull it upward
                  the way an average would.
                </p>
              </Reveal>
              <div className="mt-12 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
                <Reveal delay={stagger(0)}>
                  <Stat
                    label="Median registered sale price"
                    value={latestSalePrice?.metric_value ?? null}
                    prefix="AED "
                    meaning={METRIC_MEANINGS.median_sale_price}
                  />
                </Reveal>
                <Reveal delay={stagger(1)}>
                  <Stat
                    label="Median price per sq ft"
                    value={latestPpsf?.metric_value ?? null}
                    prefix="AED "
                    meaning={METRIC_MEANINGS.median_price_per_sqft}
                  />
                </Reveal>
                <Reveal delay={stagger(2)}>
                  <Stat
                    label="Median rent per sq ft"
                    value={latestRentPsf?.metric_value ?? null}
                    prefix="AED "
                    meaning={METRIC_MEANINGS.median_rent_per_sqft}
                  />
                </Reveal>
                <Reveal delay={stagger(3)}>
                  <Stat
                    label="Gross rental yield"
                    value={latestYield?.metric_value ?? null}
                    decimals={1}
                    suffix="%"
                    meaning={METRIC_MEANINGS.gross_rental_yield_pct}
                  />
                </Reveal>
              </div>
              <div className="mt-16 grid gap-16 lg:grid-cols-2">
                <Reveal>
                  <RegisteredSeries
                    rows={ppsfQuarters}
                    metric="median_price_per_sqft"
                    grain="quarter"
                  />
                </Reveal>
                <Reveal delay={0.1}>
                  <RegisteredSeries
                    rows={yieldQuarters}
                    metric="gross_rental_yield_pct"
                    grain="quarter"
                  />
                </Reveal>
              </div>
              <p className="caption mt-12 max-w-measure text-muted-foreground">
                {sourceLine(metadata.sourceExportDate)}
              </p>
            </Section>
          ) : null}



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

          {/*
           * Does paying more get you less?
           *
           * Deliberately shaped unlike every other section on this page. There
           * is no opener with a headline on the left and a grey paragraph on
           * the right, because the chart arrives with its own finding written
           * across the top and a second headline above that one would be the
           * template repeating itself. An eyebrow to say where you are, then
           * the finding, then the evidence.
           *
           * It sits above the league table on purpose: the finding first, the
           * 39 rows that support it second.
           */}
          {leaguePeriod && leagueRows.length > 0 ? (
            <Section data-surface="cream">
              <Reveal>
                <Eyebrow>Price against yield</Eyebrow>
              </Reveal>
              <Reveal delay={0.06}>
                <div className="mt-8">
                  <YieldPriceMap
                    rows={leagueRows}
                    periodLabel={formatPeriod("quarter", leaguePeriod)}
                  />
                </div>
              </Reveal>
            </Section>
          ) : null}

          {/*
           * Where to look, ranked.
           *
           * Everything above describes Dubai as one thing. This is the only
           * block on the page that answers the question a buyer actually
           * arrives with, and it is the reason the price and service charge
           * metrics were worth building.
           */}
          {leaguePeriod && leagueRows.length > 0 ? (
            <Section id="communities" data-surface="light" className="scroll-mt-32">
              <SectionOpener
                title="What it costs to own, community by community."
                lead="Price, rent, gross yield, the service charge that comes off it, and what is left. Select any column to reorder."
              />
              <Reveal>
                <div className="mt-12">
                  <CommunityLeague
                    rows={leagueRows}
                    columns={LEAGUE_COLUMNS}
                    periodLabel={formatPeriod("quarter", leaguePeriod)}
                    initialSort="yield_after_charge_pct"
                  />
                </div>
              </Reveal>
            </Section>
          ) : null}

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

          {/*
           * What off-plan costs against what you could walk through.
           *
           * Sits directly after the composition block on purpose. That one
           * says how much of the market is off-plan; this one says what the
           * off-plan buyers paid for it, in the same communities, and the two
           * questions belong together.
           *
           * The caveat is on the page rather than only in the code: this
           * compares new construction against stock of any age, so some of
           * every gap is what new costs anywhere. Publishing the figure with
           * the caveat is worth far more than not publishing it.
           */}
          {offPlanSplitPeriod && offPlanSplit.length >= 5 ? (
            <Section data-surface="light">
              <SectionOpener
                eyebrow="Off-plan against ready"
                title="The same community, two prices."
                lead="Every price on this page until now blends off-plan and resale into one figure, which is the number least useful to somebody choosing between them. These are the two, apart, wherever the register publishes both."
              />
              <Reveal>
                <div className="mt-12">
                  <OffPlanGap
                    rows={offPlanSplit}
                    periodLabel={formatPeriod("quarter", offPlanSplitPeriod)}
                  />
                </div>
              </Reveal>
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
