import { createFileRoute, notFound, Link } from "@tanstack/react-router";

import { serviceBySlug, SERVICES, serviceOgPath } from "@/data/services";
import { faqSchema } from "@/lib/schema";
import { pageHead } from "@/lib/seo";
import { stagger } from "@/lib/motion";
import { QualifiedForm } from "@/components/forms/qualified-form";
import { Reveal } from "@/components/site/reveal";
import { TrustStrip } from "@/components/site/trust-strip";
import { Section, Eyebrow } from "@/components/ui/section";
import { SectionOpener } from "@/components/site/section-opener";
import { PageHero } from "@/components/site/page-hero";
import { SERVICE_PHOTOS } from "@/data/service-photos";

export const Route = createFileRoute("/services/$slug")({
  loader: ({ params }) => {
    const service = serviceBySlug(params.slug);
    if (!service) throw notFound();
    return { service };
  },
  head: ({ loaderData }) => {
    const service = loaderData?.service;
    if (!service) return {};

    return pageHead({
      /* Not in SITE_PAGES individually, so this page carries its own copy. */
      path: `/services/${service.slug}`,
      title: service.title,
      description: service.description,
      tagline: service.tagline,
      /* One card for the whole section, a per-service card would need art. */
      image: serviceOgPath(service.slug),
      breadcrumbs: [
        { name: "Services", path: "/services" },
        { name: service.name, path: `/services/${service.slug}` },
      ],
      schema: [faqSchema(service.faqs)],
    });
  },
  component: ServicePage,
});

function ServicePage() {
  const { service } = Route.useLoaderData();
  const others = SERVICES.filter((entry) => entry.slug !== service.slug).slice(0, 4);

  return (
    <>
      {/* A photograph, like every other page. This opened on 176px of empty
          space and then a headline, which on a photography-led site reads as
          a page that has not been finished. */}
      <PageHero
        photo={SERVICE_PHOTOS[service.slug] ?? "business-bay-dusk"}
        eyebrow="Services"
        title={service.title}
        lead={service.tagline}
      />

      {/* The practice, with who it is for held beside it rather than stranded
          in the corner of the opening. */}
      <Section>
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            {service.body.map((paragraph, index) => (
              <Reveal key={paragraph.slice(0, 24)} delay={stagger(index)}>
                <p className="lead mt-0 mb-7 last:mb-0">{paragraph}</p>
              </Reveal>
            ))}
          </div>
          <aside className="lg:col-span-4 lg:col-start-9">
            <Reveal delay={0.12}>
              <div className="border-t border-border pt-6 lg:sticky lg:top-32">
                <Eyebrow className="text-gold-ink">Who it is for</Eyebrow>
                <p className="body-text mt-4 text-muted-foreground">{service.audience}</p>
              </div>
            </Reveal>
          </aside>
        </div>
      </Section>

      {/* What you actually get */}
      <Section data-surface="cream">
        <div className="grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <SectionOpener
              eyebrow="What you get"
              title="What this actually includes."
              align="split"
            />
          </div>
          <div className="lg:col-span-7 lg:col-start-6">
            {/*
             * A list of what you get, not a sequence of steps.
             *
             * This was an <ol> with 01 / 02 / 03 down the side, which made two
             * claims that are not true: that these arrive in this order, and
             * that a screen reader should announce "item 3 of 7" as a
             * position. Neither is information. The rule marks a new entry
             * without asserting where it sits.
             */}
            <ul>
              {service.deliverables.map((item, index) => (
                <Reveal
                  key={item}
                  delay={stagger(index)}
                  className="border-b border-border/60 py-6 last:border-0"
                >
                  <li className="flex items-baseline gap-8">
                    <span aria-hidden className="mt-3 h-px w-6 shrink-0 bg-gold-ink sm:w-10" />
                    <span className="body-text">{item}</span>
                  </li>
                </Reveal>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* Enquiry, the point of the page */}
      <Section id="enquire">
        <div className="grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Reveal>
              <h2 className="display-2">Talk to a consultant.</h2>
              <p className="body-text mt-8 max-w-measure text-muted-foreground">
                No obligation and no sales sequence. One person reads this, and one person replies.
              </p>
            </Reveal>
          </div>
          <div className="lg:col-span-7 lg:col-start-6">
            <Reveal delay={0.1}>
              <QualifiedForm
                sourceType="contact_form"
                sourceDetail={`service-${service.slug}`}
                defaultIntent={service.intent}
                title={service.formTitle}
              />
            </Reveal>
          </div>
        </div>
      </Section>

      {/* Answer-shaped content, matching the FAQ schema exactly */}
      <Section data-surface="cream">
        <div className="grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <Reveal>
              <Eyebrow>Questions</Eyebrow>
              <h2 className="display-3 mt-6">Asked and answered</h2>
            </Reveal>
          </div>
          <div className="lg:col-span-8 lg:col-start-5">
            {service.faqs.map((faq, index) => (
              <Reveal
                key={faq.question}
                delay={stagger(index)}
                className="border-t border-border last:border-b"
              >
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

      {/* Sideways navigation into the rest of the practice */}
      <Section>
        <Reveal>
          <Eyebrow>Also from DLX</Eyebrow>
        </Reveal>
        <div className="mt-10 grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
          {others.map((other, index) => (
            <Reveal key={other.slug} delay={stagger(index)}>
              <Link
                to="/services/$slug"
                params={{ slug: other.slug }}
                className="group flex h-full flex-col justify-between gap-10 bg-background p-8 transition-colors hover:bg-secondary"
              >
                <span className="display-3">{other.name}</span>
                <span className="caption">{other.tagline}</span>
              </Link>
            </Reveal>
          ))}
        </div>
      </Section>

      <TrustStrip />
    </>
  );
}
