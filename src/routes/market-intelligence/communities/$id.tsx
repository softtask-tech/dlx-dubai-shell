import { createFileRoute, Link, notFound } from "@tanstack/react-router";

import {
  CONFIDENCE_LABELS,
  METRIC_MEANINGS,
  TOO_FEW_RECORDS,
  formatExportDate,
  formatPeriod,
  latestRow,
  sourceLine,
  type MarketConfidence,
  type MarketMetric,
  type MarketRow,
} from "@/data/market-public";
import {
  getCommunityLeaderboardFn,
  getLatestPeriodFn,
  getMarketEntitySeriesFn,
  getMarketMetadataFn,
  getMarketOverviewFn,
} from "@/data/market-public.functions";
import {
  FigureContextKey,
  FigureInContext,
  type ContextFigure,
} from "@/components/market/figure-in-context";
import { datasetSchema } from "@/lib/schema";
import { pageHead } from "@/lib/seo";
import { stagger } from "@/lib/motion";
import { QualifiedForm } from "@/components/forms/qualified-form";
import { RegisteredSeries } from "@/components/market/registered-series";
import { Stat } from "@/components/market/stat";
import { Reveal } from "@/components/site/reveal";
import { Section, Container, Eyebrow } from "@/components/ui/section";

/* The metrics a community is placed against the rest of Dubai on. Each one
 * is fetched for every community at once, which gives this page its own
 * figure, its rank and the field to draw it in, from one call. */
const CONTEXT_METRICS = [
  "median_price_per_sqft",
  "median_rent_per_sqft",
  "gross_rental_yield_pct",
] as const;

const FROM = "2015-01-01";
const TO = "2026-12-31";

