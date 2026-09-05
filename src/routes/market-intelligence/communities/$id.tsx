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
import { getMarketEntitySeriesFn, getMarketMetadataFn } from "@/data/market-public.functions";
import { datasetSchema } from "@/lib/schema";
import { pageHead } from "@/lib/seo";
import { stagger } from "@/lib/motion";
import { QualifiedForm } from "@/components/forms/qualified-form";
import { RegisteredSeries } from "@/components/market/registered-series";
import { Stat } from "@/components/market/stat";
import { Reveal } from "@/components/site/reveal";
import { Section, Container, Eyebrow } from "@/components/ui/section";

const FROM = "2015-01-01";
const TO = "2026-12-31";

export const Route = createFileRoute("/market-intelligence/communities/$id")({
  loader: async ({ params }) => {
    if (!/^[0-9]{1,12}$/.test(params.id)) throw notFound();
    const [metadata, saleQuarters, rentalQuarters, rentQuarters, saleYears, rentalYears] =
      await Promise.all([
        getMarketMetadataFn(),
        series(params.id, "registered_sale_count", "quarter"),
        series(params.id, "registered_rental_contract_count", "quarter"),
        series(params.id, "median_registered_annual_rent_aed", "quarter"),
        series(params.id, "registered_sale_count", "year"),
        series(params.id, "registered_rental_contract_count", "year"),
      ]);

    const named = [...saleQuarters, ...rentalQuarters, ...rentQuarters, ...saleYears].find(
      (row) => row.name_en,
    );
    if (!named && metadata.rowCount > 0) throw notFound();

    return {
      metadata,
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
      title: `${name} registered activity`,
      description: `Registered sale transactions, registered rental contracts and the median registered annual rent for ${name}, drawn from Dubai Land Department open data with the record count behind every figure.`,
      tagline: `${name}, as the registry records it.`,
      breadcrumbs: [
        { name: "Market Intelligence", path: "/market-intelligence" },
        { name, path: `/market-intelligence/communities/${loaderData?.id ?? ""}` },
      ],
      schema: exported
        ? [
            datasetSchema({
              name: `${name} registered property activity`,
              description: `Counts of registered sale transactions and registered tenancy contracts, and the median registered annual rent, for ${name} in Dubai, derived from Dubai Land Department open data.`,
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

function series(id: string, metric: MarketMetric, grain: "quarter" | "year") {
  return getMarketEntitySeriesFn({
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
}

function CommunityMarketPage() {
  const { metadata, nameEn, nameAr, saleQuarters, rentalQuarters, rentQuarters, saleYears, rentalYears } =
    Route.useLoaderData();

  const latestSale = latestRow(saleQuarters);
  const latestRental = latestRow(rentalQuarters);
  const latestRent = latestRow(rentQuarters);
  const period = latestSale ?? latestRental ?? latestRent;
  const hasAnything =
    saleQuarters.length + rentalQuarters.length + rentQuarters.length + saleYears.length > 0;

  return (
    <>
      <Section className="pt-40">
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
            What was actually registered here with the Dubai Land Department: how many sales, how
            many tenancies, and the middle registered annual rent. Nothing modelled, nothing
            estimated.
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
          <Section data-surface="dark" className="bg-ink">
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
function Confidence({ rows, dark = false }: { rows: readonly (MarketRow | null)[]; dark?: boolean }) {
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
      {CONFIDENCE_LABELS[weakest as MarketConfidence]} Based on up to{" "}
      {records.toLocaleString("en-AE")} registered records in the period.
    </p>
  );
}
