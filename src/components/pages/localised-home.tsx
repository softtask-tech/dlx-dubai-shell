import { useRef, type CSSProperties } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";

import heroImage from "@/assets/hero-dubai.jpg";
import { useLocale } from "@/i18n";
import { DURATION, EASE, stagger } from "@/lib/motion";
import type { Developer, PropertyWithRelations, Testimonial } from "@/data/types";

import { Section, Container, Eyebrow } from "@/components/ui/section";
import { DeveloperStrip } from "@/components/site/developer-strip";
import { EnglishOnly } from "@/i18n/english-only";
import { Faq } from "@/components/site/faq";
import { PropertyCard } from "@/components/site/property-card";
import { Reveal } from "@/components/site/reveal";
import { TestimonialsBlock } from "@/components/site/testimonials-block";
import { TrustStrip } from "@/components/site/trust-strip";
import { Button } from "@/components/ui/button";

/**
 * The homepage, in a language other than English.
 *
 * Structurally identical to the English page and built from the same
 * primitives, so a reader switching languages recognises the page rather than
 * arriving somewhere that merely belongs to the same company. What differs is
 * the copy — and the market band is deliberately absent.
 *
 * That omission is the considered part. The market band renders DLD figures
 * with their own English labels, provenance notes and freshness stamps, and
 * half-translating a chart that carries "Source: Dubai Land Department" would
 * either strand English inside an Arabic page or restate an official
 * attribution in a language the licence does not cover. The reader gets the
 * link to it instead, marked as English, which is honest and costs them one
 * click.
 */
export function LocalisedHome({
  featured,
  testimonials,
  partners,
}: {
  featured: readonly PropertyWithRelations[];
  testimonials: readonly Testimonial[];
  partners: readonly Developer[];
}) {
  const { t, code, dir, pathIn } = useLocale();
  const reduced = useReducedMotion();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "14%"]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "28%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  /* The hover nudge on the index rows travels toward the reading edge, so it
   * runs the other way in Arabic. A translate that ignores direction reads as
   * the row retreating from the cursor. */
  const nudge = dir === "rtl" ? "group-hover:-translate-x-3" : "group-hover:translate-x-3";

  const disciplines = [
    { n: "01", label: t.home.disciplines.sales, to: "/properties" },
    { n: "02", label: t.home.disciplines.advisory, to: "/services" },
    { n: "03", label: t.home.disciplines.market, to: "/market-intelligence" },
    { n: "04", label: t.home.disciplines.guides, to: "/guides" },
  ] as const;

  return (
    <>
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
              <Eyebrow className="text-foreground/60">{t.home.eyebrow}</Eyebrow>
            </div>

            <h1 className="display-1 mt-8 max-w-5xl">
              {t.home.headline.map((line, i) => (
                <span
                  key={line}
                  className="block overflow-hidden"
                  /* The first line carries no delay. Everything after it is
                   * staggered, but the LCP candidate has to be painting in the
                   * first frame — an animation-delay on it is an LCP delay,
                   * because Chrome does not count an element at opacity 0. */
                  data-hero-reveal
                  style={{ "--hero-delay": `${i * 140}ms` } as CSSProperties}
                >
                  {line}
                </span>
              ))}
              <span
                /* Italic is a Latin convention. Arabic has no italic form, and
                 * synthesised obliquing of an Arabic face is a well-known way to
                 * make a headline look broken — so the accent carries colour
                 * alone there. */
                className={dir === "rtl" ? "block text-sand" : "block italic text-sand"}
                data-hero-reveal
                style={{ "--hero-delay": "280ms" } as CSSProperties}
              >
                {t.home.headlineAccent}
              </span>
            </h1>

            <div
              data-hero-reveal="fade"
              style={{ "--hero-delay": "560ms" } as CSSProperties}
              className="mt-12 flex flex-wrap items-center gap-8"
            >
              <a href={pathIn(code, "/properties")}>
                <Button>
                  {t.home.ctaPortfolio}
                  <EnglishOnly />
                </Button>
              </a>
              <a href={pathIn(code, "/contact")} className="eyebrow link-underline text-foreground">
                {t.home.ctaConsult}
              </a>
            </div>
          </Container>
        </motion.div>
      </div>

      <Section>
        <div className="grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <Reveal>
              <Eyebrow>{t.home.practiceEyebrow}</Eyebrow>
            </Reveal>
          </div>
          <div className="lg:col-span-8 lg:col-start-5">
            <Reveal delay={0.1}>
              <p className="display-3">{t.home.practiceStatement}</p>
            </Reveal>
            <Reveal delay={0.2}>
              <p className="body-text mt-10 max-w-measure text-muted-foreground">
                {t.home.practiceSupport}
              </p>
            </Reveal>
          </div>
        </div>
      </Section>

      <Section className="pt-0">
        <div className="hairline" />
        {disciplines.map((item, i) => (
          <Reveal key={item.n} delay={stagger(i)}>
            <a
              href={pathIn(code, item.to)}
              className="group flex items-baseline justify-between gap-8 border-b border-border py-10 transition-colors hover:border-accent"
            >
              <span className="eyebrow">{item.n}</span>
              <span
                className={`display-2 flex-1 transition-transform duration-slow ease-editorial ${nudge}`}
              >
                {item.label}
                <EnglishOnly />
              </span>
              <span className="eyebrow transition-colors group-hover:text-accent">
                {t.common.view}
              </span>
            </a>
          </Reveal>
        ))}
      </Section>

      {featured.length > 0 ? (
        <Section className="pt-0">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <Reveal>
              <Eyebrow>{t.home.selectedEyebrow}</Eyebrow>
              <h2 className="display-2 mt-6">{t.home.selectedTitle}</h2>
            </Reveal>
            <Reveal delay={0.1}>
              <a href={pathIn(code, "/properties")} className="eyebrow link-underline text-accent">
                {t.home.selectedLink}
                <EnglishOnly />
              </a>
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

      <TrustStrip className="pt-0" />
      <DeveloperStrip developers={partners} />
      <TestimonialsBlock testimonials={testimonials} />

      <Section className="pt-0">
        <Faq entries={t.home.faq} />
      </Section>

      <Section className="bg-secondary">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <Reveal>
              <h2 className="display-2">{t.home.closingTitle}</h2>
            </Reveal>
          </div>
          <div className="lg:col-span-4 lg:col-start-9">
            <Reveal delay={0.12}>
              <p className="body-text text-muted-foreground">{t.home.closingBody}</p>
              <a href={pathIn(code, "/contact")} className="mt-10 inline-block">
                <Button>{t.home.closingCta}</Button>
              </a>
            </Reveal>
          </div>
        </div>
      </Section>
    </>
  );
}
