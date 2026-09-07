import { createFileRoute, Link } from "@tanstack/react-router";
import { type CSSProperties } from "react";

import { site } from "@/config/site";
import { listPartnerDevelopers } from "@/data/catalogue";
import { getMarketPriceIndex, getMarketSummary, listAreasWithStats } from "@/data/market";
import { listAgents, listTestimonials } from "@/data/people";
import { listProperties } from "@/data/properties";
import { OFF_PLAN_PROJECTS } from "@/data/off-plan";
import { SERVICES } from "@/data/services";
import { faqSchema, reviewSchemaFor, type FaqEntry } from "@/lib/schema";
import { pageHead, withHeroPreload } from "@/lib/seo";
import { formatPrice } from "@/lib/format";
import { areaPhoto, type PhotoSlug } from "@/lib/photos";
import {
  Chapter,
  FigureBand,
  IndexRows,
  HorizontalGallery,
  Manifesto,
  MosaicGrid,
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
  buy: "interchange-overhead-blue-hour",
  sell: "tower-facade-raking-light",
  "investment-advisory": "marble-brass-detail",
  "golden-visa": "burj-khalifa-dusk-silhouette",
  relocation: "villa-courtyard-morning",
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
    ] = await Promise.all([
      listProperties({ limit: 5 }),
      listTestimonials(3),
      listPartnerDevelopers(),
      getMarketSummary(),
      getMarketPriceIndex(),
      listAreasWithStats(),
      listAgents(),
    ]);
    return {
      featured,
      testimonials,
      partners,
      marketSummary,
      marketIndex,
      areas,
      agents,
      offPlanProjects: OFF_PLAN_PROJECTS,
    };
  },
  /* Review schema is built from the rows the loader actually returned, so a
   * page with no verified reviews emits no Review nodes at all. */
  head: ({ loaderData }) =>
    withHeroPreload(
      "marina-dusk-water-level",
      pageHead({
        path: "/",
        schema: [faqSchema(FAQ_ENTRIES), ...reviewSchemaFor(loaderData?.testimonials ?? [])],
      }),
    ),
  component: Index,
});

