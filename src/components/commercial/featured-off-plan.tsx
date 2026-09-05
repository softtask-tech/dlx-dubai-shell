import { Link } from "@tanstack/react-router";

import type { CommercialProject } from "@/data/off-plan";
import { CommercialProjectCard } from "./project-card";
import { Button } from "@/components/ui/button";
import { Container, Eyebrow, Section } from "@/components/ui/section";

export function FeaturedOffPlan({ projects }: { projects: readonly CommercialProject[] }) {
  if (projects.length === 0) return <OffPlanComingSoon compact />;
  const [lead, ...supporting] = projects;
  if (!lead) return null;
  return (
    <Section className="bg-paper-cool" aria-labelledby="featured-off-plan-title">
      <div className="mb-10 flex flex-col justify-between gap-7 border-b border-border pb-8 md:flex-row md:items-end">
        <div>
          <Eyebrow>Design preview · fictional projects</Eyebrow>
          <h2 id="featured-off-plan-title" className="display-2 mt-5 max-w-3xl text-balance">
            Three ways an off-plan decision should be presented.
          </h2>
        </div>
        <Link to="/off-plan" className="eyebrow link-underline shrink-0 text-accent">
          View all off-plan
        </Link>
      </div>
      <p className="caption mb-5 md:hidden">Swipe to explore the three concept pages.</p>
      <div className="-mx-6 flex snap-x snap-mandatory gap-5 overflow-x-auto px-6 pb-4 md:hidden">
        {projects.map((project) => (
          <div key={project.slug} className="w-[86vw] shrink-0 snap-start">
            <CommercialProjectCard project={project} />
          </div>
        ))}
      </div>
      <div className="hidden gap-10 md:grid lg:grid-cols-12">
        <div className="lg:col-span-7">
          <CommercialProjectCard project={lead} dominant />
        </div>
        <div className="grid gap-10 sm:grid-cols-2 lg:col-span-5 lg:grid-cols-1">
          {supporting.map((project) => (
            <CommercialProjectCard key={project.slug} project={project} />
          ))}
        </div>
      </div>
    </Section>
  );
}

export function OffPlanComingSoon({ compact = false }: { compact?: boolean }) {
  return (
    <Section className="bg-paper-cool">
      <Container className="px-0">
        <div
          className={`grid gap-10 border-y border-border py-12 ${compact ? "lg:grid-cols-12" : "lg:grid-cols-2"}`}
        >
          <div className={compact ? "lg:col-span-7" : ""}>
            <Eyebrow>Private inventory</Eyebrow>
            <h2 className="display-2 mt-5 max-w-3xl text-balance">
              Some opportunities are shared privately.
            </h2>
            <p className="body-text mt-6 max-w-measure text-muted-foreground">
              Tell us what you are looking for and we will show you what fits. We do not claim
              public availability until an owner or developer has supplied it.
            </p>
          </div>
          <div className={`flex items-end ${compact ? "lg:col-span-4 lg:col-start-9" : ""}`}>
            <Link to="/off-plan" className="inline-flex">
              <Button>Describe your requirement</Button>
            </Link>
          </div>
        </div>
      </Container>
    </Section>
  );
}
