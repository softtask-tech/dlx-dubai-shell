import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import heroImage from "@/assets/hero-dubai.jpg";
import { site } from "@/config/site";
import { DURATION, EASE } from "@/lib/motion";
import { faqSchema, type FaqEntry } from "@/lib/schema";
import { pageHead } from "@/lib/seo";
import { Section, Container, Eyebrow } from "@/components/ui/section";
import { Faq } from "@/components/site/faq";
import { Reveal } from "@/components/site/reveal";
import { Button } from "@/components/ui/button";

/**
 * Questions a first-time visitor actually asks, answered from what this site
 * states elsewhere. The same entries feed the visible block and the FAQ schema —
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
      "Three things: acquisition, disposal and portfolio strategy. We represent a small number of clients at a time — sourcing and negotiating on a purchase, running a discreet sale, or advising owners on what to hold, sell or restructure.",
  },
  {
    question: "Do I need to be in Dubai to buy?",
    answer:
      "No. Much of our client base buys from abroad, and we are set up to represent buyers remotely — viewings, due diligence and negotiation handled on your behalf. Where a step legally requires you in person or through a power of attorney, we will tell you before you commit to anything.",
  },
] as const;

export const Route = createFileRoute("/")({
  head: () => pageHead({ path: "/", schema: [faqSchema(FAQ_ENTRIES)] }),
  component: Index,
});

function Index() {
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
            <motion.div
              initial={reduced ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={reduced ? { duration: 0 } : { duration: DURATION.cinematic, ease: EASE }}
            >
              <Eyebrow className="text-foreground/60">Dubai · Private Brokerage</Eyebrow>
            </motion.div>

            <h1 className="mt-8 max-w-5xl text-[2.75rem] leading-[1.02] tracking-tight md:text-7xl lg:text-[5.5rem]">
              {["Dubai real estate,", "handled with"].map((line, i) => (
                <motion.span
                  key={line}
                  className="block overflow-hidden"
                  initial={reduced ? false : { opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={
                    reduced
                      ? { duration: 0 }
                      : { duration: DURATION.cinematic, delay: 0.15 + i * 0.12, ease: EASE }
                  }
                >
                  {line}
                </motion.span>
              ))}
              <motion.span
                className="block italic text-accent"
                initial={reduced ? false : { opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={
                  reduced
                    ? { duration: 0 }
                    : { duration: DURATION.cinematic, delay: 0.39, ease: EASE }
                }
              >
                intention.
              </motion.span>
            </h1>

            <motion.div
              initial={reduced ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={reduced ? { duration: 0 } : { duration: DURATION.cinematic, delay: 0.7 }}
              className="mt-12 flex flex-wrap items-center gap-8"
            >
              <Link to="/properties">
                <Button variant="editorial" size="md">
                  View Portfolio
                </Button>
              </Link>
              <Link to="/contact" className="eyebrow link-underline text-foreground">
                Private consultation
              </Link>
            </motion.div>
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
              <p className="font-display text-3xl leading-[1.25] md:text-[2.6rem]">
                We represent a small number of clients across Dubai's prime districts — advising
                quietly, negotiating precisely, and holding a long view of value.
              </p>
            </Reveal>
            <Reveal delay={0.2}>
              <p className="mt-10 max-w-xl text-base leading-relaxed text-muted-foreground">
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
          <Reveal key={item.n} delay={i * 0.06}>
            <Link
              to={item.to}
              className="group flex items-baseline justify-between gap-8 border-b border-border py-10 transition-colors hover:border-accent"
            >
              <span className="eyebrow">{item.n}</span>
              <span className="flex-1 font-display text-3xl transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-3 md:text-5xl">
                {item.label}
              </span>
              <span className="eyebrow transition-colors group-hover:text-accent">View</span>
            </Link>
          </Reveal>
        ))}
      </Section>

      {/* Questions */}
      <Section className="pt-0">
        <Faq entries={FAQ_ENTRIES} />
      </Section>

      {/* Closing */}
      <Section className="bg-secondary">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <Reveal>
              <h2 className="text-4xl leading-tight md:text-6xl">Begin a quiet conversation.</h2>
            </Reveal>
          </div>
          <div className="lg:col-span-4 lg:col-start-9">
            <Reveal delay={0.12}>
              <p className="text-base leading-relaxed text-muted-foreground">
                Whether you are acquiring, exiting or simply observing the market, our team is
                available for a discreet, no-obligation discussion.
              </p>
              <Link to="/contact" className="mt-10 inline-block">
                <Button variant="editorial" size="md">
                  Contact DLX
                </Button>
              </Link>
            </Reveal>
          </div>
        </div>
      </Section>
    </>
  );
}
