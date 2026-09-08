import { Link } from "@tanstack/react-router";
import type { AdvisorAvailability } from "@/data/advisor.functions";
import type { MarketRow, MarketMetadata } from "@/data/market-public";
import type { CommercialProject } from "@/data/off-plan";
import { HOME_FAQ } from "@/data/home-faq";

import { site } from "@/config/site";
import { advisor } from "@/config/advisor";
import { SERVICES } from "@/data/services";
import { SERVICE_PHOTOS } from "@/data/service-photos";
import type { PhotoSlug } from "@/lib/photos";
import { Parallax } from "@/components/motion";
import { Photo } from "@/components/site/photo";
import { Reveal } from "@/components/site/reveal";
import { Emphasise } from "@/components/site/emphasis";
import { SectionOpener } from "@/components/site/section-opener";
import { StatementBand } from "@/components/site/statement-band";
import { Container, Eyebrow, Section } from "@/components/ui/section";
import { NoorPanel } from "@/components/home/noor-panel";
import { MarketGlance } from "@/components/home/market-glance";
import { ServicesList, type ServiceRow } from "@/components/home/services-list";
import { OffPlanFocus } from "@/components/home/off-plan-focus";
import { TeamCards } from "@/components/home/team-cards";

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
    "A 30-million square foot community going up in Sharjah, half an hour from Dubai on the Sheikh Mohammed Bin Zayed corridor.",
  "sobha-city-abu-dhabi":
    "Sobha's first community in Abu Dhabi, on the water. A different emirate means a different rulebook, and we walk you through it.",
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
export const HERO_PHOTO: PhotoSlug = "skyline-across-water-haze";

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
export function HomePage({
  agents,
  availability,
  metadata,
  quarterly,
  offPlanProjects,
}: {
  agents: readonly { slug: string; full_name: string; job_title: string | null; brn: string | null }[];
  availability: AdvisorAvailability;
  metadata: MarketMetadata;
  quarterly: readonly MarketRow[];
  offPlanProjects: readonly CommercialProject[];
}) {
  const services: ServiceRow[] = HOME_SERVICES.flatMap((slug) => {
    const service = SERVICES.find((entry) => entry.slug === slug);
    const photo = SERVICE_PHOTOS[slug];
    if (!service || !photo) return [];
    return [{ slug, name: service.name, line: SERVICE_LINES[slug] ?? service.tagline, photo }];
  });

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
       * scrim holds solid paper under the type and then falls away fast, so
       * the picture is actually present on the right instead of being washed
       * to a grey smudge across the whole frame.
       *
       * The proof row sits outside the text column, across the full width.
       * Inside a 36rem column three tracked uppercase labels cannot fit on one
       * line, so they wrapped and read as broken; out here they fit, and they
       * close the bottom of the frame that was otherwise dead space.
       *
       * No market figure in the hero. A large number here reads as a claim
       * about the company that owns the page, and "776,225 registered sales"
       * is a fact about Dubai. It belongs in the market section, labelled and
       * sourced. This is about DLX.
       */}
      <section className="relative -mt-16 flex min-h-[88svh] items-center overflow-hidden md:-mt-20">
        <Parallax speed={0.86} className="absolute inset-x-0 -top-[10%] h-[120%]">
          <Photo slug={HERO_PHOTO} sizes="100vw" priority className="h-full w-full object-cover" />
        </Parallax>

        <div
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(180deg,var(--paper)_0%,rgba(255,255,255,0.9)_38%,rgba(255,255,255,0.55)_100%)] lg:bg-[linear-gradient(95deg,var(--paper)_0%,var(--paper)_29%,rgba(255,255,255,0.55)_52%,rgba(255,255,255,0)_80%)]"
        />

        <Container className="relative py-24 md:py-24">
          <div className="grid items-center gap-14 lg:grid-cols-[1fr_25rem] lg:gap-16 xl:grid-cols-[1fr_28rem]">
            <div className="max-w-[34rem]">
              <Reveal>
                <Eyebrow className="mb-6">Private Brokerage · Dubai</Eyebrow>
              </Reveal>
              {/* Plain Reveal, not the line-by-line RevealText: that one splits
                  the element with SplitType, and this headline carries an <em>
                  inside it that a text splitter would take apart. */}
              <Reveal delay={0.05}>
                <h1 className="display-1 text-balance">
                  <Emphasise text="Buying in Dubai, *without the guesswork*." />
                </h1>
              </Reveal>
              <Reveal delay={0.1}>
                {/*
                 * Written about the reader, not about us.
                 *
                 * The old lead said DLX is built on the public record, checks
                 * its mandates and assigns one consultant. All true, all about
                 * the firm, and none of it tells a person landing here what
                 * they get. It also opened on "the public record" and "the
                 * Dubai Land Department", which is the vocabulary of the
                 * people who already know — the ones who need it least.
                 *
                 * So: who this is for, what they get, in the words they would
                 * use themselves. The register is still the whole point and it
                 * is still named, just called what it is. The harder figures
                 * are two clicks in, where somebody has asked for them.
                 */}
                <p className="lead mt-8 text-muted-foreground">
                  Whether you are investing, moving your family over, or buying your first place
                  here — we start by showing you what homes like it actually sold for, taken
                  straight from Dubai&rsquo;s government property register. Then one person stays
                  with you the whole way through.
                </p>
              </Reveal>
              <Reveal delay={0.15}>
                <div className="mt-9 flex flex-wrap items-center gap-4">
                  <Link
                    to="/contact"
                    className="focus-ring eyebrow inline-flex min-h-12 items-center bg-green px-7 text-on-dark transition-colors hover:bg-green-mid"
                  >
                    Speak to a consultant
                  </Link>
                  <Link
                    to="/market-intelligence"
                    className="focus-ring eyebrow inline-flex min-h-12 items-center gap-2 border-b border-green-mid pb-1 text-green-mid"
                  >
                    See what homes sold for
                    <span aria-hidden className="rtl:-scale-x-100">
                      →
                    </span>
                  </Link>
                </div>
              </Reveal>
            </div>

            <Reveal delay={0.2}>
              <NoorPanel availability={availability} />
            </Reveal>
          </div>

          {/* Facts about the firm, each one checkable. Full width, so they sit
              on one line where there is room for one line. */}
          <Reveal delay={0.25}>
            <ul className="mt-14 flex flex-col border-t border-border sm:flex-row sm:flex-wrap sm:gap-x-12">
              {[
                /*
                 * Every line here has to be checkable, and two of them were
                 * not. "Dubai · Abu Dhabi · Sharjah" is contradicted by our own
                 * brand config, which records one locality and six Dubai
                 * communities; "Five languages, day or night" claimed staffed
                 * round-the-clock cover in five languages, which nothing in
                 * this repo supports. A strip of trust facts is the worst
                 * possible place to keep an unverified claim.
                 */
                `RERA ORN ${site.reraOrn}`,
                "Licensed brokerage in Dubai",
                "Prices from the government register",
                "One consultant, start to finish",
              ].map((entry) => (
                <li
                  key={entry}
                  className="eyebrow flex items-center gap-2.5 border-b border-border py-3.5 text-foreground sm:border-b-0"
                >
                  <span aria-hidden className="inline-block size-1 shrink-0 bg-gold-ink" />
                  {entry}
                </li>
              ))}
            </ul>
          </Reveal>
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
              One person, start to finish. No hand-offs, no junior desk, no queue. We price from
              what has actually sold, and we tell you about the yearly service charge before you
              sign, not after — it is the cost that quietly eats the rent, and almost nobody puts
              it in front of you.
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
        <SectionOpener
          eyebrow="The record, at a glance"
          title="We don't guess. We check."
          lead="Every sale and every tenancy in Dubai is recorded by the government. Here are three figures from it. If you want the rest — what each community costs, what it earns, and where off-plan is priced above what you could walk through today — it is one click away."
        />
        <MarketGlance
          rows={quarterly}
          sourceExportDate={metadata.sourceExportDate}
          marketHref="/market-intelligence"
        />
      </Section>

      {/*
       * The beat.
       *
       * Sections III to VIII all opened the same way and all carried the same
       * weight, which is the whole reason this page read as a template. This
       * is the light passage between two heavy ones: one sentence, nothing
       * under it to explain itself, and a footnote that exists only so the
       * sentence can be checked.
       */}
      <StatementBand
        data-surface="cream"
        footnote="Every figure on this site carries the number of registered records behind it. Where a community or a quarter has too few to publish without describing individual transactions, we leave it out and say so."
      >
        We would rather lose the deal than guess the number.
      </StatementBand>

      {/* IV. The practices. */}
      <Section data-surface="light">
        <SectionOpener
          eyebrow="What we do"
          title="What we can actually help you with."
        />
        <Reveal>
          <ServicesList services={services} hrefFor={(slug) => `/services/${slug}`} />
        </Reveal>
      </Section>

      {/* V. The two mandates. */}
      <Section data-surface="cream">
        <SectionOpener
          eyebrow="In focus · off-plan"
          title="Two projects we represent, in Sharjah and Abu Dhabi."
        />
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
        <SectionOpener
          eyebrow="Independent representation"
          title="The people who will answer."
        />
        <Reveal>
          <TeamCards members={team} />
        </Reveal>
      </Section>

      {/*
       * The questions, answered where the schema can see them too.
       *
       * Two columns rather than one full-width run of prose. A question set at
       * 1536px is a wall: the eye has no left edge to return to and every
       * answer reads as an essay. Holding the question on one side and the
       * answer on a measure beside it is what makes it scannable, which is how
       * anyone actually reads a FAQ.
       */}
      <Section data-surface="cream">
        {/*
         * Opens on an eyebrow alone.
         *
         * "The questions we get first" is a headline that describes the
         * content instead of being it — the reader learns nothing from it that
         * the questions underneath do not tell them immediately. Every
         * question below is already a heading, so a heading above them is the
         * template announcing itself for the sixth time on one page.
         */}
        <Reveal>
          {/* The eyebrow *is* the heading, rather than sitting above one.
              Dropping the h2 entirely would have made the section quiet to the
              eye and invisible to anyone navigating by heading, which is a
              worse trade than the one it was fixing. */}
          <h2 className="eyebrow">Before you ask</h2>
        </Reveal>
        <dl className="mt-10 max-w-5xl border-t border-border">
          {HOME_FAQ.map((entry) => (
            <Reveal key={entry.question}>
              <div className="grid gap-3 border-b border-border py-7 md:grid-cols-12 md:gap-10">
                <dt className="display-3 md:col-span-5">{entry.question}</dt>
                <dd className="body-text text-muted-foreground md:col-span-7">{entry.answer}</dd>
              </div>
            </Reveal>
          ))}
        </dl>
      </Section>
    </>
  );
}
