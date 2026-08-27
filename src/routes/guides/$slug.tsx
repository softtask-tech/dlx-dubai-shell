import { createFileRoute, notFound, Link } from "@tanstack/react-router";

import {
  GUIDE_CATEGORY_LABELS,
  guideBySlug,
  guideOgPath,
  relatedGuides,
  sectionAnchor,
  type Guide,
} from "@/data/guides";
import { serviceBySlug } from "@/data/services";
import { toolBySlug } from "@/data/tools";
import type { LeadIntent } from "@/data/types";
import { formatMonth } from "@/lib/format";
import { articleSchema, faqSchema } from "@/lib/schema";
import { pageHead } from "@/lib/seo";
import { stagger } from "@/lib/motion";
import { QualifiedForm } from "@/components/forms/qualified-form";
import { VerificationNote } from "@/components/guides/verification-note";
import { Faq } from "@/components/site/faq";
import { ExplainLink } from "@/components/advisor/explain-link";
import { Reveal } from "@/components/site/reveal";
import { Section, Eyebrow } from "@/components/ui/section";
import { Tag } from "@/components/ui/tag";

/**
 * A playbook guide, as an editorial article.
 *
 * The shape follows the golden rule. A reader who wants the answer gets it in
 * the first screen, one paragraph, plain language, no chart, no jargon. A
 * reader who wants the reasoning scrolls into the sections. A reader who is
 * serious finds the calculator, the service and the consultant at the end.
 *
 * Article and FAQ JSON-LD carry the same words that are on the page: the answer
 * block is the article's description, and the FAQ entries are the visible
 * accordion. Nothing is asserted to a crawler that a reader cannot see.
 */
export const Route = createFileRoute("/guides/$slug")({
  loader: ({ params }) => {
    const guide = guideBySlug(params.slug);
    if (!guide) throw notFound();
    return { guide, related: relatedGuides(guide.slug) };
  },
  head: ({ loaderData }) => {
    const guide = loaderData?.guide;
    if (!guide) return {};

    const path = `/guides/${guide.slug}`;
    const image = guideOgPath(guide.slug);

    return pageHead({
      path,
      title: guide.title,
      description: guide.description,
      tagline: guide.tagline,
      image,
      type: "article",
      breadcrumbs: [
        { name: "Guides", path: "/guides" },
        { name: guide.title, path },
      ],
      schema: [
        articleSchema({
          headline: guide.title,
          /* The answer block, verbatim, what an answer engine should quote. */
          description: guide.answer,
          path,
          image,
          datePublished: guide.reviewedOn,
          dateModified: guide.reviewedOn,
        }),
        faqSchema(guide.faqs),
      ],
    });
  },
  component: GuidePage,
});

/** The enquiry intent a guide's readers most likely have. */
const CATEGORY_INTENT: Record<Guide["category"], LeadIntent> = {
  buying: "buy",
  selling: "sell",
  investment: "invest",
  golden_visa: "relocate",
  relocation: "relocate",
  legal_and_tax: "advice",
  area_guide: "buy",
};

