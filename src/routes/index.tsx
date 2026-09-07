import { createFileRoute, Link } from "@tanstack/react-router";

import { site } from "@/config/site";
import { advisor } from "@/config/advisor";
import { listTestimonials, listAgents } from "@/data/people";
import { advisorAvailabilityFn } from "@/data/advisor.functions";
import { OFF_PLAN_PROJECTS } from "@/data/off-plan";
import { SERVICES } from "@/data/services";
import { seriesFor } from "@/data/market-public";
import { getMarketMetadataFn, getMarketOverviewFn } from "@/data/market-public.functions";
import { faqSchema, reviewSchemaFor, type FaqEntry } from "@/lib/schema";
import { pageHead, withHeroPreload } from "@/lib/seo";
import type { PhotoSlug } from "@/lib/photos";
import { Parallax } from "@/components/motion";
import { Photo } from "@/components/site/photo";
import { Reveal } from "@/components/site/reveal";
import { Emphasise } from "@/components/site/emphasis";
import { Container, Eyebrow, Section } from "@/components/ui/section";
import { NoorPanel } from "@/components/home/noor-panel";
import { MarketGlance } from "@/components/home/market-glance";
import { ServicesList, type ServiceRow } from "@/components/home/services-list";
import { OffPlanFocus } from "@/components/home/off-plan-focus";
import { TeamCards } from "@/components/home/team-cards";

/**
 * Questions a first-time visitor actually asks, answered from what this site
 * states elsewhere. The same entries feed the visible block and the FAQ schema,
 * never publish an answer in one and not the other.
 */
const FAQ_ENTRIES: readonly FaqEntry[] = [
  {
    question: "Is DLX Properties a licensed Dubai brokerage?",
    answer: `Yes. ${site.name} is a Dubai real-estate brokerage based in ${site.address.street}, ${site.address.locality}, registered with RERA under ORN ${site.reraOrn}.`,
  },
  {
    question: "What does DLX actually do for a client?",
    answer:
      "Five practices, run by one team: buying, selling, investment advisory, the Golden Visa property route and relocation. One consultant stays with you from the first conversation to the last, with no hand-offs between desks.",
  },
  {
    question: "Do I need to be in Dubai to buy?",
    answer:
      "No. Much of our client base buys from abroad, and we are set up to represent buyers remotely, viewings, due diligence and negotiation handled on your behalf. Where a step legally requires you in person or through a power of attorney, we will tell you before you commit to anything.",
  },
  {
    question: "Where do the figures on this site come from?",
    answer:
      "Dubai Land Department open data, the registry every sale and every tenancy contract in Dubai is recorded in. Every figure states the period it covers and the export it was built from. DLX Properties is independent of the Dubai Land Department and is not endorsed by it.",
  },
] as const;

/** A photograph per practice. Chosen per service, never one picture reused. */
const SERVICE_PHOTOS: Record<string, PhotoSlug> = {
  buy: "interchange-overhead-blue-hour",
  sell: "tower-facade-raking-light",
  "investment-advisory": "marble-brass-detail",
  "golden-visa": "burj-khalifa-dusk-silhouette",
  relocation: "villa-courtyard-morning",
};

/** The five the homepage leads with. The services index carries all nine. */
const HOME_SERVICES = ["buy", "sell", "investment-advisory", "golden-visa", "relocation"] as const;

/** One line per practice, written for this page rather than reused from the detail page. */
const SERVICE_LINES: Record<string, string> = {
  buy: "Represented on your side of the table, not the seller's.",
  sell: "A quiet, well-run sale, no open-house theatre.",
  "investment-advisory": "Held for the long view, not the next commission.",
  "golden-visa": "The property route, handled properly, start to finish.",
  relocation: "A move, not just a move-in.",
};

/**
 * The homepage line for each mandate.
 *
 * Kept here rather than in `off-plan.ts` because it is homepage copy: it says
 * why the project is on this page, where the project's own `headline` says
 * what the project is. The data layer stays the factbook.
 */