export const Route = createFileRoute("/market-intelligence/communities/$id")({
  loader: async ({ params }) => {
    if (!/^[0-9]{1,12}$/.test(params.id)) throw notFound();

    /*
     * Two waves, and the second one is where this page stopped being thin.
     *
     * It used to show counts and nothing to read them against. "159 registered
     * sales" and "AED 1,379 per square foot" are both uninterpretable alone,
     * and the page offered no comparison at all.
     *
     * The fix costs one extra wave and no new database function. Asking the
     * leaderboard for a metric returns every community's value for the period,
     * which is this community's figure, its rank, and the whole field to draw
     * it against, in a single call. The Dubai-wide row comes from the overview
     * so the comparison is against the official figure rather than against the
     * median of the communities, which is a different and weaker thing.
     */
    const [
      metadata,
      saleQuarters,
      rentalQuarters,
      rentQuarters,
      saleYears,
      rentalYears,
      priceQuarters,
      pricePeriod,
      chargePeriod,
      dubai,
    ] = await Promise.all([
      getMarketMetadataFn(),
      series(params.id, "registered_sale_count", "quarter"),
      series(params.id, "registered_rental_contract_count", "quarter"),
      series(params.id, "median_registered_annual_rent_aed", "quarter"),
      series(params.id, "registered_sale_count", "year"),
      series(params.id, "registered_rental_contract_count", "year"),
      series(params.id, "median_price_per_sqft", "quarter"),
      getLatestPeriodFn({
        data: { entityType: "community", metric: "median_price_per_sqft", grain: "quarter" },
      }),
      getLatestPeriodFn({
        data: { entityType: "community", metric: "median_service_charge_sqft", grain: "year" },
      }),
      getMarketOverviewFn({
        data: {
          metrics: [...CONTEXT_METRICS],
          grain: "quarter",
          from: "2024-01-01",
          to: "2030-12-31",
          limit: 300,
        },
      }),
    ]);

    const [fieldEntries, chargeField] = await Promise.all([
      pricePeriod
        ? Promise.all(
            CONTEXT_METRICS.map(async (metric) => {
              const rows = await getCommunityLeaderboardFn({
                data: { metric, grain: "quarter", period: pricePeriod, limit: 200 },
              });
              return [metric, rows] as const;
            }),
          )
        : Promise.resolve([] as (readonly [string, MarketRow[]])[]),
      chargePeriod
        ? getCommunityLeaderboardFn({
            data: {
              metric: "median_service_charge_sqft",
              grain: "year",
              period: chargePeriod,
              limit: 200,
            },
          })
        : Promise.resolve([] as MarketRow[]),
    ]);

    const fields: Record<string, MarketRow[]> = {
      ...Object.fromEntries(fieldEntries),
      median_service_charge_sqft: chargeField,
    };

    const named = [
      ...saleQuarters,
      ...rentalQuarters,
      ...rentQuarters,
      ...saleYears,
      ...priceQuarters,
      /* A community can publish a price and no counts. Before this the page
       * 404'd on those, having looked for its own name only in the count
       * series. */
      ...Object.values(fields).flatMap((rows) =>
        rows.filter((row) => row.entity_id === params.id),
      ),
    ].find((row) => row.name_en);
    if (!named && metadata.rowCount > 0) throw notFound();

    return {
      metadata,
      fields,
      dubai,
      pricePeriod,
      priceQuarters,
      id: params.id,
      nameEn: named?.name_en ?? `Community ${params.id}`,
      nameAr: named?.name_ar ?? null,
      saleQuarters,
      rentalQuarters,
      rentQuarters,
      saleYears,
      rentalYears,
    };
  },
  head: ({ loaderData }) => {
    const name = loaderData?.nameEn ?? "Community";
    const exported = loaderData?.metadata.sourceExportDate ?? null;
    return pageHead({
      path: `/market-intelligence/communities/${loaderData?.id ?? ""}`,
      title: `${name} prices, rents and yield`,
      description: `Median price per square foot, rent per square foot, gross rental yield and service charge for ${name}, each ranked against every other community in Dubai. Drawn from Dubai Land Department open data with the record count behind every figure.`,
      tagline: `What it costs to own in ${name}, on the public record.`,
      image: "/og/market-intelligence.png",
      breadcrumbs: [
        { name: "Market Intelligence", path: "/market-intelligence" },
        { name, path: `/market-intelligence/communities/${loaderData?.id ?? ""}` },
      ],
      schema: exported
        ? [
            datasetSchema({
              name: `${name} registered property activity`,
              description: `Median registered price per square foot, rent per square foot, gross rental yield, service charge and counts of registered sales and tenancies for ${name} in Dubai, derived from Dubai Land Department open data.`,
              path: `/market-intelligence/communities/${loaderData?.id ?? ""}`,
              isOfficial: true,
              dateModified: exported,
              spatialCoverage: `${name}, Dubai, United Arab Emirates`,
            }),
          ]
        : [],
    });
  },
  component: CommunityMarketPage,
});

/**
 * One headline series for this community. Published aggregates also carry
 * breakdowns (apartments, villas, new and renewed tenancies), so the whole
 * community total is the "all" segment and nothing else: mixing a breakdown
 * row into the headline would quietly understate the period.
 */
async function series(id: string, metric: MarketMetric, grain: "quarter" | "year") {
  const rows = await getMarketEntitySeriesFn({
    data: {
      entityType: "community",
      entityId: id,
      metric,
      grain,
      from: FROM,
      to: TO,
      limit: 60,
    },
  });
  return rows.filter((row) => row.segment_code === "all");
}

