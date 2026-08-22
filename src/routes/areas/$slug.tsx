import { createFileRoute, notFound, Link } from "@tanstack/react-router";

import { attributionFor, getAreaPriceHistory, getAreaWithStats } from "@/data/market";
import { listProperties } from "@/data/properties";
import { site } from "@/config/site";
import { formatPrice } from "@/lib/format";
import { datasetSchema } from "@/lib/schema";
import { pageHead } from "@/lib/seo";
import { stagger } from "@/lib/motion";
import { QualifiedForm } from "@/components/forms/qualified-form";
import { FreshnessStamp } from "@/components/market/freshness-stamp";
import { Stat } from "@/components/market/stat";
import { TrendChart } from "@/components/market/trend-chart";
import { VerdictCard } from "@/components/market/verdict-card";
import { PropertyCard } from "@/components/site/property-card";
import { Reveal } from "@/components/site/reveal";
import { Section, Container, Eyebrow } from "@/components/ui/section";

export const Route = createFileRoute("/areas/$slug")({
  loader: async ({ params }) => {
    const area = await getAreaWithStats(params.slug);
    if (!area) throw notFound();

    const [history, listings] = await Promise.all([
      getAreaPriceHistory(area.id),
      listProperties({ area: area.slug, limit: 3 }),
    ]);

    return { area, history, listings };
  },
  head: ({ loaderData }) => {
    const area = loaderData?.area;
    if (!area) return {};

    const stats = area.stats;
    const priceLine = stats?.median_price_per_sqft
      ? `Median AED ${Math.round(stats.median_price_per_sqft).toLocaleString("en-AE")} per sq ft`
      : "Recorded prices, yields and transaction volumes";

    const attribution = attributionFor(stats?.provenance ?? null, stats?.last_updated ?? null);

    return pageHead({
      path: `/areas/${area.slug}`,
      title: `${area.name} property market`,
      description:
        `${area.name} in numbers: ${priceLine.toLowerCase()}, rental yield, year-on-year movement and transaction volume, with a plain answer on whether to buy there.`.slice(
          0,
          160,
        ),
      tagline: `${area.name} — ${priceLine}.`,
      image: area.hero_image_url ?? "/og/market-intelligence.png",
      breadcrumbs: [
        { name: "Communities", path: "/areas" },
        { name: area.name, path: `/areas/${area.slug}` },
      ],
      /* Dataset schema makes the figures citable by AI answer engines, with the
       * provenance stated rather than implied. */
      schema: stats
        ? [
            datasetSchema({
              name: `${area.name} residential transaction statistics`,
              description: `Derived sale statistics for ${area.name}, Dubai: median and average price per square foot, transaction volume, year-on-year movement and gross rental yield, for the twelve months to ${stats.window_end}.`,
              path: `/areas/${area.slug}`,
              isOfficial: attribution.isOfficial,
              dateModified: stats.last_updated,
              temporalCoverage: `${stats.window_start}/${stats.window_end}`,
              spatialCoverage: `${area.name}, Dubai, United Arab Emirates`,
            }),
          ]
        : [],
    });
  },
  component: AreaPage,
});

