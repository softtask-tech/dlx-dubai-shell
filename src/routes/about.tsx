import { createFileRoute, Link } from "@tanstack/react-router";

import { site } from "@/config/site";
import { listPartnerDevelopers } from "@/data/catalogue";
import { listAgents, listTestimonials } from "@/data/people";
import { faqSchema, reviewSchemaFor, type FaqEntry } from "@/lib/schema";
import { pageHead, withHeroPreload } from "@/lib/seo";
import { stagger } from "@/lib/motion";
import { DeveloperStrip } from "@/components/site/developer-strip";
import { Reveal } from "@/components/site/reveal";
import { TestimonialsBlock } from "@/components/site/testimonials-block";
import { TrustStrip } from "@/components/site/trust-strip";
import { PageHero } from "@/components/site/page-hero";
import { Section } from "@/components/ui/section";
import { SectionOpener } from "@/components/site/section-opener";
import { ConsultantPortrait } from "@/components/site/consultant-portrait";

const PRINCIPLES = [
  {
    title: "One client at a time on a transaction",
    body: "We do not represent both sides. When we are acting for you, our only interest in the deal is yours.",
  },
  {
    title: "Evidence over sentiment",
    body: "We price from what has actually transacted in Dubai Land Department records, and we show you the comparables we reasoned from, including when they do not support the number you hoped for.",
  },
  {
    title: "A named consultant, throughout",
    body: "The person who takes your first call is the person who negotiates and the person who is there at handover. No handoffs to a transaction team you have never met.",
  },
  {
    title: "Discretion as standard",
    body: "A significant share of what we transact is never advertised. If you would rather your sale did not appear on a portal, it does not have to.",
  },
];

const FAQS: readonly FaqEntry[] = [
  {
    question: "Is DLX Properties a licensed Dubai brokerage?",
    answer: `Yes. ${site.name} is a Dubai real-estate brokerage based in ${site.address.street}, ${site.address.locality}. Applicable regulatory identifiers are presented in the relevant compliance context.`,
  },
  {
    question: "How big is the team?",
    answer:
      "Deliberately small. We take on a limited number of clients at a time because the alternative is the thing we set out not to be, volume brokerage where nobody is quite accountable for your transaction.",
  },
  {
    question: "What does DLX charge?",
    answer:
      "Our fee is agreed in writing before we start, and we will tell you what it is on the first call along with the other transaction costs you should budget for. Nothing appears at the end that you have not already seen.",
  },
];

export const Route = createFileRoute("/about")({
  loader: async () => {
    const [agents, testimonials, partners] = await Promise.all([
      listAgents(),
      listTestimonials(3),
      listPartnerDevelopers(),
    ]);
    return { agents, testimonials, partners };
  },
  head: ({ loaderData }) =>
    withHeroPreload(
      "burj-khalifa-dusk-silhouette",
      pageHead({
        path: "/about",
        breadcrumbs: [{ name: "About", path: "/about" }],
        schema: [faqSchema(FAQS), ...reviewSchemaFor(loaderData?.testimonials ?? [])],
      }),
    ),
  component: AboutPage,
});

function AboutPage() {
  const { agents, testimonials, partners } = Route.useLoaderData();

  return (
    <>
      <PageHero
        photo="burj-khalifa-dusk-silhouette"
        title="About DLX."
        lead="A private Dubai brokerage built on restraint, discretion and relationships measured in decades."
      />

      {/* The thesis, given the weight of a thesis. It was two paragraphs of
          lead text in a centre column, which is how you set an introduction
          and not how you set an argument. */}
      <Section>
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <Reveal>
              <p className="display-2 text-balance">
                Dubai has no shortage of estate agents. What it has less of is representation.
              </p>
            </Reveal>
          </div>
          <div className="lg:col-span-4 lg:col-start-9">
            <Reveal delay={0.1}>
              <p className="body-text text-muted-foreground">
                A firm whose interest in a transaction is the same as yours, and which will tell
                you to walk away when walking away is right.
              </p>
              <p className="body-text mt-5 text-muted-foreground">
                DLX was built for the client who has done this before, and for the one who has not
                and would rather not learn the hard way. We work across Dubai&rsquo;s prime
                districts, advise quietly, negotiate precisely, and hold a long view of value.
              </p>
            </Reveal>
          </div>
        </div>
      </Section>

      {/* How we work */}
      <Section data-surface="cream">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <SectionOpener
              eyebrow="How we work"
              title="Four commitments, and what each one costs us."
              align="split"
            />
          </div>
          <div className="lg:col-span-7 lg:col-start-6">
            {PRINCIPLES.map((principle, index) => (
              <Reveal
                key={principle.title}
                delay={stagger(index)}
                className="border-t border-border py-8 first:border-0 first:pt-0"
              >
                <div className="flex gap-6">
                  <span aria-hidden className="eyebrow mt-1.5 shrink-0 text-gold-ink">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h2 className="display-3">{principle.title}</h2>
                    <p className="body-text mt-4 max-w-measure text-muted-foreground">
                      {principle.body}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </Section>

      <TrustStrip />

      {agents.length > 0 ? (
        <Section>
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5">
              <SectionOpener
                eyebrow="The team"
                title={`${agents.length} consultants, each accountable for their own clients.`}
                align="split"
              >
                <Link
                  to="/team"
                  className="focus-ring eyebrow mt-8 inline-flex min-h-12 items-center bg-green px-7 text-on-dark transition-colors hover:bg-green-mid"
                >
                  Meet the team
                </Link>
              </SectionOpener>
            </div>
            {/* Faces rather than a number. The count was the least interesting
                true thing available about a four-person firm. */}
            <ul className="grid grid-cols-2 gap-5 sm:grid-cols-4 lg:col-span-6 lg:col-start-7">
              {agents.slice(0, 4).map((agent) => (
                <li key={agent.id}>
                  <Link
                    to="/team/$slug"
                    params={{ slug: agent.slug }}
                    className="focus-ring group block"
                  >
                    <div className="overflow-hidden">
                      <ConsultantPortrait
                        agent={agent}
                        className="transition-transform duration-cinematic ease-editorial group-hover:scale-[1.04] motion-reduce:transition-none"
                      />
                    </div>
                    <p className="caption mt-3 transition-colors group-hover:text-gold-ink">
                      {agent.full_name}
                    </p>
                    {agent.job_title ? (
                      <p className="caption text-muted-foreground">{agent.job_title}</p>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </Section>
      ) : null}

      <DeveloperStrip developers={partners} />
      <TestimonialsBlock testimonials={testimonials} />

      <Section>
        <div className="grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <SectionOpener eyebrow="Questions" title="Asked and answered." align="split" />
          </div>
          <div className="lg:col-span-8 lg:col-start-5">
            {FAQS.map((faq) => (
              <Reveal key={faq.question} className="border-t border-border last:border-b">
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-baseline justify-between gap-8 py-7 [&::-webkit-details-marker]:hidden">
                    <h3 className="lead transition-colors group-open:text-accent">
                      {faq.question}
                    </h3>
                    <span
                      aria-hidden="true"
                      className="eyebrow shrink-0 transition-transform duration-base ease-editorial group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <p className="body-text max-w-measure pb-8 text-muted-foreground">{faq.answer}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </Section>
    </>
  );
}
