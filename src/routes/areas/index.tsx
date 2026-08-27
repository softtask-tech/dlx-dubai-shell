import { createFileRoute, Link } from "@tanstack/react-router";

import { listAreasWithStats } from "@/data/market";
import { attributionFor } from "@/data/market";
import { pageHead } from "@/lib/seo";
import { stagger } from "@/lib/motion";
import { FreshnessStamp } from "@/components/market/freshness-stamp";
import { Reveal } from "@/components/site/reveal";
import { PageHero } from "@/components/site/page-hero";
import { Photo } from "@/components/site/photo";
import { areaPhoto } from "@/lib/photos";
import { Section, Eyebrow } from "@/components/ui/section";

export const Route = createFileRoute("/areas/")({
  loader: async () => ({ areas: await listAreasWithStats() }),
  head: () =>
    pageHead({
      path: "/areas",
      title: "Dubai Communities",
      description:
        "Every Dubai community we cover, with recorded prices, rental yields and transaction volumes, and a plain answer to whether it is worth buying there.",
      tagline: "Where the numbers say to look.",
      image: "/og/areas.png",
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
      <PageHero
        photo="palm-jumeirah-aerial-day"
        title="Where the numbers say to look."
        lead="What each Dubai community has actually transacted at over the last year, what it returns in rent, and whether the evidence supports buying there."
      >
        <FreshnessStamp attribution={attribution} className="mt-8" />
      </PageHero>

      <Section>
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
                  className="group grid items-center gap-x-6 gap-y-3 py-8 md:grid-cols-12"
                >
                  {/* The communities page had no photograph anywhere below the
                      opening, which on the one page that is about places is
                      the wrong thing to leave out. Small, because the row is a
                      comparison and the numbers are the point. */}
                  <span className="hidden overflow-hidden md:col-span-2 md:block">
                    <span className="block aspect-4/3 w-full overflow-hidden">
                      <Photo
                        slug={areaPhoto(area.slug)}
                        sizes="(min-width: 768px) 15vw, 0px"
                        alt=""
                        className="transition-transform duration-slow ease-editorial group-hover:scale-[1.04]"
                      />
                    </span>
                  </span>
                  <span className="display-3 transition-transform duration-slow ease-editorial group-hover:translate-x-2 md:col-span-3">
                    {area.name}
                  </span>
                  <span className="caption md:col-span-2">
                    AED{" "}
                    {area.stats?.median_price_per_sqft
                      ? Math.round(area.stats.median_price_per_sqft).toLocaleString("en-AE")
                      : "-"}{" "}
                    /sq ft
                  </span>
                  <span className="caption md:col-span-2">
                    {area.stats?.yoy_price_change_pct !== null &&
                    area.stats?.yoy_price_change_pct !== undefined
                      ? `${area.stats.yoy_price_change_pct >= 0 ? "+" : ""}${area.stats.yoy_price_change_pct.toFixed(1)}% YoY`
                      : "-"}
                  </span>
                  <span className="caption md:col-span-2">
                    {area.stats?.gross_yield_pct
                      ? `${area.stats.gross_yield_pct.toFixed(1)}% yield`
                      : "-"}
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
