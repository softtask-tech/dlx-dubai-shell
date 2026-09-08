import { createFileRoute, Link } from "@tanstack/react-router";

import { listAreasWithStats } from "@/data/market";
import { attributionFor } from "@/data/market";
import { pageHead, withHeroPreload } from "@/lib/seo";
import { itemListSchema } from "@/lib/schema";
import { stagger } from "@/lib/motion";
import { FreshnessStamp } from "@/components/market/freshness-stamp";
import { Reveal } from "@/components/site/reveal";
import { PageHero } from "@/components/site/page-hero";
import { Photo } from "@/components/site/photo";
import { areaPhoto } from "@/lib/photos";
import { Section, Eyebrow } from "@/components/ui/section";

export const Route = createFileRoute("/areas/")({
  loader: async () => ({ areas: await listAreasWithStats() }),
  head: ({ loaderData }) =>
    withHeroPreload(
      "palm-jumeirah-aerial-day",
      pageHead({
        /* The list itself, as data. An index page that names twenty
         * communities and tells a crawler nothing about them is the easiest
         * schema on the site to add and the one most likely to be asked for:
         * "which communities does DLX cover" is an answer-engine question. */
        schema: [
          itemListSchema({
            name: "Dubai communities covered by DLX Properties",
            items: (loaderData?.areas ?? []).map((area) => ({
              name: area.name,
              path: `/areas/${area.slug}`,
              ...(area.summary ? { description: area.summary } : {}),
            })),
          }),
        ],
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
    ),
  component: AreasIndex,
});

function AreasIndex() {
  const { areas } = Route.useLoaderData();

  /*
   * Real records only. Sample rows are not listed.
   *
   * `areas.stats` can carry rows its own provenance column marks `sample`, and
   * this page presents whatever it lists as "what each community has actually
   * transacted at". That sentence and an illustrative figure cannot share a
   * page. Same rule the advisor's knowledge index uses.
   *
   * WHY THESE FIGURES DO NOT COME FROM THE PUBLISHED AGGREGATES, which is
   * where the rest of the site now reads. The two describe different entity
   * spaces: this page lists communities by the name a buyer uses (Dubai
   * Marina, Downtown Dubai) and the registry publishes administrative ones
   * (Marsa Dubai, Burj Khalifa). Of a dozen common Dubai community names, two
   * match the registry's spelling. Joining them on name was tried and reverted
   * — a join that misses five times in six is worse than no join, because the
   * misses are invisible.
   *
   * Reconciling them is a data task, not a code one: `areas.dld_area_name`
   * exists for exactly this and needs filling in by hand, one community at a
   * time. Until it is, this page cites the area figures and the market pages
   * cite the registry, and both say which they are.
   */
  const covered = areas.filter((area) => area.stats?.provenance === "dld_open_data");

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
