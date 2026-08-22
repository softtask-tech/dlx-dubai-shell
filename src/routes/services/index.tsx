import { createFileRoute, Link } from "@tanstack/react-router";

import { SERVICES } from "@/data/services";
import { pageHead } from "@/lib/seo";
import { stagger } from "@/lib/motion";
import { Reveal } from "@/components/site/reveal";
import { TrustStrip } from "@/components/site/trust-strip";
import { Section, Eyebrow } from "@/components/ui/section";

export const Route = createFileRoute("/services/")({
  head: () =>
    pageHead({ path: "/services", breadcrumbs: [{ name: "Services", path: "/services" }] }),
  component: ServicesIndex,
});

function ServicesIndex() {
  return (
    <>
      <Section className="pt-44 pb-24 lg:pt-56">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Reveal>
              <Eyebrow>What we do</Eyebrow>
              <h1 className="display-1 mt-8">Services</h1>
            </Reveal>
          </div>
          <div className="lg:col-span-4 lg:col-start-9">
            <Reveal delay={0.12}>
              <p className="body-text text-muted-foreground">
                Nine ways we represent clients in Dubai. Each one is run by a named consultant who
                stays with you from the first call to the last signature.
              </p>
              <div className="mt-10 h-px w-16 bg-accent" />
            </Reveal>
          </div>
        </div>
      </Section>

      <Section className="pt-0">
        <div className="hairline" />
        {SERVICES.map((service, index) => (
          <Reveal key={service.slug} delay={stagger(index)}>
            <Link
              to="/services/$slug"
              params={{ slug: service.slug }}
              className="group grid items-baseline gap-4 border-b border-border py-10 transition-colors hover:border-accent md:grid-cols-12"
            >
              <span className="eyebrow md:col-span-1">{String(index + 1).padStart(2, "0")}</span>
              <span className="display-3 transition-transform duration-slow ease-editorial group-hover:translate-x-3 md:col-span-5">
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
