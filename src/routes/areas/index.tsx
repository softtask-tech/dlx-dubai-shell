import { createFileRoute, Link } from "@tanstack/react-router";

import { listAreasWithStats } from "@/data/market";
import { listDldAreasWithStatsFn } from "@/data/market-public.functions";
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
  loader: async () => {
    /*
     * The registry, because the curated table is empty.
     *
     * `areas` and `area_market_stats` have never been populated, so this page
     * said "community data is loading" to every visitor while 153 communities
     * with real prices and yields sat in `dld_market_aggregates`, feeding the
     * market pages two clicks away. The page was apologising for data the site
     * already had.
     *
     * So it lists what the registry publishes and links each one to its own
     * community page, which exists and works. The curated table is still read
     * for the guide content, and any community it covers keeps its photograph;
     * the rest are listed without one rather than not listed at all.
     */
    const [published, curated] = await Promise.all([
      listDldAreasWithStatsFn(),
      listAreasWithStats().catch(() => []),
    ]);
    return { published, curated };
  },
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
            items: (loaderData?.published ?? []).map((area) => ({
              name: area.name,
              path: `/market-intelligence/communities/${area.id}`,
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
  const { published, curated } = Route.useLoaderData();

  /*
   * Every community the registry publishes, with the curated photograph where
   * we happen to have one.
   *
   * Sorted by how much actually changed hands, so the communities a reader has
   * heard of and the communities that are actually trading are near the top,
   * rather than whichever the database returned first.
   */
  const bySlug = new Map(curated.map((area) => [area.name.trim().toLowerCase(), area.slug]));
  const covered = [...published].sort((a, b) => {
    const left = a.stats?.transaction_count ?? 0;
    const right = b.stats?.transaction_count ?? 0;
    return right - left;
  });

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
            {/* Only reachable if the registry itself returns nothing, which
                means an export problem rather than a page waiting to be
                filled. Says that, instead of implying the site is unfinished. */}
            <Eyebrow>Temporarily unavailable</Eyebrow>
            <h2 className="display-3 mt-6">The community figures are not responding.</h2>
            <p className="body-text mx-auto mt-6 max-w-measure text-muted-foreground">
              This is ours to fix, not something you need to wait for. The full market analysis is
              still available, and a consultant can answer for any community directly.
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
                  to="/market-intelligence/communities/$id"
                  params={{ id: area.id }}
                  className="group grid items-center gap-x-6 gap-y-3 py-8 md:grid-cols-12"
                >
                  {/* The communities page had no photograph anywhere below the
                      opening, which on the one page that is about places is
                      the wrong thing to leave out. Small, because the row is a
                      comparison and the numbers are the point. */}
                  {/* A photograph only where the curated table actually
                      covers this community. A stock frame stood in for a place
                      it was not of would be worse than the space. */}
                  <span className="hidden overflow-hidden md:col-span-2 md:block">
                    {bySlug.has(area.name.trim().toLowerCase()) ? (
                      <span className="block aspect-4/3 w-full overflow-hidden">
                        <Photo
                          slug={areaPhoto(bySlug.get(area.name.trim().toLowerCase()) ?? "")}
                          sizes="(min-width: 768px) 15vw, 0px"
                          alt=""
                          className="transition-transform duration-slow ease-editorial group-hover:scale-[1.04]"
                        />
                      </span>
                    ) : (
                      <span aria-hidden className="block h-px w-10 bg-gold-ink" />
                    )}
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
