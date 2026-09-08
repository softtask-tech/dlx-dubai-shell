import { createFileRoute } from "@tanstack/react-router";

import { site } from "@/config/site";
import { SERVICES } from "@/data/services";
import { SERVICE_GROUPS, SERVICE_PHOTOS } from "@/data/service-photos";
import { pageHead, withHeroPreload } from "@/lib/seo";
import { itemListSchema } from "@/lib/schema";
import { TrustStrip } from "@/components/site/trust-strip";
import { PageHero } from "@/components/site/page-hero";
import { ServicesList, type ServiceRow } from "@/components/home/services-list";
import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/site/reveal";

export const Route = createFileRoute("/services/")({
  head: () =>
    withHeroPreload(
      "business-bay-dusk",
      pageHead({
        path: "/services",
        breadcrumbs: [{ name: "Services", path: "/services" }],
        /* An answer engine asked what this firm does should not have to infer
         * it from prose when the page knows the list exactly. */
        schema: [
          itemListSchema({
            name: `${site.name} services`,
            items: SERVICES.map((service) => ({
              name: service.name,
              path: `/services/${service.slug}`,
              description: service.tagline,
            })),
          }),
        ],
      }),
    ),
  component: ServicesIndex,
});

/**
 * The nine practices, in three groups.
 *
 * This was nine identical rows: name, tagline, the word "View". Nine of
 * anything set the same way is a list, and a list makes the reader do the
 * sorting. It also had no photography at all, on a site that is otherwise led
 * by it, so the page read as an index rather than as a set of things a firm
 * does.
 *
 * The nine are really three different relationships: moving a property,
 * holding one, and arriving in the country. Someone who has just taken a job
 * in Dubai and someone restructuring a portfolio are not scanning the same
 * three items, and the grouping puts each of them in front of their own set
 * without making them read the other six.
 *
 * The rows themselves are the same component the homepage uses, which is the
 * flex layout that fixed the orphaned-whitespace problem. One implementation,
 * so the two pages cannot drift.
 */
function ServicesIndex() {
  const rowsFor = (slugs: readonly string[]): ServiceRow[] =>
    slugs.flatMap((slug) => {
      const service = SERVICES.find((entry) => entry.slug === slug);
      const photo = SERVICE_PHOTOS[slug];
      if (!service || !photo) return [];
      return [{ slug, name: service.name, line: service.tagline, photo }];
    });

  return (
    <>
      <PageHero
        photo="business-bay-dusk"
        eyebrow="What we do"
        title="Nine ways we represent you."
        lead="Each one is run by a named consultant who stays with you from the first call to the last signature."
      />

      {/*
       * One register, three groups. Not three sections.
       *
       * Measured on the live page, the three groups rendered as three
       * sections of 669, 669 and 695 pixels, each with the same split
       * composition and each with its own eyebrow. Three near-identical
       * blocks in a row is the template feeling in its purest form, and
       * alternating the background behind them does not change that: it is
       * the same shape three times, painted twice.
       *
       * The grouping itself is real and worth keeping. Someone who has just
       * taken a job in Dubai and someone restructuring a portfolio are not
       * scanning the same three practices. So the groups stay and the shells
       * go: the page is now one continuous index with each group announced by
       * a heading in the margin, the way a monograph runs its contents. Nine
       * practices read as nine, in three passes, rather than as three pages
       * stapled together.
       *
       * The group heading sticks on a tall screen, so a reader deep in the
       * third group can still see which group they are in.
       */}
      <Section>
        <div className="border-t border-border">
          {SERVICE_GROUPS.map((group, index) => (
            <div
              key={group.id}
              id={group.id}
              className="grid scroll-mt-32 gap-x-16 gap-y-8 border-b border-border py-16 last:border-b-0 lg:grid-cols-12 lg:py-20"
            >
              <div className="lg:col-span-4">
                <div className="lg:sticky lg:top-32">
                  <Reveal>
                    <span aria-hidden className="block h-px w-10 bg-gold-ink" />
                    <h2 className="display-2 mt-6 text-balance">{group.title}</h2>
                    <p className="body-text mt-5 max-w-measure text-muted-foreground">
                      {group.lead}
                    </p>
                  </Reveal>
                </div>
              </div>

              <div className="lg:col-span-7 lg:col-start-6">
                <ServicesList
                  services={rowsFor(group.slugs)}
                  hrefFor={(slug) => `/services/${slug}`}
                />
              </div>
            </div>
          ))}
        </div>
      </Section>

      <TrustStrip />
    </>
  );
}
