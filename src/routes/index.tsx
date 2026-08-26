import { createFileRoute, Link } from "@tanstack/react-router";
import { type CSSProperties } from "react";
import heroImage from "@/assets/hero-dubai.jpg";
import { site } from "@/config/site";
import { listPartnerDevelopers } from "@/data/catalogue";
import { getMarketPriceIndex, getMarketSummary, listAreasWithStats } from "@/data/market";
import { listProperties } from "@/data/properties";
import { listTestimonials } from "@/data/people";
import { DURATION, EASE, stagger } from "@/lib/motion";
import { faqSchema, reviewSchemaFor, type FaqEntry } from "@/lib/schema";
import { pageHead } from "@/lib/seo";
import { Section, Container, Eyebrow } from "@/components/ui/section";
import { MarketBand } from "@/components/market/market-band";
import { DeveloperStrip } from "@/components/site/developer-strip";
import { Faq } from "@/components/site/faq";
import { PropertyCard } from "@/components/site/property-card";
import { Parallax } from "@/components/motion";
import { Reveal } from "@/components/site/reveal";
import { TestimonialsBlock } from "@/components/site/testimonials-block";
import { TrustStrip } from "@/components/site/trust-strip";
import { Button } from "@/components/ui/button";

/**
 * Questions a first-time visitor actually asks, answered from what this site
 * states elsewhere. The same entries feed the visible block and the FAQ schema,
 * never publish an answer in one and not the other.
 */
