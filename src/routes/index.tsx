import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, type CSSProperties } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
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
  const reduced = useReducedMotion();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "14%"]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "28%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <>
      {/* Hero */}
      <div ref={heroRef} className="relative h-[100svh] w-full overflow-hidden">
        <motion.img
          src={heroImage}
          alt="A minimal Dubai penthouse terrace overlooking the skyline at dawn"
          width={1920}
          height={1280}
          fetchPriority="high"
          style={reduced ? {} : { y: imageY }}
          className="absolute inset-0 h-[115%] w-full object-cover"
        />
        <div className="absolute inset-0 bg-background/25" />

        <motion.div
          style={reduced ? {} : { y: contentY, opacity: contentOpacity }}
          className="relative flex h-full items-end pb-24 lg:pb-32"
        >
          <Container>
            <div data-hero-reveal="fade">
              <Eyebrow className="text-foreground/60">Dubai · Private Brokerage</Eyebrow>
            </div>

            <h1 className="display-1 mt-8 max-w-5xl">
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
              <span
                className="block italic text-accent"
                data-hero-reveal
                style={{ "--hero-delay": "280ms" } as CSSProperties}
              >
                intention.
              </span>
            </h1>

            <div
              data-hero-reveal="fade"
              style={{ "--hero-delay": "560ms" } as CSSProperties}
              className="mt-12 flex flex-wrap items-center gap-8"
            >
              <Link to="/properties">
                <Button>View Portfolio</Button>
              </Link>
              <Link to="/contact" className="eyebrow link-underline text-foreground">
                Private consultation
              </Link>
            </div>
          </Container>
        </motion.div>
      </div>

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

      {/* Closing */}
      <Section className="bg-secondary">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <Reveal>
              <h2 className="display-2">Begin a quiet conversation.</h2>
            </Reveal>
          </div>
          <div className="lg:col-span-4 lg:col-start-9">
            <Reveal delay={0.12}>
              <p className="body-text text-muted-foreground">
                Whether you are acquiring, exiting or simply observing the market, our team is
                available for a discreet, no-obligation discussion.
              </p>
              <Link to="/contact" className="mt-10 inline-block">
                <Button>Contact DLX</Button>
              </Link>
            </Reveal>
          </div>
        </div>
      </Section>
    </>
  );
}
