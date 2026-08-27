import { createFileRoute, Link } from "@tanstack/react-router";

import { site } from "@/config/site";
import { listPartnerDevelopers } from "@/data/catalogue";
import { listAgents, listTestimonials } from "@/data/people";
import { faqSchema, reviewSchemaFor, type FaqEntry } from "@/lib/schema";
import { pageHead } from "@/lib/seo";
import { stagger } from "@/lib/motion";
import { DeveloperStrip } from "@/components/site/developer-strip";
import { Reveal } from "@/components/site/reveal";
import { TestimonialsBlock } from "@/components/site/testimonials-block";
import { TrustStrip } from "@/components/site/trust-strip";
import { PageHero } from "@/components/site/page-hero";
import { Section, Eyebrow } from "@/components/ui/section";

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
    answer: `Yes. ${site.name} trades under RERA Office Registration Number ${site.reraOrn} and works from ${site.address.street}, ${site.address.locality}. Every transaction we handle runs through the Dubai Land Department's official process.`,
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
    pageHead({
      path: "/about",
      breadcrumbs: [{ name: "About", path: "/about" }],
      schema: [faqSchema(FAQS), ...reviewSchemaFor(loaderData?.testimonials ?? [])],
    }),
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

      <Section className="pb-24">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-8 lg:col-start-3">
            <Reveal>
              <p className="lead">
                Dubai has no shortage of estate agents. What it has less of is representation, a
                firm whose interest in a transaction is the same as yours, and which will tell you
                to walk away when walking away is right.
              </p>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="lead mt-8">
                DLX was built for the client who has done this before, and for the one who has not
                and would rather not learn the hard way. We take a small number of clients across
                Dubai's prime districts, advise quietly, negotiate precisely, and hold a long view
                of value.
              </p>
            </Reveal>
          </div>
        </div>
      </Section>

      {/* How we work */}
      <Section className="bg-secondary">
        <div className="grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <Reveal>
              <Eyebrow>How we work</Eyebrow>
            </Reveal>
          </div>
          <div className="lg:col-span-8 lg:col-start-5">
            {PRINCIPLES.map((principle, index) => (
              <Reveal
                key={principle.title}
                delay={stagger(index)}
                className="border-t border-border/60 py-8 first:border-0 first:pt-0"
              >
                <div>
                  <h2 className="display-3">{principle.title}</h2>
                  <p className="body-text mt-4 max-w-measure text-muted-foreground">
                    {principle.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </Section>

      <TrustStrip />

      {agents.length > 0 ? (
        <Section>
          <Reveal>
            <Eyebrow>The team</Eyebrow>
            <h2 className="display-2 mt-6">
              {agents.length} consultant{agents.length === 1 ? "" : "s"}, each accountable for their
              own clients.
            </h2>
            <Link to="/team" className="eyebrow link-underline mt-10 inline-block text-accent">
              Meet the team
            </Link>
          </Reveal>
        </Section>
      ) : null}

      <DeveloperStrip developers={partners} />
      <TestimonialsBlock testimonials={testimonials} />

      <Section>
        <div className="grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <Reveal>
              <Eyebrow>Questions</Eyebrow>
              <h2 className="display-3 mt-6">Asked and answered</h2>
            </Reveal>
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
