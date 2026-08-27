import { createFileRoute, Link } from "@tanstack/react-router";

import {
  activeGuideCategories,
  GUIDE_CATEGORY_LABELS,
  GUIDES,
  guidesByCategory,
} from "@/data/guides";
import { faqSchema } from "@/lib/schema";
import { pageHead } from "@/lib/seo";
import { stagger } from "@/lib/motion";
import { Reveal } from "@/components/site/reveal";
import { TrustStrip } from "@/components/site/trust-strip";
import { PageHero } from "@/components/site/page-hero";
import { Section, Eyebrow } from "@/components/ui/section";
import { Tag } from "@/components/ui/tag";

/**
 * The playbook index.
 *
 * Answer-shaped by construction: each card leads with the question the guide
 * answers and the first sentence of the answer, so the page is useful to a
 * reader skimming it and legible to an answer engine reading it. The FAQ schema
 * carries the same pairs, visible copy and structured data never diverge.
 */
export const Route = createFileRoute("/guides/")({
  head: () =>
    pageHead({
      path: "/guides",
      breadcrumbs: [{ name: "Guides", path: "/guides" }],
      schema: [faqSchema(GUIDES.map((guide) => ({ question: guide.title, answer: guide.answer })))],
    }),
  component: GuidesIndex,
});

function GuidesIndex() {
  const categories = activeGuideCategories();

  return (
    <>
      <PageHero
        photo="downtown-fog-day"
        title="The playbook."
        lead={
          <>
            {GUIDES.length} guides on buying, owning and moving to Dubai. Each one opens with a
            straight answer, then explains what it depends on, and says plainly where you need an
            authority rather than a website.
          </>
        }
      />

      {categories.map((category, categoryIndex) => {
        const guides = guidesByCategory(category);

        return (
          <Section key={category} className={categoryIndex === 0 ? "pt-0" : "pt-0"}>
            <Reveal>
              <Eyebrow>{GUIDE_CATEGORY_LABELS[category]}</Eyebrow>
            </Reveal>

            <div className="mt-8">
              <div className="hairline" />
              {guides.map((guide, index) => (
                <Reveal key={guide.slug} delay={stagger(index)}>
                  <Link
                    to="/guides/$slug"
                    params={{ slug: guide.slug }}
                    className="group grid gap-5 border-b border-border py-10 transition-colors hover:border-accent lg:grid-cols-12"
                  >
                    <div className="lg:col-span-5">
                      <h2 className="display-3 transition-colors group-hover:text-accent">
                        {guide.title}
                      </h2>
                      <p className="caption mt-4 text-muted-foreground">{guide.tagline}</p>
                    </div>

                    <p className="body-text text-muted-foreground lg:col-span-5 lg:col-start-7">
                      {guide.answer}
                    </p>

                    <div className="flex flex-wrap items-start gap-2 lg:col-span-1 lg:col-start-12 lg:justify-end">
                      <Tag variant="bare">{guide.readingMinutes} min</Tag>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </Section>
        );
      })}

      <Section className="bg-secondary pt-0">
        <div className="grid gap-12 py-section-sm lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Reveal>
              <Eyebrow>Run the numbers</Eyebrow>
              <h2 className="display-2 mt-6">Reading is step one.</h2>
            </Reveal>
          </div>
          <div className="lg:col-span-6 lg:col-start-7">
            <Reveal delay={0.1}>
              <p className="body-text text-muted-foreground">
                Every guide points at the calculator that turns it into a figure, buying costs,
                rental yield, rent versus buy, the Golden Visa property routes. All of them show
                their assumptions.
              </p>
              <Link to="/tools" className="link-underline eyebrow mt-8 inline-block">
                Open the tools
              </Link>
            </Reveal>
          </div>
        </div>
      </Section>

      <TrustStrip className="pt-0" />
    </>
  );
}
