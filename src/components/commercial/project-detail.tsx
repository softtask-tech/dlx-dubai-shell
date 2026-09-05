import { Link } from "@tanstack/react-router";

import type { CommercialProject } from "@/data/off-plan";
import { DemoEnquiryForm } from "./demo-enquiry-form";
import {
  CommercialPrice,
  ConceptDisclosure,
  ConceptProjectImage,
  ConsultantModule,
  FloorPlanViewer,
  HandoverStatus,
  LeadActions,
  PaymentPlanTimeline,
  ProjectGallery,
  RelatedProjects,
  TrustSourcePanel,
} from "./project-primitives";
import { Container, Eyebrow, Section } from "@/components/ui/section";

export function CommercialProjectDetail({
  project,
  allProjects,
}: {
  project: CommercialProject;
  allProjects: readonly CommercialProject[];
}) {
  return (
    <>
      <section className="bg-paper-cool pb-12 pt-20 md:pb-16 md:pt-12">
        <Container>
          <nav aria-label="Breadcrumb" className="caption mb-8 flex gap-2 text-muted-foreground">
            <Link to="/off-plan" className="link-underline">
              Off-plan
            </Link>
            <span aria-hidden="true">/</span>
            <span>{project.name}</span>
          </nav>
          <ConceptDisclosure />
          <div className="mt-10 grid items-end gap-8 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <Eyebrow>{project.projectType}</Eyebrow>
              <h1 className="display-1 mt-5 text-balance">{project.name}</h1>
              <p className="body-text mt-5 text-muted-foreground">
                {project.locationName} · {project.developerName}
              </p>
            </div>
            <div className="lg:col-span-3 lg:col-start-10">
              <CommercialPrice amount={project.startingPrice} />
            </div>
          </div>
        </Container>
      </section>

      <figure className="bg-muted">
        <ConceptProjectImage
          project={project}
          priority
          className="h-[48svh] min-h-96 w-full object-cover md:h-[72svh]"
        />
        <figcaption className="caption mx-auto max-w-shell px-6 py-3 text-muted-foreground md:px-10 lg:px-16">
          {project.hero.caption}
        </figcaption>
      </figure>

      <Section className="pt-10">
        <ProjectGallery project={project} />
      </Section>

      <Section>
        <div className="grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <HandoverStatus project={project} />
            <div className="mt-14">
              <Eyebrow>Project overview</Eyebrow>
              {project.overview.map((paragraph) => (
                <p key={paragraph} className="lead mt-6 max-w-3xl text-muted-foreground">
                  {paragraph}
                </p>
              ))}
            </div>
            <div className="mt-14">
              <Eyebrow>Key amenities</Eyebrow>
              <ul className="mt-6 grid gap-px border border-border bg-border sm:grid-cols-2">
                {project.amenities.map((amenity) => (
                  <li key={amenity} className="body-text bg-background p-5">
                    {amenity}
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-14 grid gap-8 sm:grid-cols-2">
              <PaymentPlanTimeline project={project} />
              <FloorPlanViewer project={project} />
            </div>
            <div className="mt-14">
              <Eyebrow>Investment considerations</Eyebrow>
              {project.investmentConsiderations.map((consideration) => (
                <p
                  key={consideration}
                  className="body-text mt-5 max-w-measure text-muted-foreground"
                >
                  {consideration}
                </p>
              ))}
              <p className="body-text mt-5 text-muted-foreground">
                Service-charge information · To be confirmed
              </p>
              <p className="body-text mt-2 text-muted-foreground">
                Related market evidence · To be confirmed
              </p>
            </div>
          </div>
          <aside className="flex flex-col gap-9 lg:col-span-3 lg:col-start-10">
            <TrustSourcePanel project={project} />
            <ConsultantModule project={project} />
            <RelatedProjects project={project} projects={allProjects} />
          </aside>
        </div>
      </Section>

      <Section className="bg-ink text-on-dark" id="actions">
        <Eyebrow className="text-on-dark-muted">Enquiry actions · preview only</Eyebrow>
        <h2 className="display-2 mt-5 max-w-3xl">A complete route to a useful conversation.</h2>
        <p className="body-text mt-5 max-w-measure text-on-dark-muted">
          These actions demonstrate intent. WhatsApp is disabled for fictional projects, and the
          form below sends nothing.
        </p>
        <div className="mt-8 [&_button]:border-on-dark/30 [&_button]:text-on-dark">
          <LeadActions />
        </div>
      </Section>

      <Section id="enquire" className="bg-paper-cool">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Eyebrow>No-write demonstration</Eyebrow>
            <h2 className="display-2 mt-5">The form behaves. The pipeline stays untouched.</h2>
          </div>
          <div className="lg:col-span-7 lg:col-start-6">
            <DemoEnquiryForm projectName={project.name} />
          </div>
        </div>
      </Section>
    </>
  );
}
