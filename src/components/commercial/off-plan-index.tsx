import { Link } from "@tanstack/react-router";

import type { CommercialProject } from "@/data/off-plan";
import { CommercialProjectCard } from "./project-card";
import { PrivateInventoryForm } from "./private-inventory-form";
import { Container, Eyebrow, Section } from "@/components/ui/section";

export function OffPlanIndex({ projects }: { projects: readonly CommercialProject[] }) {
  const preview = projects.length > 0;
  return (
    <>
      <section className="border-b border-border bg-paper-cool py-16 md:py-24">
        <Container>
          {preview ? (
            <div className="mb-10 border border-accent bg-accent-soft p-5" role="note">
              <p className="eyebrow text-accent">Design preview · fictional content</p>
              <p className="caption mt-2">
                Every project below is a concept prototype, not a listing, launch or offer.
              </p>
            </div>
          ) : null}
          <div className="grid items-end gap-10 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <Eyebrow>Off-plan, considered properly</Eyebrow>
              <h1 className="display-1 mt-6 text-balance">
                A project page should help you test the decision, not repeat the brochure.
              </h1>
            </div>
            <p className="body-text max-w-measure text-muted-foreground lg:col-span-3 lg:col-start-10">
              Price, payment timing, supply, service costs, delivery and recorded evidence—kept
              separate from sales narrative.
            </p>
          </div>
        </Container>
      </section>

      {preview ? (
        <Section aria-label="Fictional off-plan project prototypes">
          <div className="grid gap-x-8 gap-y-14 lg:grid-cols-12">
            {projects.map((project, index) => (
              <div key={project.slug} className={index === 0 ? "lg:col-span-7" : "lg:col-span-5"}>
                <CommercialProjectCard project={project} dominant={index === 0} />
              </div>
            ))}
          </div>
        </Section>
      ) : (
        <Section>
          <div className="grid gap-14 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <Eyebrow>Private inventory</Eyebrow>
              <h2 className="display-2 mt-5">Some opportunities are shared privately.</h2>
              <p className="lead mt-6 text-muted-foreground">
                Tell us what you are looking for and we will show you what fits.
              </p>
              <p className="body-text mt-5 max-w-measure text-muted-foreground">
                This page does not claim that a property or allocation exists. A consultant will
                check the market against your brief before suggesting anything.
              </p>
              <div className="mt-8 flex flex-wrap gap-5">
                <a href="#requirement" className="eyebrow link-underline text-accent">
                  Share a requirement
                </a>
                <a href="#ask" className="eyebrow link-underline text-foreground">
                  Ask the AI advisor
                </a>
              </div>
            </div>
            <div className="border-l border-border pl-7 lg:col-span-5 lg:col-start-8">
              <Eyebrow>What we will verify</Eyebrow>
              <ul className="mt-6 space-y-4 body-text text-muted-foreground">
                <li>Developer and project identity</li>
                <li>Current release and availability</li>
                <li>Payment and handover terms</li>
                <li>Relevant DLD records where available</li>
                <li>Comparable market evidence and holding costs</li>
              </ul>
            </div>
          </div>
        </Section>
      )}

      <Section className="bg-secondary" id="requirement">
        <div className="grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-7 lg:col-start-3">
            {preview ? (
              <div className="border border-border p-8">
                <Eyebrow>Preview boundary</Eyebrow>
                <h2 className="display-3 mt-5">Demo projects cannot create enquiries.</h2>
                <p className="body-text mt-5 text-muted-foreground">
                  Open a concept project to test its interactive no-write form. The production
                  requirement form is deliberately not mounted while demo content is visible.
                </p>
                <Link
                  to="/off-plan/$slug"
                  params={{ slug: projects[0]?.slug ?? "" }}
                  className="eyebrow link-underline mt-7 inline-block text-accent"
                >
                  Open the lead experience preview
                </Link>
              </div>
            ) : (
              <PrivateInventoryForm />
            )}
          </div>
        </div>
      </Section>
    </>
  );
}
