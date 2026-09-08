import { createFileRoute } from "@tanstack/react-router";

import { site } from "@/config/site";
import { SERVICES } from "@/data/services";
import { SERVICE_GROUPS, SERVICE_PHOTOS } from "@/data/service-photos";
import { pageHead, withHeroPreload } from "@/lib/seo";
import { itemListSchema } from "@/lib/schema";
import { TrustStrip } from "@/components/site/trust-strip";
import { PageHero } from "@/components/site/page-hero";
import { SectionOpener } from "@/components/site/section-opener";
import { ServicesList, type ServiceRow } from "@/components/home/services-list";
import { Section } from "@/components/ui/section";

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

      {SERVICE_GROUPS.map((group, index) => (
        <Section
          key={group.id}
          id={group.id}
          {...(index % 2 === 1 ? { "data-surface": "cream" } : {})}
        >
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-4">
              <SectionOpener
                eyebrow={group.eyebrow}
                title={group.title}
                lead={group.lead}
                align="split"
              />
            </div>
            <div className="lg:col-span-7 lg:col-start-6">
              <ServicesList
                services={rowsFor(group.slugs)}
                hrefFor={(slug) => `/services/${slug}`}
              />
            </div>
          </div>
        </Section>
      ))}

      <TrustStrip />
    </>
  );
}
