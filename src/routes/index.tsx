import { createFileRoute, Link } from "@tanstack/react-router";
import { type CSSProperties } from "react";

import { site } from "@/config/site";
import { listPartnerDevelopers } from "@/data/catalogue";
import { getMarketPriceIndex, getMarketSummary, listAreasWithStats } from "@/data/market";
import { listAgents, listTestimonials } from "@/data/people";
import { listProperties } from "@/data/properties";
import { getDemoProjectAccessFn } from "@/data/demo-access.functions";
import { DEMO_OFF_PLAN_PROJECTS } from "@/data/off-plan";
import { SERVICES } from "@/data/services";
import { faqSchema, reviewSchemaFor, type FaqEntry } from "@/lib/schema";
import { pageHead, withHeroPreload } from "@/lib/seo";
import { formatPrice } from "@/lib/format";
import { areaPhoto, type PhotoSlug } from "@/lib/photos";
import {
  BentoSection,
  EditorialIndex,
  MediaTile,
  SectionHead,
  StatTile,
  Tile,
  TileLink,
  HorizontalGallery,
  Manifesto,
  MosaicGrid,
  SplitFeature,
} from "@/components/layouts";
import { MaskReveal, Parallax } from "@/components/motion";
import { InvestmentSnapshot } from "@/components/market/investment-snapshot";
import { MarketSequence } from "@/components/market/market-sequence";
import { AdvisorMoment } from "@/components/site/advisor-moment";
import { Faq } from "@/components/site/faq";
import { Photo } from "@/components/site/photo";
import { ProofBand } from "@/components/site/proof-band";
import { Container, Eyebrow, Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { FeaturedOffPlan } from "@/components/commercial/featured-off-plan";
import { DiscoveryPanel } from "@/components/home/discovery-panel";
import { ContextualConversion } from "@/components/conversion/contextual-conversion";

/**
 * Questions a first-time visitor actually asks, answered from what this site
 * states elsewhere. The same entries feed the visible block and the FAQ schema,
 * never publish an answer in one and not the other.
 */
const FAQ_ENTRIES: readonly FaqEntry[] = [
  {
    question: "Is DLX Properties a licensed Dubai brokerage?",
    answer: `Yes. ${site.name} is a Dubai real-estate brokerage based in ${site.address.street}, ${site.address.locality}. Applicable regulatory identifiers belong with the relevant advertisement or compliance disclosure, not promotional copy.`,
  },
  {
    question: "What does DLX actually do for a client?",
    answer:
      "Three things: acquisition, disposal and portfolio strategy. We represent a small number of clients at a time, sourcing and negotiating on a purchase, running a discreet sale, or advising owners on what to hold, sell or restructure.",
  },
  {
    question: "Do I need to be in Dubai to buy?",
    answer:
      "No. Much of our client base buys from abroad, and we are set up to represent buyers remotely, viewings, due diligence and negotiation handled on your behalf. Where a step legally requires you in person or through a power of attorney, we will tell you before you commit to anything.",
  },
] as const;

const SERVICE_PHOTOS: Partial<Record<string, PhotoSlug>> = {
  buy: "downtown-interchange-day",
  sell: "business-bay-dusk",
  "investment-advisory": "downtown-aerial-night-trails",
  "golden-visa": "burj-khalifa-dusk-silhouette",
  relocation: "palm-jumeirah-aerial-day",
};

/** The five the homepage leads with. The services index carries all nine. */
const HOME_SERVICES = ["buy", "sell", "investment-advisory", "golden-visa", "relocation"] as const;

export const Route = createFileRoute("/")({
  loader: async () => {
    /* Everything on the home page below the fold is real data, so an empty
     * database simply renders fewer sections rather than placeholder furniture. */
    const [
      featured,
      testimonials,
      partners,
      marketSummary,
      marketIndex,
      areas,
      agents,
      demoEnabled,
    ] = await Promise.all([
      listProperties({ limit: 5 }),
      listTestimonials(3),
      listPartnerDevelopers(),
      getMarketSummary(),
      getMarketPriceIndex(),
      listAreasWithStats(),
      listAgents(),
      getDemoProjectAccessFn(),
    ]);
    return {
      featured,
      testimonials,
      partners,
      marketSummary,
      marketIndex,
      areas,
      agents,
      demoProjects: demoEnabled ? DEMO_OFF_PLAN_PROJECTS : [],
    };
  },
  /* Review schema is built from the rows the loader actually returned, so a
   * page with no verified reviews emits no Review nodes at all. */
  head: ({ loaderData }) =>
    withHeroPreload(
      "downtown-aerial-night-trails",
      pageHead({
        path: "/",
        schema: [faqSchema(FAQ_ENTRIES), ...reviewSchemaFor(loaderData?.testimonials ?? [])],
      }),
    ),
  component: Index,
});

/**
 * The homepage.
 *
 * Composed from `src/components/layouts`, under one rule that can be checked in
 * a screenshot: no two consecutive sections use the same family. Reading down,
 *
 *   full bleed   hero
 *   split        the thesis, image on the left
 *   interactive  the Investment Snapshot
 *   dark pin     the market, read from the record
 *   index        services
 *   gallery      selected residences, moving sideways
 *   mosaic       communities, cells of unequal size
 *   dark         Noor
 *   proof        people, licence, one quote
 *   manifesto    the closing line, in the serif
 *   questions    the FAQ
 *
 * Three eyebrows across eleven sections, inside the one-per-three budget, and
 * the hero carries none. Two pinned moments at most per page is the site-wide
 * rule; this page spends both, on the market read and the residences track.
 */
function Index() {
  const {
    featured,
    testimonials,
    partners,
    marketSummary,
    marketIndex,
    areas,
    agents,
    demoProjects,
  } = Route.useLoaderData();

  const services = HOME_SERVICES.map((slug) => SERVICES.find((s) => s.slug === slug)).filter(
    (service): service is (typeof SERVICES)[number] => Boolean(service),
  );

  const communities = areas.filter((area) => area.stats).slice(0, 6);
  /* One quote, and preferably one a reader can go and check. */
  const quote = testimonials.find((entry) => entry.source_url) ?? testimonials[0] ?? null;

  return (
    <>
      {/*
       * The hero.
       *
       * The heart of the page, composed as one photograph rather than as a
       * banner with type on it. Downtown from the air at night: the Burj lit,
       * traffic running through the interchange, real depth to move through.
       *
       * The type is deliberately mixed. Two lines of the workhorse sans carry
       * the statement and one serif line carries the turn, which is the whole
       * argument for keeping a second typeface. It earns its place once, here,
       * where the reader is meant to slow down.
       *
       * The headline animates in CSS rather than through RevealText: it is the
       * Largest Contentful Paint candidate and a CSS animation starts at the
       * first paint, before a byte of JavaScript has parsed. The parallax is
       * the enhancement and is allowed to arrive late.
       */}
      <section className="relative border-b border-border pt-16">
        <div className="grid min-h-[calc(100svh-4rem)] lg:grid-cols-3">
          {/* The frame. Two thirds of the masthead, and the type never sits on
              top of it: a photograph is either a picture or a background, and
              this one is a picture. */}
          <div className="relative overflow-hidden lg:col-span-2 lg:order-1">
            <Parallax speed={0.4} className="absolute inset-x-0 -top-[6%] h-[112%]">
              <Photo slug="marina-dusk-water-level" sizes="(min-width: 1024px) 67vw, 100vw" priority />
            </Parallax>
            <div className="relative aspect-4/3 w-full lg:h-full lg:aspect-auto" />
          </div>

          {/* The stone panel. One sentence, one action, three figures from the
              official record, and the stamp that says where they came from. */}
          <div className="flex flex-col justify-between gap-12 bg-secondary px-6 py-14 md:px-12 lg:order-2 lg:py-16">
            <div>
              <p
                className="eyebrow text-accent"
                data-hero-reveal="fade"
                style={{ "--hero-delay": "0ms" } as CSSProperties}
              >
                Private brokerage · Dubai
              </p>
              <h1 className="mt-8">
                <span
                  className="display-1 block"
                  data-hero-reveal
                  style={{ "--hero-delay": "80ms" } as CSSProperties}
                >
                  Bought on
                </span>
                <span
                  className="display-1 block"
                  data-hero-reveal
                  style={{ "--hero-delay": "200ms" } as CSSProperties}
                >
                  evidence.
                </span>
              </h1>
              <p
                className="lead mt-8 max-w-sm text-muted-foreground"
                data-hero-reveal="fade"
                style={{ "--hero-delay": "340ms" } as CSSProperties}
              >
                We price from Dubai Land Department records, represent a small number of clients,
                and say what the numbers say.
              </p>
              <div
                data-hero-reveal="fade"
                style={{ "--hero-delay": "440ms" } as CSSProperties}
              >
                <Link to="/properties" search={{}} className="mt-10 inline-block">
                  <Button>View the portfolio</Button>
                </Link>
              </div>
            </div>

            <dl
              className="grid grid-cols-3 gap-6 border-t border-border pt-8"
              data-hero-reveal="fade"
              style={{ "--hero-delay": "560ms" } as CSSProperties}
            >
              <div>
                <dt className="eyebrow">Communities</dt>
                <dd className="figure-md mt-2">
                  {marketSummary.areasCovered.toLocaleString("en-AE")}
                </dd>
              </div>
              <div>
                <dt className="eyebrow">Transactions</dt>
                <dd className="figure-md mt-2">
                  {marketSummary.transactionCount.toLocaleString("en-AE")}
                </dd>
              </div>
              {marketSummary.medianPricePerSqft ? (
                <div>
                  <dt className="eyebrow">Median AED/sqft</dt>
                  <dd className="figure-md mt-2">
                    {Math.round(marketSummary.medianPricePerSqft).toLocaleString("en-AE")}
                  </dd>
                </div>
              ) : null}
              <p className="caption col-span-3 flex items-center gap-2 border-t border-border pt-4">
                <span aria-hidden className="h-px w-6 bg-brass" />
                {marketSummary.attribution.label}
              </p>
            </dl>
          </div>
        </div>
      </section>


      <DiscoveryPanel />

      {/* The thesis. Image left, argument right, on the cool paper. */}
      <SplitFeature photo="skyline-across-water-haze" side="start" className="bg-secondary">
        <h2 className="display-2 text-balance">
          Most agencies show you what they are holding. We start from what you are trying to do.
        </h2>
        <p className="body-text mt-6 max-w-lg text-muted-foreground">
          DLX is deliberately small. We take a limited number of mandates at a time because the
          alternative, a pipeline of a hundred half-served buyers, is how most brokerages work and
          why most buyers feel unrepresented.
        </p>
        <p className="body-text mt-4 max-w-lg text-muted-foreground">
          One consultant stays with you from the first call to handover. They price from recorded
          transactions, they tell you when a building has a service-charge problem, and they say so
          when the answer is that you should not buy.
        </p>
        <Link to="/about" className="eyebrow link-underline mt-8 inline-block text-accent">
          How we work
        </Link>
      </SplitFeature>

      {/* The intelligence grid.
       *
       * The record, arranged as tiles rather than a band: a reader can enter at
       * whichever figure is theirs. Every number carries a plain sentence and
       * the Dubai Land Department attribution the licence requires. */}
      <BentoSection
        aria-labelledby="evidence-title"
        head={
          <SectionHead
            eyebrow="The record"
            title={<span id="evidence-title">What the official data says this month.</span>}
            lead="Figures come from Dubai Land Department records we hold ourselves, not from portal listings."
            action={
              <Link to="/market-intelligence" className="eyebrow link-underline text-accent">
                Open market intelligence
              </Link>
            }
          />
        }
      >
        <StatTile
          label="Communities covered"
          value={marketSummary.areasCovered.toLocaleString("en-AE")}
          meaning="Every community below has its own recorded price and yield history."
          source={marketSummary.attribution.label}
        />
        <StatTile
          label="Recorded transactions"
          value={marketSummary.transactionCount.toLocaleString("en-AE")}
          meaning="The sample behind every median on this site."
          source={marketSummary.attribution.label}
        />
        {marketSummary.medianPricePerSqft ? (
          <StatTile
            label="Median price"
            value={`AED ${Math.round(marketSummary.medianPricePerSqft).toLocaleString("en-AE")}`}
            meaning="Per square foot, across the communities we cover. Useful as a sanity check on any asking price."
            source={marketSummary.attribution.label}
          />
        ) : null}

        <MediaTile
          photo="palm-jumeirah-aerial-day"
          ratio="aspect-4/3"
          className="lg:col-span-8"
          to="/areas"
        >
          <p className="eyebrow text-on-dark-muted">Where we transact</p>
          <p className="display-3 mt-2">Community by community, priced from the record.</p>
        </MediaTile>

        {marketSummary.bestYield ? (
          <StatTile
            className="lg:col-span-4"
            label="Strongest gross yield"
            value={`${marketSummary.bestYield.yieldPct.toFixed(1)}%`}
            meaning={`${marketSummary.bestYield.areaName} currently returns the most rent relative to price of the communities we track.`}
            source={marketSummary.attribution.label}
          />
        ) : null}

        {marketSummary.yoyPriceChangePct !== null ? (
          <StatTile
            label="Year on year"
            value={`${marketSummary.yoyPriceChangePct > 0 ? "+" : ""}${marketSummary.yoyPriceChangePct.toFixed(1)}%`}
            meaning="Change in median price across the covered communities over twelve months."
            source={marketSummary.attribution.label}
          />
        ) : null}

        <Tile accent className="justify-between gap-8 lg:col-span-4">
          <p className="eyebrow">Ask instead of reading</p>
          <div>
            <p className="display-3 text-balance">
              Tell us the objective. We will tell you what the data supports.
            </p>
            <Link to="/contact" className="mt-6 inline-block">
              <Button variant="accent">Speak to a consultant</Button>
            </Link>
          </div>
        </Tile>

        <TileLink to="/directory" className="justify-between gap-8 lg:col-span-4">
          <p className="eyebrow text-accent">Directory</p>
          <div>
            <p className="display-3 text-balance">Search the published register yourself.</p>
            <p className="caption mt-3 text-muted-foreground">
              Developers, projects, buildings and communities, as recorded.
            </p>
          </div>
        </TileLink>
      </BentoSection>

      {/* The signature interactive. Three questions, a Dubai Land Department
          cited answer, and nothing asked in return. */}
      <InvestmentSnapshot areas={areas} />

      {/* The page's first pinned moment. */}
      <MarketSequence summary={marketSummary} index={marketIndex} areas={areas} />

      {/* Services, as an index rather than a card grid. */}
      <EditorialIndex
        heading={
          <>
            <Eyebrow>What we do</Eyebrow>
            <h2 className="display-2 mt-5 text-balance">Five practices, one team.</h2>
          </>
        }
        intro={
          <p className="body-text mt-5 text-muted-foreground">
            Each one is a mandate we take on properly or not at all.
          </p>
        }
        rows={services.map((service) => ({
          id: service.slug,
          to: `/services/${service.slug}`,
          title: service.name,
          summary: service.tagline,
          photo: SERVICE_PHOTOS[service.slug] ?? "downtown-fog-day",
        }))}
        action={
          <Link to="/services" className="eyebrow link-underline text-accent">
            All nine practices
          </Link>
        }
      />

      {/* Fictional concepts are server-gated to local/Lovable preview hosts.
          Production receives the honest private-inventory state instead. */}
      <FeaturedOffPlan projects={demoProjects} />

      {/* Selected residences, as a track the reader walks along. The second and
          last pinned moment on the page. */}
      {featured.length > 0 ? (
        <HorizontalGallery
          aria-label="Selected residences"
          className="bg-secondary"
          heading={
            <h2 className="display-2 text-balance">Selected residences, represented privately.</h2>
          }
        >
          {featured.map((property) => (
            <Link
              key={property.id}
              to="/properties/$slug"
              params={{ slug: property.slug }}
              className="group w-[78vw] shrink-0 snap-start sm:w-[52vw] lg:w-[34vw]"
            >
              <MaskReveal className="aspect-3/4 w-full">
                {property.hero_image_url ? (
                  <img
                    src={property.hero_image_url}
                    alt={property.title}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-slow ease-editorial group-hover:scale-[1.03]"
                  />
                ) : (
                  <Photo slug="business-bay-dusk" sizes="(min-width: 1024px) 34vw, 78vw" />
                )}
              </MaskReveal>
              <div className="mt-5">
                {property.area ? <p className="eyebrow">{property.area.name}</p> : null}
                <p className="display-3 mt-2 transition-colors group-hover:text-accent">
                  {property.title}
                </p>
                <p className="caption mt-1.5">{formatPrice(property.price, property.currency)}</p>
              </div>
            </Link>
          ))}
        </HorizontalGallery>
      ) : null}

      {/* Communities, as cells of deliberately unequal size. */}
      {communities.length > 0 ? (
        <MosaicGrid
          heading={
            <>
              <Eyebrow>Where we transact</Eyebrow>
              <h2 className="display-2 mt-5 text-balance">
                Six communities, and what the record says about each.
              </h2>
            </>
          }
          cells={communities.map((area) => ({
            id: area.id,
            photo: areaPhoto(area.slug),
            href: `/areas/${area.slug}`,
            children: (
              <>
                <p className="display-3">{area.name}</p>
                <p className="caption mt-2 text-on-dark-muted">
                  {area.stats?.median_price_per_sqft
                    ? `AED ${Math.round(area.stats.median_price_per_sqft).toLocaleString("en-AE")} /sq ft`
                    : null}
                  {area.stats?.gross_yield_pct
                    ? ` · ${area.stats.gross_yield_pct.toFixed(1)}% gross`
                    : null}
                </p>
              </>
            ),
          }))}
          action={
            <Link to="/areas" className="eyebrow link-underline text-accent">
              Every community we cover
            </Link>
          }
        />
      ) : null}

      {/* Noor. The page's second dark anchor. */}
      <AdvisorMoment />

      {/* Proof, as one band rather than three. */}
      <ProofBand agents={agents} partners={partners} testimonial={quote} />

      {/* The page's one type-only moment, and the only other place the serif
          appears. */}
      <Manifesto
        footnote={
          <>
            {site.name}. {site.address.street}, {site.address.locality}.
          </>
        }
      >
        We would rather lose the transaction than be the reason someone bought the wrong thing.
      </Manifesto>

      <ContextualConversion
        source="homepage-closing"
        intent="consultation"
        title="A private conversation, grounded in your objective."
      />

      <Section className="pt-0">
        <Faq eyebrow={null} entries={FAQ_ENTRIES} />
      </Section>
    </>
  );
}