/**
 * The homepage, as seven chapters.
 *
 * Paper and cream, ink type, one gold hairline reserved for the figures
 * that come from the official record. The green inversion is used exactly twice,
 * on the evidence band and the closing invitation, so the inversion reads as an event.
 *
 *   I    Opening      one photograph, the name, the licence line
 *   II   Statement    one enormous sentence, offset, on paper
 *   III  Evidence     inverted ink, three figures, the DLD stamp
 *   IV   Portfolio    a numbered register of practices and residences
 *   V    The two      the off-plan communities, image to the edge
 *   VI   Understand   the advisor and the snapshot, as sentences
 *   VII  Closing      inverted ink, the invitation
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
    offPlanProjects,
  } = Route.useLoaderData();

  const services = HOME_SERVICES.map((slug) => SERVICES.find((s) => s.slug === slug)).filter(
    (service): service is (typeof SERVICES)[number] => Boolean(service),
  );

  const communities = areas.filter((area) => area.stats).slice(0, 6);
  const quote = testimonials.find((entry) => entry.source_url) ?? testimonials[0] ?? null;

  const figures = [
    {
      label: "Communities covered",
      value: marketSummary.areasCovered.toLocaleString("en-AE"),
      meaning: "Each one with its own recorded price and yield history.",
    },
    {
      label: "Recorded transactions",
      value: marketSummary.transactionCount.toLocaleString("en-AE"),
      meaning: "The sample behind every median published on this site.",
    },
    ...(marketSummary.medianPricePerSqft
      ? [
          {
            label: "Median AED per sq ft",
            value: Math.round(marketSummary.medianPricePerSqft).toLocaleString("en-AE"),
            meaning: "A sanity check on any asking price you are shown.",
          },
        ]
      : []),
  ];

  return (
    <>
      {/* I. Opening. The photograph is a picture, not a background; the type
          sits beneath it on paper, the way a plate sits in a monograph. */}
      <section className="pt-16">
        <div className="relative overflow-hidden">
          <Parallax speed={0.35} className="absolute inset-x-0 -top-[6%] h-[112%]">
            <Photo
              slug="marina-dusk-water-level"
              sizes="100vw"
              priority
              className="h-full w-full object-cover"
            />
          </Parallax>
          <div className="relative h-[58svh] min-h-[22rem] w-full lg:h-[68svh]" />
        </div>

        <Container className="py-section">
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <p
                className="eyebrow"
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
                  className="display-1 block ps-[8vw]"
                  data-hero-reveal
                  style={{ "--hero-delay": "200ms" } as CSSProperties}
                >
                  evidence.
                </span>
              </h1>
            </div>
            <div className="flex flex-col justify-end lg:col-span-4">
              <p
                className="lead max-w-sm text-muted-foreground"
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
              <p className="caption mt-10 flex items-center gap-3 border-t border-border pt-5">
                <span aria-hidden className="h-px w-8 bg-brass" />
                {marketSummary.attribution.label}
              </p>
            </div>
          </div>
        </Container>
      </section>

      <DiscoveryPanel />

      {/* II. Statement. Type alone, offset, no photograph competing with it. */}
      <Chapter index="I" label="Position" surface="deep">
        <div className="grid gap-12 lg:grid-cols-12">
          <h2 className="display-2 text-balance lg:col-span-8 lg:col-start-3">
            Most agencies show you what they are holding. We start from what you are trying to do.
          </h2>
          <div className="lg:col-span-6 lg:col-start-7">
            <p className="body-text text-muted-foreground">
              DLX is deliberately small. We take a limited number of mandates at a time because the
              alternative, a pipeline of a hundred half-served buyers, is how most brokerages work
              and why most buyers feel unrepresented.
            </p>
            <p className="body-text mt-5 text-muted-foreground">
              One consultant stays with you from the first call to handover. They price from
              recorded transactions, they tell you when a building has a service-charge problem, and
              they say so when the answer is that you should not buy.
            </p>
            <Link to="/about" className="eyebrow link-underline mt-8 inline-block text-accent">
              How we work
            </Link>
          </div>
        </div>
      </Chapter>

      {/* III. Evidence. The first of the two ink inversions. */}
      <Chapter index="II" label="The record" surface="ink">
        <h2 className="display-2 mb-16 max-w-3xl text-balance">
          What the official data says this month.
        </h2>
        <FigureBand
          figures={figures}
          source={marketSummary.attribution.label}
          action={
            <Link to="/market-intelligence" className="eyebrow link-underline">
              Open market intelligence
            </Link>
          }
        />
      </Chapter>

      {/* The signature interactive, and the pinned market read. */}
      <InvestmentSnapshot areas={areas} />
      <MarketSequence summary={marketSummary} index={marketIndex} areas={areas} />

      {/* IV. Portfolio. A register, set in type. */}
      <Chapter index="III" label="What we do">
        <h2 className="display-2 mb-14 max-w-3xl text-balance">Five practices, one team.</h2>
        <IndexRows
          rows={services.map((service) => ({
            id: service.slug,
            to: `/services/${service.slug}`,
            title: service.name,
            detail: service.tagline,
          }))}
        />
        <div className="mt-10">
          <Link to="/services" className="eyebrow link-underline text-accent">
            All nine practices
          </Link>
        </div>
      </Chapter>

      {/* V. The two off-plan communities in focus. */}
      <FeaturedOffPlan projects={offPlanProjects} />

      {featured.length > 0 ? (
        <HorizontalGallery
          aria-label="Selected residences"
          className="border-t border-border bg-secondary"
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
                  <Photo slug="tower-facade-raking-light" sizes="(min-width: 1024px) 34vw, 78vw" />
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

      {/* VI. Understand. Communities, then the advisor as a sentence. */}
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

      <AdvisorMoment />

      <ProofBand agents={agents} partners={partners} testimonial={quote} />

      {/* VII. Closing. The second and last ink inversion. */}
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