function AreaPage() {
  const { area, history, listings } = Route.useLoaderData();
  const stats = area.stats;
  const attribution = attributionFor(stats?.provenance ?? null, stats?.last_updated ?? null);

  return (
    <>
      {/*
       * Opening plate. With photography it is a full-bleed image; without, a
       * typographic header rather than a tall empty rectangle — an area we
       * have no picture of should look deliberate, not broken.
       */}
      {area.hero_image_url ? (
        <div className="relative h-[55svh] w-full overflow-hidden bg-muted">
          <img
            src={area.hero_image_url}
            alt={area.name}
            fetchPriority="high"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-background/20" />
          <div className="relative flex h-full items-end pb-14">
            <Container>
              <Eyebrow>Community</Eyebrow>
              <h1 className="display-1 mt-6">{area.name}</h1>
            </Container>
          </div>
        </div>
      ) : (
        <Section className="pt-44 pb-12 lg:pt-56">
          <Eyebrow>Community</Eyebrow>
          <h1 className="display-1 mt-8">{area.name}</h1>
          {area.summary ? (
            <p className="lead mt-8 max-w-measure text-muted-foreground">{area.summary}</p>
          ) : null}
        </Section>
      )}

      {/* Layer one: the headline numbers, each with its meaning */}
      <Section className={area.hero_image_url ? undefined : "pt-0"}>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <Reveal>
            <Eyebrow>The last twelve months</Eyebrow>
            <h2 className="display-2 mt-6">{area.name} in numbers</h2>
          </Reveal>
          <Reveal delay={0.1}>
            <FreshnessStamp attribution={attribution} />
          </Reveal>
        </div>

        {stats ? (
          <div className="mt-12 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            <Reveal delay={stagger(0)}>
              <Stat
                label="Median price"
                value={stats.median_price_per_sqft}
                prefix="AED "
                suffix=" /sq ft"
                meaning="What a square foot here has actually sold for. Compare it to the asking price of anything you are shown."
              />
            </Reveal>
            <Reveal delay={stagger(1)}>
              <Stat
                label="Typical sale"
                value={stats.median_price ? stats.median_price / 1_000_000 : null}
                decimals={2}
                prefix="AED "
                suffix="M"
                meaning="The middle of the market here — half of sales were above this, half below."
              />
            </Reveal>
            <Reveal delay={stagger(2)}>
              <Stat
                label="Year on year"
                value={stats.yoy_price_change_pct}
                decimals={1}
                suffix="%"
                meaning={
                  (stats.yoy_price_change_pct ?? 0) >= 0
                    ? "Prices here are higher than a year ago. Waiting has had a cost."
                    : "Prices here are below a year ago. There is more room to negotiate than there was."
                }
              />
            </Reveal>
            <Reveal delay={stagger(3)}>
              <Stat
                label="Gross yield"
                value={stats.gross_yield_pct}
                decimals={1}
                suffix="%"
                fallback="Not shown"
                meaning={
                  stats.gross_yield_pct
                    ? "A year's registered rent against the typical sale price. Gross — service charges come out of this."
                    : "We hold no registered tenancy contracts for this community, so we are not going to estimate one."
                }
              />
            </Reveal>
          </div>
        ) : (
          <p className="body-text mt-10 max-w-measure text-muted-foreground">
            We hold no recorded transactions for {area.name} yet. Ask us directly — we will tell you
            what we are seeing on the ground rather than guess.
          </p>
        )}
      </Section>

      {/* Layer two: the chart and the verdict */}
      <Section className="bg-secondary pt-0">
        <div className="grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-7">
            {history.length >= 2 ? (
              <Reveal>
                <Eyebrow>Three years of {area.name}</Eyebrow>
                <p className="caption mt-3 max-w-measure">
                  Median price per square foot, by month of registration.
                </p>
                <TrendChart
                  points={history}
                  className="mt-8"
                  label={`Median price per square foot in ${area.name} over three years`}
                />
                <p className="caption mt-6 max-w-measure">
                  {stats?.transaction_count
                    ? `Drawn from ${stats.transaction_count.toLocaleString("en-AE")} recorded sales in the last twelve months. Months with few sales move more sharply — that is thin trading, not a crash or a boom.`
                    : null}
                </p>
              </Reveal>
            ) : null}
          </div>

          <div className="lg:col-span-4 lg:col-start-9">
            <Reveal delay={0.1}>
              <VerdictCard areaName={area.name} stats={stats} />
            </Reveal>
          </div>
        </div>
      </Section>

      {/* Living here — the context a number cannot carry */}
      {area.description || area.summary ? (
        <Section>
          <div className="grid gap-14 lg:grid-cols-12">
            <div className="lg:col-span-3">
              <Reveal>
                <Eyebrow>Living here</Eyebrow>
              </Reveal>
            </div>
            <div className="flex flex-col gap-8 lg:col-span-8 lg:col-start-5">
              {(area.description ?? area.summary ?? "").split("\n\n").map((paragraph, index) => (
                <Reveal key={paragraph.slice(0, 24)} delay={stagger(index)}>
                  <p className="lead">{paragraph}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </Section>
      ) : null}

      {/* Layer three: the gated report, which is where the lead comes from */}
      <Section className={area.description ? "bg-secondary" : "bg-secondary pt-0"}>
        <div className="grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Reveal>
              <Eyebrow>The full picture</Eyebrow>
              <h2 className="display-2 mt-6">The {area.name} report.</h2>
              <p className="body-text mt-8 max-w-measure text-muted-foreground">
                Every figure on this page, plus the building-level breakdown, the rent evidence
                behind the yield, and what we would actually pay here. Written for someone deciding,
                not browsing.
              </p>
            </Reveal>
          </div>
          <div className="lg:col-span-7 lg:col-start-6">
            <Reveal delay={0.1}>
              <QualifiedForm
                sourceType="market_report"
                sourceDetail={`area-report-${area.slug}`}
                defaultIntent="invest"
                title={`Get the ${area.name} report`}
                description="Tell us where to send it. A consultant reads every request personally."
                submitLabel="Send me the report"
              />
            </Reveal>
          </div>
        </div>
      </Section>

      {listings.length > 0 ? (
        <Section>
          <Reveal>
            <Eyebrow>Available in {area.name}</Eyebrow>
          </Reveal>
          <div className="mt-10 grid gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((property, index) => (
              <Reveal key={property.id} delay={stagger(index)}>
                <PropertyCard property={property} />
              </Reveal>
            ))}
          </div>
        </Section>
      ) : null}

      <Section flush className="border-t border-border py-10">
        <Container className="flex flex-wrap items-center justify-between gap-6">
          <FreshnessStamp attribution={attribution} />
          <p className="caption">
            {site.name} is not affiliated with the Dubai Land Department.{" "}
            <Link to="/areas" className="link-underline text-foreground">
              All communities
            </Link>
          </p>
        </Container>
      </Section>
    </>
  );
}