function GuidePage() {
  const { guide, related } = Route.useLoaderData();

  const tools = (guide.relatedTools ?? [])
    .map((slug) => toolBySlug(slug))
    .filter((tool): tool is NonNullable<typeof tool> => Boolean(tool));
  const services = (guide.relatedServices ?? [])
    .map((slug) => serviceBySlug(slug))
    .filter((service): service is NonNullable<typeof service> => Boolean(service));

  return (
    <article>
      <Section className="pt-44 pb-16 lg:pt-56">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <Reveal>
              <Eyebrow>{GUIDE_CATEGORY_LABELS[guide.category]}</Eyebrow>
              <h1 className="display-1 mt-8">{guide.title}</h1>
              <p className="lead mt-8 max-w-measure text-muted-foreground">{guide.tagline}</p>
            </Reveal>
          </div>

          <div className="lg:col-span-3 lg:col-start-10">
            <Reveal delay={0.12}>
              <dl className="border-t border-border pt-6">
                <div className="flex justify-between gap-4 py-2">
                  <dt className="caption text-muted-foreground">Reading time</dt>
                  <dd className="caption">{guide.readingMinutes} min</dd>
                </div>
                <div className="flex justify-between gap-4 py-2">
                  <dt className="caption text-muted-foreground">Reviewed</dt>
                  <dd className="caption">
                    <time dateTime={guide.reviewedOn}>{formatMonth(guide.reviewedOn)}</time>
                  </dd>
                </div>
              </dl>
              {guide.verifyWithAuthorities ? (
                <Tag variant="soft" className="mt-6">
                  Verify with authorities
                </Tag>
              ) : null}
            </Reveal>
          </div>
        </div>
      </Section>

      {/* Layer one of the golden rule: the answer, before any reasoning. */}
      <Section className="pt-0 pb-16">
        <Reveal>
          <div className="border-t-2 border-accent pt-10 lg:grid lg:grid-cols-12 lg:gap-12">
            <p className="eyebrow lg:col-span-3">The short answer</p>
            <div className="mt-6 lg:col-span-8 lg:col-start-5 lg:mt-0">
              <p className="lead max-w-measure text-foreground">{guide.answer}</p>
              <ExplainLink className="mt-6" question={`In plain English: ${guide.title}`} />
            </div>
          </div>
        </Reveal>
      </Section>

      <Section className="pt-0">
        <div className="grid gap-14 lg:grid-cols-12">
          {/* Contents rail, sticky on desktop, a plain list on mobile. */}
          <nav aria-label="On this page" className="lg:col-span-3">
            <div className="lg:sticky lg:top-32">
              <Reveal>
                <Eyebrow>On this page</Eyebrow>
                <ol className="mt-6 border-t border-border">
                  {guide.sections.map((section, index) => (
                    <li key={section.heading} className="border-b border-border">
                      <a
                        href={`#${sectionAnchor(section.heading)}`}
                        className="caption flex gap-4 py-3 text-muted-foreground transition-colors hover:text-accent"
                      >
                        <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                        <span>{section.heading}</span>
                      </a>
                    </li>
                  ))}
                  <li className="border-b border-border">
                    <a
                      href="#questions"
                      className="caption flex gap-4 py-3 text-muted-foreground transition-colors hover:text-accent"
                    >
                      <span aria-hidden="true">
                        {String(guide.sections.length + 1).padStart(2, "0")}
                      </span>
                      <span>Asked and answered</span>
                    </a>
                  </li>
                </ol>
              </Reveal>
            </div>
          </nav>

          <div className="lg:col-span-8 lg:col-start-5">
            {guide.sections.map((section, index) => (
              <Reveal
                key={section.heading}
                delay={stagger(index)}
                className="border-t border-border pt-10 pb-12 first:border-t-0 first:pt-0"
              >
                <section id={sectionAnchor(section.heading)} className="scroll-mt-32">
                  <h2 className="display-3">{section.heading}</h2>
                  {section.body.map((paragraph) => (
                    <p
                      key={paragraph}
                      className="body-text mt-6 max-w-measure text-muted-foreground"
                    >
                      {paragraph}
                    </p>
                  ))}
                  {section.points?.length ? (
                    <ul className="mt-8 max-w-measure border-t border-border">
                      {section.points.map((point) => (
                        <li
                          key={point}
                          className="body-text flex gap-5 border-b border-border py-4 text-muted-foreground"
                        >
                          <span aria-hidden="true" className="text-accent">
                            ,
                          </span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </section>
              </Reveal>
            ))}

            {guide.verifyWithAuthorities ? (
              <Reveal>
                <VerificationNote reviewedOn={guide.reviewedOn} className="max-w-measure" />
              </Reveal>
            ) : null}
          </div>
        </div>
      </Section>

      {tools.length > 0 || services.length > 0 ? (
        <Section className="pt-0">
          <div className="grid gap-14 lg:grid-cols-12">
            <div className="lg:col-span-3">
              <Reveal>
                <Eyebrow>Take it further</Eyebrow>
              </Reveal>
            </div>
            <div className="lg:col-span-8 lg:col-start-5">
              <div className="hairline" />
              {tools.map((tool, index) => (
                <Reveal key={tool.slug} delay={stagger(index)}>
                  <Link
                    to="/tools/$slug"
                    params={{ slug: tool.slug }}
                    className="group flex items-baseline justify-between gap-8 border-b border-border py-6 transition-colors hover:border-accent"
                  >
                    <span>
                      <span className="lead transition-colors group-hover:text-accent">
                        {tool.name}
                      </span>
                      <span className="caption mt-2 block text-muted-foreground">
                        {tool.question}
                      </span>
                    </span>
                    <span className="eyebrow shrink-0">Calculator</span>
                  </Link>
                </Reveal>
              ))}
              {services.map((service, index) => (
                <Reveal key={service.slug} delay={stagger(tools.length + index)}>
                  <Link
                    to="/services/$slug"
                    params={{ slug: service.slug }}
                    className="group flex items-baseline justify-between gap-8 border-b border-border py-6 transition-colors hover:border-accent"
                  >
                    <span>
                      <span className="lead transition-colors group-hover:text-accent">
                        {service.name}
                      </span>
                      <span className="caption mt-2 block text-muted-foreground">
                        {service.tagline}
                      </span>
                    </span>
                    <span className="eyebrow shrink-0">Service</span>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </Section>
      ) : null}

      <Section id="questions" className="scroll-mt-32 bg-secondary">
        <Faq entries={guide.faqs} />
      </Section>

      <Section>
        <div className="grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Reveal>
              <h2 className="display-2">Ask the specific version of this question.</h2>
              <p className="body-text mt-8 max-w-measure text-muted-foreground">
                A guide describes how something works in general. Your answer depends on the
                property, the building and your circumstances, which is a conversation, not an
                article.
              </p>
            </Reveal>
          </div>
          <div className="lg:col-span-7 lg:col-start-6">
            <Reveal delay={0.1}>
              <QualifiedForm
                sourceType="guide_download"
                sourceDetail={`guide-${guide.slug}`}
                defaultIntent={CATEGORY_INTENT[guide.category]}
                title="Talk it through"
                description="Tell us what you are trying to work out. A consultant replies personally, usually the same day."
              />
            </Reveal>
          </div>
        </div>
      </Section>

      <Section className="bg-secondary">
        <Reveal>
          <Eyebrow>Read next</Eyebrow>
        </Reveal>
        <div className="mt-10 grid gap-px bg-border md:grid-cols-3">
          {related.map((other, index) => (
            <Reveal key={other.slug} delay={stagger(index)} className="bg-secondary">
              <Link
                to="/guides/$slug"
                params={{ slug: other.slug }}
                className="group flex h-full flex-col justify-between gap-10 p-8 transition-colors hover:bg-background"
              >
                <div>
                  <span className="eyebrow text-muted-foreground">
                    {GUIDE_CATEGORY_LABELS[other.category]}
                  </span>
                  <h3 className="display-3 mt-4 transition-colors group-hover:text-accent">
                    {other.title}
                  </h3>
                </div>
                <span className="caption text-muted-foreground">{other.tagline}</span>
              </Link>
            </Reveal>
          ))}
        </div>
      </Section>
    </article>
  );
}
