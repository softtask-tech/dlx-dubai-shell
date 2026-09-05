import { createFileRoute, notFound, Link } from "@tanstack/react-router";

import { brand } from "@/config/brand";
import { landingPageBySlug } from "@/data/landing-pages";
import { faqSchema } from "@/lib/schema";
import { pageHead } from "@/lib/seo";
import { useTrackedView } from "@/lib/use-tracked-view";
import { stagger } from "@/lib/motion";
import { QualifiedForm } from "@/components/forms/qualified-form";
import { ContactLink } from "@/components/site/contact-link";
import { Reveal } from "@/components/site/reveal";
import { Section, Container, Eyebrow } from "@/components/ui/section";

/**
 * A campaign landing page.
 *
 * Deliberately not built from the site's usual layout: this route renders its
 * own shell, without the header's navigation, because every link out is a way
 * to lose someone who arrived ready to act. The only routes off the page are
 * the phone number, the one piece of deeper reading, and the form.
 *
 * `noIndex` on all of them. They restate content that exists properly elsewhere
 * on the site, written for one audience arriving from one ad, and a search
 * engine surfacing them instead of the real page serves nobody.
 */
export const Route = createFileRoute("/lp/$slug")({
  loader: ({ params }) => {
    const page = landingPageBySlug(params.slug);
    if (!page) throw notFound();
    return { page };
  },
  head: ({ loaderData }) => {
    const page = loaderData?.page;
    if (!page) return {};

    return pageHead({
      path: `/lp/${page.slug}`,
      title: page.title,
      description: page.description,
      tagline: page.standfirst,
      /* Campaign pages are paid destinations, never search results. */
      noIndex: true,
      schema: [faqSchema(page.faqs)],
    });
  },
  component: LandingPage,
});

function LandingPage() {
  const { page } = Route.useLoaderData();

  /* Reported as a listing view rather than a page view: it is the closest
   * standard event, and it puts campaign arrivals into the same retargeting
   * audience as people who looked at property. */
  useTrackedView("view_listing", { contentIds: [`lp-${page.slug}`], contentName: page.headline });

  return (
    <div className="min-h-screen bg-background">
      {/* A masthead, not a navigation. The monogram is a mark of who is
          asking, and it deliberately does not link away. */}
      <header className="border-b border-border">
        <Container className="flex items-center justify-between py-6">
          <span className="font-display text-2xl tracking-monogram">{brand.shortName}</span>
          <ContactLink
            kind="call"
            href={`tel:${brand.contact.phoneE164}`}
            detail={`lp-${page.slug}`}
            className="eyebrow text-muted-foreground transition-colors hover:text-accent"
          >
            {brand.contact.phone}
          </ContactLink>
        </Container>
      </header>

      <Section className="pt-24 pb-16 lg:pt-32">
        <div className="grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <Reveal>
              <Eyebrow>{page.offer}</Eyebrow>
              <h1 className="display-1 mt-8">{page.headline}</h1>
              <p className="lead mt-8 max-w-measure text-muted-foreground">{page.standfirst}</p>
            </Reveal>

            <Reveal delay={0.1}>
              <ul className="mt-12 border-t border-border">
                {page.bullets.map((bullet) => (
                  <li
                    key={bullet}
                    className="body-text flex gap-5 border-b border-border py-4 text-muted-foreground"
                  >
                    <span aria-hidden="true" className="text-accent">
                      ,
                    </span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>

          {/* The form sits in the first screen. On a campaign page the offer and
              the means of accepting it should never be separated by a scroll. */}
          <div className="lg:col-span-5 lg:col-start-8">
            <Reveal delay={0.15}>
              <div id="enquire" className="border border-border p-8 md:p-10">
                <QualifiedForm
                  sourceType="contact_form"
                  sourceDetail={`lp-${page.slug}`}
                  defaultIntent={page.intent}
                  title={page.formTitle}
                  description={page.formDescription}
                  submitLabel={page.ctaLabel}
                />
              </div>
            </Reveal>
          </div>
        </div>
      </Section>

      <Section className="bg-secondary py-16">
        <div className="grid gap-px bg-border md:grid-cols-3">
          {page.proof.map((item, index) => (
            <Reveal key={item.label} delay={stagger(index)} className="bg-secondary">
              <div className="p-8">
                <p className="display-2">{item.figure}</p>
                <p className="caption mt-4 text-muted-foreground">{item.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section>
        <div className="grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <Reveal>
              <Eyebrow>Straight answers</Eyebrow>
            </Reveal>
          </div>
          <div className="lg:col-span-8 lg:col-start-5">
            {page.faqs.map((faq) => (
              <Reveal key={faq.question} className="border-t border-border last:border-b">
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-baseline justify-between gap-8 py-7 [&::-webkit-details-marker]:hidden">
                    <h2 className="lead transition-colors group-open:text-accent">
                      {faq.question}
                    </h2>
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

      {/* One call to action, repeated, not a second, different one. */}
      <Section className="border-t border-border">
        <Reveal>
          <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
            <div>
              <h2 className="display-2">{page.offer}.</h2>
              <p className="body-text mt-4 text-muted-foreground">
                No obligation, and no mailing list you did not ask for.
              </p>
            </div>
            <a
              href="#enquire"
              className="eyebrow border border-foreground/20 px-8 py-4 transition-colors hover:border-foreground hover:bg-foreground hover:text-primary-foreground"
            >
              {page.ctaLabel}
            </a>
          </div>
        </Reveal>
      </Section>

      <footer className="border-t border-border">
        <Container className="flex flex-col gap-4 py-10 md:flex-row md:items-center md:justify-between">
          <p className="caption text-muted-foreground">
            {brand.name} · {brand.address.street}, {brand.address.locality}
          </p>
          <div className="flex gap-6">
            {page.readMore ? (
              <Link
                to={page.readMore.to}
                className="caption text-muted-foreground transition-colors hover:text-accent"
              >
                {page.readMore.label}
              </Link>
            ) : null}
            <Link
              to="/privacy"
              className="caption text-muted-foreground transition-colors hover:text-accent"
            >
              How we handle data
            </Link>
          </div>
        </Container>
      </footer>
    </div>
  );
}
