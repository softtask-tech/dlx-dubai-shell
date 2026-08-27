import { createFileRoute, Link } from "@tanstack/react-router";

import { SERVICES } from "@/data/services";
import { pageHead } from "@/lib/seo";
import { stagger } from "@/lib/motion";
import { Reveal } from "@/components/site/reveal";
import { TrustStrip } from "@/components/site/trust-strip";
import { PageHero } from "@/components/site/page-hero";
import { Section, Eyebrow } from "@/components/ui/section";

export const Route = createFileRoute("/services/")({
  head: () =>
    pageHead({ path: "/services", breadcrumbs: [{ name: "Services", path: "/services" }] }),
  component: ServicesIndex,
});

function ServicesIndex() {
  return (
    <>
      <PageHero
        photo="business-bay-dusk"
        title="Nine ways we represent you."
        lead="Each one is run by a named consultant who stays with you from the first call to the last signature."
      />

      <Section>
        <div className="hairline" />
        {SERVICES.map((service, index) => (
          <Reveal key={service.slug} delay={stagger(index)}>
            <Link
              to="/services/$slug"
              params={{ slug: service.slug }}
              className="group grid items-baseline gap-4 border-b border-border py-10 transition-colors hover:border-accent md:grid-cols-12"
            >
              {/* No `01 / 02 / 03` column. The reader can count, and a number
                  beside every row is the shape of a table of contents. */}
              <span className="display-3 transition-transform duration-slow ease-editorial group-hover:translate-x-3 md:col-span-6">
                {service.name}
              </span>
              <span className="body-text text-muted-foreground md:col-span-5">
                {service.tagline}
              </span>
              <span className="eyebrow transition-colors group-hover:text-accent md:col-span-1 md:text-right">
                View
              </span>
            </Link>
          </Reveal>
        ))}
      </Section>

      <TrustStrip />
    </>
  );
}
