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
  EditorialIndex,
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
      <section
        data-surface="dark"
        className="relative flex min-h-[100svh] items-end overflow-hidden pb-16 lg:pb-24"
      >
        <Parallax speed={0.8} className="absolute inset-x-0 -top-[8%] h-[116%]">
          <Photo slug="downtown-aerial-night-trails" sizes="100vw" priority />
        </Parallax>

        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-ink/95 via-ink/45 to-ink/15"
        />

        <Container className="relative">
          <div className="grid items-end gap-x-12 gap-y-10 lg:grid-cols-12">
            <h1 className="lg:col-span-7">
              <span
                className="display-1 block"
                data-hero-reveal
                style={{ "--hero-delay": "0ms" } as CSSProperties}
              >
                Dubai property,
              </span>
              <span
                className="display-1 block"
                data-hero-reveal
                style={{ "--hero-delay": "120ms" } as CSSProperties}
              >
                bought on evidence
              </span>
              <span
                className="accent-line mt-2 block pb-2 italic leading-[1.12]"
                data-hero-reveal
                style={{ "--hero-delay": "260ms" } as CSSProperties}
              >
                rather than atmosphere.
              </span>
            </h1>

            <div
              className="lg:col-span-4 lg:col-start-9"
              data-hero-reveal="fade"
              style={{ "--hero-delay": "460ms" } as CSSProperties}
            >
              <p className="body-text max-w-md text-on-dark-muted">
                A private Dubai brokerage. We price from Dubai Land Department records, represent a
                small number of clients, and say what the numbers say.
              </p>
              {/* One action, and nothing beside it. */}
              <Link to="/properties" search={{}} className="mt-8 inline-block">
                <Button>View the portfolio</Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>

      <DiscoveryPanel />

      {/* The thesis. Image left, argument right, on the cool paper. */}
      <SplitFeature photo="skyline-across-water-haze" side="start" className="bg-paper-cool">
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
          className="bg-paper-cool"
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
