import { createFileRoute, Link } from "@tanstack/react-router";

import { listAreasWithStats } from "@/data/market";
import { attributionFor } from "@/data/market";
import { pageHead } from "@/lib/seo";
import { stagger } from "@/lib/motion";
import { FreshnessStamp } from "@/components/market/freshness-stamp";
import { Reveal } from "@/components/site/reveal";
import { Section, Eyebrow } from "@/components/ui/section";

export const Route = createFileRoute("/areas/")({
  loader: async () => ({ areas: await listAreasWithStats() }),
  head: () =>
    pageHead({
      path: "/areas",
      title: "Dubai Communities",
      description:
        "Every Dubai community we cover, with recorded prices, rental yields and transaction volumes — and a plain answer to whether it is worth buying there.",
      tagline: "Where the numbers say to look.",
      image: "/og/market-intelligence.png",
      breadcrumbs: [
        { name: "Market Intelligence", path: "/market-intelligence" },
        { name: "Communities", path: "/areas" },
      ],
    }),
  component: AreasIndex,
});

function AreasIndex() {
  const { areas } = Route.useLoaderData();
  const covered = areas.filter((area) => area.stats !== null);
  const attribution = attributionFor(
    covered[0]?.stats?.provenance ?? null,
    covered[0]?.stats?.last_updated ?? null,
  );

  return (
    <>
      <Section className="pt-44 pb-16 lg:pt-56">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Reveal>
              <Eyebrow>Communities</Eyebrow>
              <h1 className="display-1 mt-8">Where the numbers say to look</h1>
            </Reveal>
          </div>
          <div className="lg:col-span-4 lg:col-start-9">
            <Reveal delay={0.12}>
              <p className="body-text text-muted-foreground">
                What each Dubai community has actually transacted at over the last year, what it
                returns in rent, and whether the evidence supports buying there.
              </p>
              <FreshnessStamp attribution={attribution} className="mt-8" />
            </Reveal>
          </div>
        </div>
      </Section>

      <Section className="pt-0">
        {covered.length === 0 ? (
          <div className="border border-border p-12 text-center">
            <Eyebrow>Being prepared</Eyebrow>
            <h2 className="display-3 mt-6">Community data is loading.</h2>
            <p className="body-text mx-auto mt-6 max-w-measure text-muted-foreground">
              Once the Dubai Land Department snapshot is in, each community here shows its recorded
              prices, yields and volumes.
            </p>
          </div>
        ) : (
          <>
            <div className="hairline" />
            {covered.map((area, index) => (
              <Reveal
                key={area.id}
                delay={stagger(index)}
                className="border-b border-border transition-colors hover:border-accent"
              >
                <Link
                  to="/areas/$slug"
                  params={{ slug: area.slug }}
                  className="group grid items-baseline gap-4 py-10 md:grid-cols-12"
                >
                  <span className="display-3 transition-transform duration-slow ease-editorial group-hover:translate-x-3 md:col-span-4">
                    {area.name}
                  </span>
                  <span className="caption md:col-span-3">
                    AED{" "}
                    {area.stats?.median_price_per_sqft
                      ? Math.round(area.stats.median_price_per_sqft).toLocaleString("en-AE")
                      : "—"}{" "}
                    /sq ft
                  </span>
                  <span className="caption md:col-span-2">
                    {area.stats?.yoy_price_change_pct !== null &&
                    area.stats?.yoy_price_change_pct !== undefined
                      ? `${area.stats.yoy_price_change_pct >= 0 ? "+" : ""}${area.stats.yoy_price_change_pct.toFixed(1)}% YoY`
                      : "—"}
                  </span>
                  <span className="caption md:col-span-2">
                    {area.stats?.gross_yield_pct
                      ? `${area.stats.gross_yield_pct.toFixed(1)}% yield`
                      : "—"}
                  </span>
                  <span className="eyebrow transition-colors group-hover:text-accent md:col-span-1 md:text-right">
                    View
                  </span>
                </Link>
              </Reveal>
            ))}
          </>
        )}
      </Section>
    </>
  );
}
