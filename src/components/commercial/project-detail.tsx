import { Link } from "@tanstack/react-router";

import type { CommercialProject } from "@/data/off-plan";
import { QualifiedForm } from "@/components/forms/qualified-form";
import {
  CommercialPrice,
  ConceptProjectImage,
  ConsultantModule,
  FloorPlanViewer,
  HandoverStatus,
  LeadActions,
  PaymentPlanTimeline,
  ProjectCollections,
  ProjectConnectivity,
  ProjectFigures,
  ProjectGallery,
  RelatedProjects,
  SourceDisclosure,
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
      <section className="bg-secondary pb-12 pt-20 md:pb-16 md:pt-12">
        <Container>
          <nav aria-label="Breadcrumb" className="caption mb-8 flex gap-2 text-muted-foreground">
            <Link to="/off-plan" className="link-underline">
              Off-plan
            </Link>
            <span aria-hidden="true">/</span>
            <span>{project.name}</span>
          </nav>
          <div className="grid items-end gap-8 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <Eyebrow>{project.projectType}</Eyebrow>
              <h1 className="display-1 mt-5 text-balance">{project.name}</h1>
              <p className="lead mt-6 max-w-3xl text-muted-foreground">{project.headline}</p>
              <p className="body-text mt-5 text-muted-foreground">
                {project.locationName} · {project.developerName}
              </p>
            </div>
            <div className="lg:col-span-3 lg:col-start-10">
              <CommercialPrice project={project} />
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

      <Section className="pt-12">
        <Eyebrow>The community in four numbers</Eyebrow>
        <div className="mt-6">
          <ProjectFigures project={project} />
        </div>
      </Section>

      <Section className="pt-0">
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

            {project.collections.length > 0 ? (
              <div className="mt-14">
                <Eyebrow>The homes</Eyebrow>
                <div className="mt-6">
                  <ProjectCollections project={project} />
                </div>
              </div>
            ) : null}

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

            {project.connectivity.length > 0 ? (
              <div className="mt-14">
                <Eyebrow>Getting around</Eyebrow>
                <ProjectConnectivity project={project} />
                <p className="caption mt-4 text-muted-foreground">
                  Distances and drive times are the developer's own approximations.
                </p>
              </div>
            ) : null}

            <div className="mt-14 grid gap-8 sm:grid-cols-2">
              <PaymentPlanTimeline project={project} />
              <FloorPlanViewer project={project} />
            </div>

            <div className="mt-14">
              <Eyebrow>What to weigh before you commit</Eyebrow>
              {project.investmentConsiderations.map((consideration) => (
                <p
                  key={consideration}
                  className="body-text mt-5 max-w-measure text-muted-foreground"
                >
                  {consideration}
                </p>
              ))}
              {project.serviceChargeNote ? (
                <p className="body-text mt-5 text-muted-foreground">
                  Service charges · {project.serviceChargeNote}
                </p>
              ) : null}
            </div>
          </div>

          <aside className="flex flex-col gap-9 lg:col-span-3 lg:col-start-10">
            <SourceDisclosure project={project} />
            <TrustSourcePanel project={project} />
            <aside className="border border-border p-5" aria-label="Advertising compliance">
              <Eyebrow>Advertising compliance</Eyebrow>
              <p className="caption mt-4 text-muted-foreground">
                A DLD advertisement permit number, responsible broker BRN and authority-issued QR
                code are issued per release and are shown on the offer we send you. Nothing on this
                page is an offer or a claim of availability.
              </p>
            </aside>
            <ConsultantModule project={project} />
            <RelatedProjects project={project} projects={allProjects} />
          </aside>
        </div>
      </Section>

      <Section className="bg-ink text-on-dark" id="actions">
        <Eyebrow className="text-on-dark-muted">Next step</Eyebrow>
        <h2 className="display-2 mt-5 max-w-3xl">
          Ask for the price list, the plans and the payment terms.
        </h2>
        <p className="body-text mt-5 max-w-measure text-on-dark-muted">
          You get the developer's current release documents in writing, with a plain explanation of
          what they mean for you.
        </p>
        <div className="mt-8 [&_button]:border-on-dark/30 [&_button]:text-on-dark">
          <LeadActions projectName={project.name} />
        </div>
      </Section>

      <Section id="enquire" className="bg-secondary">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Eyebrow>Register interest</Eyebrow>
            <h2 className="display-2 mt-5">Tell us what you are after.</h2>
            <p className="body-text mt-6 max-w-measure text-muted-foreground">
              A consultant replies with the current release, the terms and an honest read on whether
              it fits what you want.
            </p>
          </div>
          <div className="lg:col-span-7 lg:col-start-6">
            <QualifiedForm
              sourceType="contact_form"
              sourceDetail={`off-plan-${project.slug}`}
              defaultIntent="invest"
              title={`Register interest in ${project.name}`}
              submitLabel="Register interest"
            />
          </div>
        </div>
      </Section>
    </>
  );
}