function CommunityMarketPage() {
  const {
    metadata,
    nameEn,
    nameAr,
    saleQuarters,
    rentalQuarters,
    rentQuarters,
    saleYears,
    rentalYears,
    fields,
    dubai,
    pricePeriod,
    priceQuarters,
    id,
  } = Route.useLoaderData();

  /*
   * This community's figure, and the field it sits in.
   *
   * Both come out of the same leaderboard rows, so there is no risk of the
   * headline figure and the strip it is drawn on coming from different periods.
   */
  const fieldOf = (metric: string) =>
    (fields[metric] ?? []).map((row) => row.metric_value).filter((value) => Number.isFinite(value));
  const mineOf = (metric: string) =>
    (fields[metric] ?? []).find((row) => row.entity_id === id)?.metric_value ?? null;
  const dubaiOf = (metric: string) => {
    const rows = dubai.filter((row) => row.metric_code === metric && row.segment_code === "all");
    let held: MarketRow | null = null;
    for (const row of rows) if (!held || row.period_start > held.period_start) held = row;
    return held?.metric_value ?? null;
  };

  const price = mineOf("median_price_per_sqft");
  const rent = mineOf("median_rent_per_sqft");
  const charge = mineOf("median_service_charge_sqft");
  /* The same derivation the league table uses, and it is only shown when all
   * three parts are published for this community. */
  const afterCharge =
    rent != null && price != null && charge != null && price > 0
      ? ((rent - charge) / price) * 100
      : null;

  const aed = (value: number) => `AED ${Math.round(value).toLocaleString("en-AE")}`;

  const figures: ContextFigure[] = [
    {
      label: "Median price per square foot",
      value: price,
      dubai: dubaiOf("median_price_per_sqft"),
      field: fieldOf("median_price_per_sqft"),
      format: aed,
      higherIs: "neither",
      meaning: "The middle registered sale here, measured by area so a studio and a villa compare.",
    },
    {
      label: "Median rent per square foot",
      value: rent,
      dubai: dubaiOf("median_rent_per_sqft"),
      field: fieldOf("median_rent_per_sqft"),
      format: (value) => `${aed(value)} a year`,
      higherIs: "neither",
      meaning: "What a square foot let for here, from registered tenancy contracts.",
    },
    {
      label: "Gross rental yield",
      value: mineOf("gross_rental_yield_pct"),
      dubai: dubaiOf("gross_rental_yield_pct"),
      field: fieldOf("gross_rental_yield_pct"),
      format: (value) => `${value.toFixed(2)}%`,
      higherIs: "better",
      meaning: "Rent per square foot over ready-property price. Before the service charge.",
    },
    {
      label: "Service charge",
      value: charge,
      dubai: null,
      field: fieldOf("median_service_charge_sqft"),
      format: (value) => `${aed(value)} a square foot`,
      higherIs: "worse",
      meaning: "The yearly charge an owner pays. It comes straight off the yield above.",
    },
  ];

  const hasContext = figures.some((figure) => figure.value != null);

  const latestSale = latestRow(saleQuarters);
  const latestRental = latestRow(rentalQuarters);
  const latestRent = latestRow(rentQuarters);
  const period = latestSale ?? latestRental ?? latestRent;
  const hasAnything =
    saleQuarters.length + rentalQuarters.length + rentQuarters.length + saleYears.length > 0;

  return (
    <>
      <Section className="pt-14 md:pt-20">
        <Reveal>
          <nav aria-label="Breadcrumb" className="mb-10">
            <Link to="/market-intelligence" className="eyebrow link-underline">
              Market Intelligence
            </Link>
          </nav>
          <Eyebrow>Community</Eyebrow>
          <h1 className="display-1 mt-5 text-balance">{nameEn}</h1>
          {nameAr ? (
            <p className="lead mt-4 text-muted-foreground" lang="ar" dir="rtl">
              {nameAr}
            </p>
          ) : null}
          <p className="lead mt-8 max-w-2xl text-muted-foreground">
            What a square foot costs here, what it rents for, what it yields once the service
            charge comes off, and how all of that compares with every other community in Dubai.
            Taken from what was registered with the Dubai Land Department. Nothing modelled,
            nothing estimated.
          </p>
          {metadata.sourceExportDate ? (
            <p className="caption mt-8">
              Source export: {formatExportDate(metadata.sourceExportDate)} · Source: Dubai Land
              Department
            </p>
          ) : null}
        </Reveal>
      </Section>

      {!hasAnything ? (
        <Section className="pt-0">
          <div className="border border-border p-12">
            <h2 className="display-3">Nothing published for this community yet.</h2>
            <p className="body-text mt-6 max-w-measure text-muted-foreground">{TOO_FEW_RECORDS}</p>
            <Link to="/contact" className="eyebrow link-underline mt-10 inline-block text-accent">
              Ask a consultant about {nameEn}
            </Link>
          </div>
        </Section>
      ) : (
        <>
          <Section data-surface="dark">
            <Eyebrow className="text-on-dark-muted">
              Latest complete period
              {period ? ` · ${formatPeriod("quarter", period.period_start)}` : ""}
            </Eyebrow>
            <div className="mt-10 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              <Reveal delay={stagger(0)}>
                <Stat
                  label="Registered sale transactions"
                  value={latestSale?.metric_value ?? null}
                  meaning={METRIC_MEANINGS.registered_sale_count}
                  fallback="Not published"
                />
              </Reveal>
              <Reveal delay={stagger(1)}>
                <Stat
                  label="Registered rental contracts"
                  value={latestRental?.metric_value ?? null}
                  meaning={METRIC_MEANINGS.registered_rental_contract_count}
                  fallback="Not published"
                />
              </Reveal>
              <Reveal delay={stagger(2)}>
                <Stat
                  label="Median registered annual rent"
                  value={latestRent?.metric_value ?? null}
                  prefix="AED "
                  meaning={METRIC_MEANINGS.median_registered_annual_rent_aed}
                  fallback="Not published"
                />
              </Reveal>
            </div>
            <Confidence rows={[latestSale, latestRental, latestRent]} dark />
          </Section>

          {/*
           * What it costs to own here, placed against the rest of Dubai.
           *
           * The most valuable block on the page and it did not exist. Above
           * this sit three counts; a count says how busy a place was and
           * nothing about whether it is worth buying in. These four say that,
           * and each one carries the field it belongs to so the reader never
           * has to hold a Dubai average in their head to interpret it.
           */}
          {hasContext ? (
            <Section data-surface="light">
              <Reveal>
                <Eyebrow>What it costs to own here</Eyebrow>
                <h2 className="display-2 mt-5 max-w-3xl text-balance">
                  {nameEn} against every other community in Dubai.
                </h2>
                <p className="body-text mt-6 max-w-measure text-muted-foreground">
                  Each figure is drawn on the field it belongs to, so a number is never left to
                  stand on its own.{" "}
                  {pricePeriod ? `Latest published quarter, ${formatPeriod("quarter", pricePeriod)}.` : ""}
                </p>
                <FigureContextKey className="mt-8" />
              </Reveal>

              <div className="mt-12 grid gap-x-14 gap-y-12 lg:grid-cols-2">
                {figures.map((figure, index) => (
                  <Reveal key={figure.label} delay={stagger(index)}>
                    <FigureInContext figure={figure} />
                  </Reveal>
                ))}
              </div>

              {afterCharge != null ? (
                <Reveal>
                  <div className="mt-14 border-t-2 border-gold pt-7">
                    <p className="eyebrow text-gold-ink">Yield after the service charge</p>
                    <p className="font-display mt-4 text-4xl leading-none tabular-nums lg:text-5xl">
                      {afterCharge.toFixed(2)}%
                    </p>
                    <p className="body-text mt-5 max-w-measure text-muted-foreground">
                      The gross yield above with this community&rsquo;s service charge taken off,
                      which is the figure a yield table almost never shows you. It is still not
                      take-home: management, maintenance and the weeks a home sits empty come off
                      after this.
                    </p>
                  </div>
                </Reveal>
              ) : null}
            </Section>
          ) : null}

          <Section className="bg-secondary">
            <Reveal>
              <Eyebrow>Quarter by quarter</Eyebrow>
              <h2 className="display-2 mt-5">The registered record for {nameEn}</h2>
            </Reveal>
            <div className="mt-14 grid gap-16 lg:grid-cols-2">
              <Reveal>
                <RegisteredSeries
                  rows={saleQuarters}
                  metric="registered_sale_count"
                  grain="quarter"
                />
              </Reveal>
              <Reveal delay={0.1}>
                <RegisteredSeries
                  rows={rentalQuarters}
                  metric="registered_rental_contract_count"
                  grain="quarter"
                />
              </Reveal>
              <Reveal>
                <RegisteredSeries
                  rows={rentQuarters}
                  metric="median_registered_annual_rent_aed"
                  grain="quarter"
                />
              </Reveal>
              <Reveal delay={0.1}>
                <RegisteredSeries
                  rows={saleYears}
                  metric="registered_sale_count"
                  grain="year"
                  title="Registered sale transactions by year"
                  description="The same registrations grouped annually, which smooths the seasonal pattern quarters carry."
                />
              </Reveal>
              {priceQuarters.length > 1 ? (
                <Reveal>
                  <RegisteredSeries
                    rows={priceQuarters}
                    metric="median_price_per_sqft"
                    grain="quarter"
                    title="Median price per square foot by quarter"
                    description="What a square foot actually changed hands for here, quarter by quarter. The count charts say how busy the market was; this one says what it cost."
                  />
                </Reveal>
              ) : null}
            </div>
            <div className="mt-16">
              <Reveal>
                <RegisteredSeries
                  rows={rentalYears}
                  metric="registered_rental_contract_count"
                  grain="year"
                  title="Registered rental contracts by year"
                  description="Annual tenancy registrations, which show whether the rental base here is growing or steady."
                />
              </Reveal>
            </div>
            <p className="caption mt-14 max-w-measure">{sourceLine(metadata.sourceExportDate)}</p>
          </Section>
        </>
      )}

      <Section>
        <div className="grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Reveal>
              <h2 className="display-2">Ask about {nameEn}.</h2>
              <p className="body-text mt-8 max-w-measure text-muted-foreground">
                A consultant will talk you through what these registrations mean for what you are
                trying to do. Sharing registered figures is information, not personalised advice.
              </p>
            </Reveal>
          </div>
          <div className="lg:col-span-7 lg:col-start-6">
            <Reveal delay={0.1}>
              <QualifiedForm
                sourceType="market_report"
                sourceDetail={`market-community-${nameEn.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                defaultIntent="invest"
                title={`Ask about ${nameEn}`}
                description="Tell us what you are weighing up and we will answer with the registered record behind it."
                submitLabel="Send my question"
              />
            </Reveal>
          </div>
        </div>
      </Section>

      <Section flush className="border-t border-border py-10">
        <Container className="flex flex-wrap items-center justify-between gap-6">
          <p className="caption">Keep reading</p>
          <nav className="flex flex-wrap gap-8" aria-label="Related pages">
            <Link to="/market-intelligence" className="eyebrow link-underline">
              Dubai overview
            </Link>
            <Link to="/market-intelligence/compare" className="eyebrow link-underline">
              Compare communities
            </Link>
            <Link to="/areas" className="eyebrow link-underline">
              Community guides
            </Link>
          </nav>
        </Container>
      </Section>
    </>
  );
}

/** States how much registered evidence sits behind the headline figures. */
function Confidence({
  rows,
  dark = false,
}: {
  rows: readonly (MarketRow | null)[];
  dark?: boolean;
}) {
  const present = rows.filter((row): row is MarketRow => row !== null);
  if (present.length === 0) return null;
  const weakest = present.some((row) => row.confidence === "counts_only")
    ? "counts_only"
    : present.some((row) => row.confidence === "moderate")
      ? "moderate"
      : "higher";
  const records = Math.max(...present.map((row) => row.observation_count));
  return (
    <p className={`caption mt-12 max-w-measure ${dark ? "text-on-dark-muted" : ""}`}>
      {CONFIDENCE_LABELS[weakest as MarketConfidence]}. Based on up to{" "}
      {records.toLocaleString("en-AE")} registered records in the period.
    </p>
  );
}