const OFF_PLAN_LINES: Record<string, string> = {
  "azizi-florence":
    "A 30-million sq ft masterplan, priced against the same discipline we apply at home.",
  "sobha-city-abu-dhabi":
    "Sobha's first Abu Dhabi masterplan, waterfront, and evidence-checked before we'd represent it.",
};

/*
 * A daylight frame, deliberately.
 *
 * The page opened on a night skyline with white type across it, and the type
 * lost: a lit city is a field of small bright highlights, which is the worst
 * possible ground for a paragraph. Pale haze is the opposite. It carries ink
 * type at full contrast, it makes the site read white first, and the building
 * everyone recognises is still in it.
 */
const HERO_PHOTO: PhotoSlug = "skyline-across-water-haze";

export const Route = createFileRoute("/")({
  loader: async () => {
    const [testimonials, agents, availability, metadata, quarterly] = await Promise.all([
      listTestimonials(3),
      listAgents(),
      /* Asked for here rather than read off the root's loader: it is two env
       * checks, and a page that reaches across routes for its data breaks the
       * moment either route's shape changes. */
      advisorAvailabilityFn(),
      getMarketMetadataFn(),
      getMarketOverviewFn({
        data: {
          metrics: [
            "registered_sale_count",
            "registered_rental_contract_count",
            "median_registered_annual_rent_aed",
          ],
          grain: "quarter",
          from: "2019-01-01",
          to: "2026-12-31",
          limit: 900,
        },
      }),
    ]);

    return {
      testimonials,
      agents,
      availability,
      metadata,
      quarterly,
      offPlanProjects: OFF_PLAN_PROJECTS,
    };
  },
  /* Review schema is built from the rows the loader actually returned, so a
   * page with no verified reviews emits no Review nodes at all. */
  head: ({ loaderData }) =>
    withHeroPreload(
      HERO_PHOTO,
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
 * Seven sections, and the order is an argument rather than a layout: what we
 * are, what we believe, what we can prove, what we do, what we are selling,
 * how to ask, and who answers.
 *
 * Two things it deliberately does not do. It does not open on a property
 * search, because two live mandates cannot fill one and the first thing a
 * search box teaches a visitor is that the shelves are empty. And it does not
 * reproduce the Market Intelligence page: one condensed, interactive glance,
 * then a link to the page that carries the rest.
 */
function Index() {
  const { agents, availability, metadata, quarterly, offPlanProjects } = Route.useLoaderData();

  const services: ServiceRow[] = HOME_SERVICES.flatMap((slug) => {
    const service = SERVICES.find((entry) => entry.slug === slug);
    const photo = SERVICE_PHOTOS[slug];
    if (!service || !photo) return [];
    return [{ slug, name: service.name, line: SERVICE_LINES[slug] ?? service.tagline, photo }];
  });

  /* Every registered sale in the published window, summed from the same rows
   * the chart below draws. A hard-coded figure would be stale the moment a new
   * export lands, and this page's whole claim is that it does not guess. */
  const salesOnRecord = seriesFor(quarterly, "registered_sale_count").reduce(
    (total, row) => total + row.metric_value,
    0,
  );

  const proof = [
    "RERA-registered brokerage",
    salesOnRecord > 0
      ? `${Math.round(salesOnRecord).toLocaleString("en-AE")} registered sales on record`
      : null,
    "Five languages, day or night",
  ].filter((entry): entry is string => entry !== null);

  const team = agents.slice(0, 4).map((agent) => ({
    slug: agent.slug,
    name: agent.full_name,
    role: agent.job_title,
    brn: agent.brn,
  }));

  return (
    <>
      {/*
       * I. The opening.
       *
       * Ink on paper over a pale photograph, not white on a dark one. The
       * scrim runs from solid paper at the leading edge to clear at the far
       * one, so the type sits on the page and the picture opens out beside it.
       *
       * No figure here. A large number in a hero reads as a claim about the
       * company that owns the page, and "818,497 registered sales" is a fact
       * about Dubai, not about DLX. It belongs in the market section, where it
       * is labelled and sourced. What goes here is who DLX is.
       */}
      <section className="relative -mt-16 flex min-h-hero items-center overflow-hidden md:-mt-20">
        <Parallax speed={0.86} className="absolute inset-x-0 -top-[8%] h-[116%]">
          <Photo
            slug={HERO_PHOTO}
            sizes="100vw"
            priority
            className="h-full w-full object-cover"
          />
        </Parallax>

        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-b from-paper via-paper/92 to-paper/55 lg:bg-gradient-to-r lg:from-paper lg:via-paper/80 lg:to-transparent"
        />

        <Container className="relative py-28 md:py-32">
          <div className="grid items-center gap-14 lg:grid-cols-[1fr_26rem] lg:gap-20 xl:grid-cols-[1fr_30rem]">
            <div className="max-w-[36rem]">
              <Reveal>
                <Eyebrow className="mb-6">Private Brokerage · Dubai</Eyebrow>
              </Reveal>
              {/* Plain Reveal, not the line-by-line RevealText: that one
                  splits the element with SplitType, and this headline carries
                  an <em> inside it that a text splitter would take apart. */}
              <Reveal delay={0.05}>
                <h1 className="display-1 text-balance">
                  <Emphasise text="Ask first. *Then* decide." />
                </h1>
              </Reveal>
              <Reveal delay={0.1}>
                <p className="lead mt-8 max-w-[34rem] text-muted-foreground">
                  A Dubai brokerage that answers before it sells. {advisor.name}, our AI advisor,
                  checks every answer against the Dubai Land Department record, and hands you to a
                  named consultant the moment a question turns on your circumstances.
                </p>
              </Reveal>

              {/*
               * Facts about the firm, not figures about the market. Each one is
               * checkable, which is the point. Stacked hairlines on a phone:
               * three tracked uppercase labels across 360px is three columns of
               * broken fragments, which is what this row used to be.
               */}
              <Reveal delay={0.2}>
                <ul className="mt-12 flex flex-col border-t border-border sm:flex-row sm:flex-wrap sm:gap-x-10">
                  {[
                    `RERA ORN ${site.reraOrn}`,
                    "Dubai · Abu Dhabi · Sharjah",
                    "Five languages, day or night",
                  ].map((entry) => (
                    <li
                      key={entry}
                      className="eyebrow border-b border-border py-3.5 text-muted-foreground sm:border-b-0"
                    >
                      {entry}
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>

            <Reveal delay={0.25}>
              <NoorPanel availability={availability} />
            </Reveal>
          </div>
        </Container>
      </section>

      {/* II. The position. Type alone, no photograph competing with it. */}
      <Section data-surface="light">
        <Reveal>
          <Eyebrow>Position</Eyebrow>
        </Reveal>
        <div className="mt-8 grid gap-10 lg:grid-cols-[1.3fr_0.9fr] lg:items-end lg:gap-16">
          <Reveal>
            <h2 className="display-2 text-balance">
              Most agencies sell you inventory. We sell you a straight answer.
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="body-text max-w-[38ch] text-muted-foreground">
              One consultant, start to finish. No hand-offs, no junior desk, no queue. We price
              from the registered record and flag the service-charge problem before you find it
              the hard way.
            </p>
            <p className="body-text mt-4 max-w-[38ch] text-muted-foreground">
              And we say no, plainly, when no is the right answer.
            </p>
            <Link
              to="/about"
              className="focus-ring eyebrow mt-7 inline-flex items-center gap-2 border-b border-green-mid pb-1 text-green-mid"
            >
              How we work
              <span aria-hidden className="rtl:-scale-x-100">
                →
              </span>
            </Link>
          </Reveal>
        </div>
      </Section>

      {/* III. The record, condensed to one interactive moment. */}
      <Section data-surface="dark">
        <Reveal>
          <Eyebrow className="text-gold">The record, at a glance</Eyebrow>
          <h2 className="display-2 mt-5 text-balance">We don't guess. We check.</h2>
        </Reveal>
        <MarketGlance
          rows={quarterly}
          sourceExportDate={metadata.sourceExportDate}
          marketHref="/market-intelligence"
        />
      </Section>

      {/* IV. The practices. */}
      <Section data-surface="light">
        <Reveal>
          <Eyebrow>What we do</Eyebrow>
          <h2 className="display-2 mt-5 text-balance">Five practices, one team, no hand-offs.</h2>
        </Reveal>
        <Reveal>
          <ServicesList services={services} hrefFor={(slug) => `/services/${slug}`} />
        </Reveal>
      </Section>

      {/* V. The two mandates. */}
      <Section data-surface="cream">
        <Reveal>
          <Eyebrow>In focus · off-plan</Eyebrow>
          <h2 className="display-2 mt-5 max-w-[22ch] text-balance">
            Two mandates outside Dubai, held to the same standard.
          </h2>
        </Reveal>
        <Reveal>
          <OffPlanFocus
            projects={offPlanProjects}
            lineFor={(slug) => OFF_PLAN_LINES[slug]}
          />
        </Reveal>
        <Reveal>
          <p className="body-text mt-10 max-w-[52ch] text-muted-foreground">
            Every project we represent has to clear the same evidence check before it reaches
            this page. These two have.
          </p>
        </Reveal>
      </Section>

      {/* VI. The advisor, at length. The second and last cinematic frame. */}
      <section data-surface="dark" className="relative overflow-hidden">
        <Photo
          slug="downtown-skyline-night"
          sizes="100vw"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div aria-hidden className="absolute inset-0 bg-green/88" />
        <Container className="relative py-section">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
            <Reveal>
              <Eyebrow className="text-gold">
                {advisor.name}, {advisor.role}
              </Eyebrow>
              <h2 className="display-2 mt-5 text-balance">
                An advisor that will tell you when it doesn't know.
              </h2>
              <p className="body-text mt-6 max-w-[44ch] text-on-dark-muted">
                Talk or type, in five languages, at any hour. On visas, tax, and anything that
                turns on your circumstances, {advisor.name} stops and hands you to someone named,
                not a script.
              </p>
              <a
                href={`tel:${site.contact.phoneE164}`}
                dir="ltr"
                className="focus-ring eyebrow mt-8 inline-flex min-h-12 items-center gap-2 border border-white/25 px-5 text-on-dark transition-colors hover:border-gold hover:text-gold"
              >
                Or call {site.contact.phone}
              </a>
            </Reveal>

            {/* The guardrails, read from the config the product actually runs
                on, rather than a drawing of a chat window with invented
                answers in it. If the behaviour changes, this changes with it. */}
            <Reveal delay={0.1}>
              <div className="glass p-7 sm:p-9">
                <p className="eyebrow text-gold">What it will and will not do</p>
                <ul className="mt-6">
                  {advisor.limits.map((limit) => (
                    <li
                      key={limit}
                      className="body-text border-b border-white/12 py-4 text-on-dark last:border-b-0 last:pb-0"
                    >
                      {limit}
                    </li>
                  ))}
                </ul>
                <p className="caption mt-6 text-on-dark-muted">{advisor.disclosure}</p>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* VII. Who answers. */}
      <Section data-surface="light">
        <Reveal>
          <Eyebrow>Independent representation</Eyebrow>
          <h2 className="display-2 mt-5 text-balance">The people who will answer.</h2>
        </Reveal>
        <Reveal>
          <TeamCards members={team} />
        </Reveal>
      </Section>

      {/* The questions, answered where the schema can see them too. */}
      <Section data-surface="cream">
        <Reveal>
          <Eyebrow>Before you ask</Eyebrow>
          <h2 className="display-2 mt-5 text-balance">The questions we get first.</h2>
        </Reveal>
        <dl className="mt-10 border-t border-border">
          {FAQ_ENTRIES.map((entry) => (
            <Reveal key={entry.question}>
              <div className="border-b border-border py-7">
                <dt className="display-3">{entry.question}</dt>
                <dd className="body-text mt-3 max-w-[62ch] text-muted-foreground">
                  {entry.answer}
                </dd>
              </div>
            </Reveal>
          ))}
        </dl>
      </Section>
    </>
  );
}