const FAQ_ENTRIES: readonly FaqEntry[] = [
  {
    question: "Is DLX Properties a licensed Dubai brokerage?",
    answer: `Yes. ${site.name} trades under RERA Office Registration Number ${site.reraOrn} and works from ${site.address.street}, ${site.address.locality}. Every transaction we handle runs through the Dubai Land Department's official process.`,
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

export const Route = createFileRoute("/")({
  loader: async () => {
    /* Everything on the home page below the fold is real data, so an empty
     * database simply renders fewer sections rather than placeholder furniture. */
    const [featured, testimonials, partners, marketSummary, marketIndex, areas] = await Promise.all(
      [
        listProperties({ limit: 3 }),
        listTestimonials(3),
        listPartnerDevelopers(),
        getMarketSummary(),
        getMarketPriceIndex(),
        listAreasWithStats(),
      ],
    );
    return { featured, testimonials, partners, marketSummary, marketIndex, areas };
  },
  /* Review schema is built from the rows the loader actually returned, so a
   * page with no verified reviews emits no Review nodes at all. */
  head: ({ loaderData }) =>
    pageHead({
      path: "/",
      schema: [faqSchema(FAQ_ENTRIES), ...reviewSchemaFor(loaderData?.testimonials ?? [])],
    }),
  component: Index,
});

function Index() {
  const { featured, testimonials, partners, marketSummary, marketIndex, areas } =
    Route.useLoaderData();
  return (
    <>
      {/*
       * The hero.
       *
       * A dark anchor, so the photograph runs to the top of the viewport with
       * the masthead sitting in it rather than on a bar above it. Three text
       * elements and one action: no eyebrow, no second call, no scroll cue.
       * The reader knows how to scroll.
       *
       * The headline animates in CSS rather than through <RevealText>. It is
       * the Largest Contentful Paint candidate on the most important page of
       * the site, and a CSS animation starts at the first paint, before a byte
       * of JavaScript has parsed. The parallax is the enhancement, and it is
       * allowed to arrive late.
       */}
      <section
        data-surface="dark"
        className="relative flex min-h-[100svh] items-end overflow-hidden pb-24 lg:pb-32"
      >
        <Parallax speed={0.78} className="absolute inset-x-0 -top-[8%] h-[116%]">
          <img
            src={heroImage}
            alt="A Dubai penthouse terrace at dawn, the skyline beyond it"
            width={1920}
            height={1280}
            fetchPriority="high"
            className="h-full w-full object-cover"
          />
        </Parallax>

        {/* The scrim. Weighted to the foot, where the type is, and thin at the
            top where the photograph should still read as a photograph. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/55 to-ink/25"
        />

        <Container className="relative">
          <h1 className="display-1 max-w-4xl">
            {["Dubai real estate,", "handled with"].map((line, i) => (
              <span
                key={line}
                className="block overflow-hidden"
                /* The first line carries no delay. Everything after it is
                 * staggered, but the LCP candidate has to be painting in the
                 * first frame, an animation-delay on it is an LCP delay,
                 * because Chrome does not count an element at opacity 0. */
                data-hero-reveal
                style={{ "--hero-delay": `${i * 140}ms` } as CSSProperties}
              >
                {line}
              </span>
            ))}
            {/* Emphasis in the italic of the same face, not in a second colour.
                Gold over a photograph is a contrast gamble and the italic says
                the same thing without taking one. `leading` and the reserve
                below keep the descender on the `j`-height off the clip. */}
            <span
              className="block overflow-hidden pb-2 leading-[1.1]"
              data-hero-reveal
              style={{ "--hero-delay": "280ms" } as CSSProperties}
            >
              <span className="italic">intention.</span>
            </span>
          </h1>

          <p
            className="body-text mt-8 max-w-xl text-on-dark-muted"
            data-hero-reveal="fade"
            style={{ "--hero-delay": "480ms" } as CSSProperties}
          >
            A private brokerage representing a small number of clients across Dubai's prime
            districts.
          </p>

          <div
            data-hero-reveal="fade"
            style={{ "--hero-delay": "640ms" } as CSSProperties}
            className="mt-12"
          >
            <Link to="/properties" search={{}}>
              <Button>View the portfolio</Button>
            </Link>
          </div>
        </Container>
      </section>

      {/* Statement */}
      <Section>
        <div className="grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <Reveal>
              <Eyebrow>The practice</Eyebrow>
            </Reveal>
          </div>
          <div className="lg:col-span-8 lg:col-start-5">
            <Reveal delay={0.1}>
              <p className="display-3">
                We represent a small number of clients across Dubai's prime districts, advising
                quietly, negotiating precisely, and holding a long view of value.
              </p>
            </Reveal>
            <Reveal delay={0.2}>
              <p className="body-text mt-10 max-w-measure text-muted-foreground">
                Acquisition, disposal and portfolio strategy for private owners, family offices and
                first-time buyers into the emirate.
              </p>
            </Reveal>
          </div>
        </div>
      </Section>

      {/* Index of disciplines */}
      <Section className="pt-0">
        <div className="hairline" />
        {[
          { n: "01", label: "Private Sales", to: "/properties" as const },
          { n: "02", label: "Advisory & Services", to: "/services" as const },
          { n: "03", label: "Market Intelligence", to: "/market-intelligence" as const },
          { n: "04", label: "Guides", to: "/guides" as const },
        ].map((item, i) => (
          <Reveal key={item.n} delay={stagger(i)}>
            <Link
              to={item.to}
              className="group flex items-baseline justify-between gap-8 border-b border-border py-10 transition-colors hover:border-accent"
            >
              <span className="eyebrow">{item.n}</span>
              <span className="display-2 flex-1 transition-transform duration-slow ease-editorial group-hover:translate-x-3">
                {item.label}
              </span>
              <span className="eyebrow transition-colors group-hover:text-accent">View</span>
            </Link>
          </Reveal>
        ))}
      </Section>

      {/* The differentiator: official data, read plainly */}
      <MarketBand summary={marketSummary} index={marketIndex} areas={areas} />

      {/* Selected listings, real inventory, or nothing at all */}
      {featured.length > 0 ? (
        <Section className="pt-0">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <Reveal>
              <Eyebrow>Selected</Eyebrow>
              <h2 className="display-2 mt-6">From the portfolio</h2>
            </Reveal>
            <Reveal delay={0.1}>
              <Link to="/properties" search={{}} className="eyebrow link-underline text-accent">
                View all properties
              </Link>
            </Reveal>
          </div>
          <div className="mt-12 grid gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((property, index) => (
              <Reveal key={property.id} delay={stagger(index)}>
                <PropertyCard property={property} />
              </Reveal>
            ))}
          </div>
        </Section>
      ) : null}

      {/* Why a small brokerage can be trusted, first scroll, every audience */}
      <TrustStrip className="pt-0" />

      <DeveloperStrip developers={partners} />

      <TestimonialsBlock testimonials={testimonials} />

      {/* Questions */}
      <Section className="pt-0">
        <Faq entries={FAQ_ENTRIES} />
      </Section>

      {/*
       * The page closes in the footer.
       *
       * There used to be a closing invitation here as well, which meant two
       * calls to the same action within one screen of each other, in the same
       * words. The footer's is the one that survives: it is a dark anchor, it
       * is on every page, and a second ask does not make a reader more likely
       * to answer.
       */}
    </>
  );
}
