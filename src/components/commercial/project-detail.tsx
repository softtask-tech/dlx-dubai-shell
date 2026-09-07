import { Link } from "@tanstack/react-router";

import type { CommercialProject } from "@/data/off-plan";
import { QualifiedForm } from "@/components/forms/qualified-form";
import { BrochureRequest } from "./brochure-request";
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
import { SectionOpener } from "@/components/site/section-opener";
import { ProjectNav, type ProjectSection } from "./project-nav";
import { MaskReveal, Parallax, Reveal } from "@/components/motion";
import { cityContextFor } from "@/data/off-plan-city-context";

export function CommercialProjectDetail({
  project,
  allProjects,
}: {
  project: CommercialProject;
  allProjects: readonly CommercialProject[];
}) {
  const cityContext = cityContextFor(project.slug);

  /* Only offer a jump to a section the page actually renders. A rail that
   * scrolls to nothing is worse than no rail. */
  const sections: ProjectSection[] = [
    { id: "figures", label: "Overview" },
    ...(project.collections.length > 0 ? [{ id: "homes", label: "Homes" }] : []),
    ...(project.amenities.length > 0 ? [{ id: "amenities", label: "Amenities" }] : []),
    { id: "terms", label: "Terms" },
    ...(project.connectivity.length > 0 ? [{ id: "access", label: "Location" }] : []),
    { id: "weigh", label: "Considerations" },
    { id: "enquire", label: "Enquire" },
  ];

  return (
    <>
      <section data-surface="cream" className="pb-12 pt-14 md:pb-16 md:pt-20">
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
              <Reveal>
                <Eyebrow>{project.projectType}</Eyebrow>
                <h1 className="display-1 mt-5 text-balance">{project.name}</h1>
              </Reveal>
              <Reveal delay={0.08}>
                <p className="lead mt-6 max-w-3xl text-muted-foreground">{project.headline}</p>
                <p className="eyebrow mt-6 flex items-center gap-2.5 text-foreground">
                  <span aria-hidden className="inline-block size-1 shrink-0 bg-gold-ink" />
                  {project.locationName} · {project.developerName}
                </p>
              </Reveal>
            </div>
            <div className="lg:col-span-3 lg:col-start-10">
              <Reveal delay={0.12}>
                <CommercialPrice project={project} />
              </Reveal>
            </div>
          </div>
        </Container>
      </section>

      {/* The opening frame. Uncovered on scroll and drifting slower than the
          page, so arriving at the project feels like arriving somewhere. */}
      <figure className="m-0 bg-muted">
        <MaskReveal>
          <div className="relative h-[48svh] min-h-96 overflow-hidden md:h-[72svh]">
            <Parallax speed={0.88} className="absolute inset-x-0 -top-[8%] h-[116%]">
              <ConceptProjectImage
                project={project}
                priority
                className="h-full w-full object-cover"
              />
            </Parallax>
          </div>
        </MaskReveal>
        <figcaption className="caption mx-auto max-w-shell px-6 py-3 text-muted-foreground md:px-10 lg:px-16">
          {project.hero.caption}
        </figcaption>
      </figure>

      <ProjectNav sections={sections} />

      {/* The four numbers, given room. They were a bordered grid of four
          cells, which is a table of facts; they are the first thing anyone
          takes from this page and should read like it. */}
      <Section id="figures" className="scroll-mt-32">
        <SectionOpener
          eyebrow="The community in four numbers"
          title="What the scheme actually is."
        />
        <div className="mt-12">
          <ProjectFigures project={project} />
        </div>
        <div className="mt-12">
          <HandoverStatus project={project} />
        </div>
      </Section>

      {/*
       * Overview, with the rail beside it.
       *
       * This is the fix for the page's worst habit. Everything used to sit in
       * one column with a short aside next to it, so once the aside ran out
       * the right third of the page was empty for thousands of pixels. The
       * rail is sticky now, so it travels with the reader, and the sections
       * that do not need a rail run the full width instead of pretending they
       * have a neighbour.
       */}
      <Section id="overview" data-surface="cream" className="scroll-mt-32">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <SectionOpener eyebrow="Project overview" title="The scheme, in plain terms." />
            <div className="mt-10">
              {project.overview.map((paragraph) => (
                <Reveal key={paragraph}>
                  <p className="body-text mt-0 mb-6 max-w-measure text-muted-foreground last:mb-0">
                    {paragraph}
                  </p>
                </Reveal>
              ))}
            </div>
          </div>

          <aside className="lg:col-span-4 lg:col-start-9">
            <div className="flex flex-col gap-8 lg:sticky lg:top-36">
              <ConsultantModule project={project} />
              <SourceDisclosure project={project} />
            </div>
          </aside>
        </div>
      </Section>

      {project.collections.length > 0 ? (
        <Section id="homes" className="scroll-mt-32">
          <SectionOpener eyebrow="The homes" title="What you would actually be buying." />
          <div className="mt-12">
            <ProjectCollections project={project} />
          </div>
        </Section>
      ) : null}

      {project.amenities.length > 0 ? (
        <Section id="amenities" data-surface="cream" className="scroll-mt-32">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-4">
              <SectionOpener
                eyebrow="Key amenities"
                title="What is being built around the homes."
                align="split"
                lead="Amenity density is not free. It is carried by the service charge for the life of the community, which is why the note below matters more than the list."
              />
            </div>
            <div className="lg:col-span-8">
              {/* A flowing list on hairlines, not a bordered grid. The grid
                  made a set of amenities look like a specification table. */}
              <ul className="columns-1 gap-x-10 sm:columns-2">
                {project.amenities.map((amenity) => (
                  <li
                    key={amenity}
                    className="body-text flex break-inside-avoid gap-3 border-b border-border py-3.5"
                  >
                    <span aria-hidden className="mt-2.5 inline-block size-1 shrink-0 bg-gold-ink" />
                    {amenity}
                  </li>
                ))}
              </ul>
              {project.serviceChargeNote ? (
                <p className="caption mt-8 border-s-2 border-gold-ink ps-5 text-muted-foreground">
                  Service charges: {project.serviceChargeNote}
                </p>
              ) : null}
            </div>
          </div>
        </Section>
      ) : null}

      <Section id="terms" className="scroll-mt-32">
        <SectionOpener eyebrow="Terms and timing" title="When you pay, and when you get the keys." />
        <div className="mt-12 grid gap-8 sm:grid-cols-2">
          <PaymentPlanTimeline project={project} />
          <FloorPlanViewer project={project} />
        </div>
      </Section>

      {project.connectivity.length > 0 ? (
        <Section id="access" data-surface="cream" className="scroll-mt-32">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-4">
              <SectionOpener
                eyebrow="Getting around"
                title="What is actually near it."
                align="split"
                lead="Distances and drive times are the developer's own approximations, not measured by us."
              />
            </div>
            <div className="lg:col-span-7 lg:col-start-6">
              <ProjectConnectivity project={project} />
            </div>
          </div>
        </Section>
      ) : null}

      {/* The considerations sat in a narrow column with two thirds of the page
          empty beside them. They are the most important reading here, so they
          get the width and a number to hold them. */}
      <Section id="weigh" className="scroll-mt-32">
        <SectionOpener
          eyebrow="What to weigh before you commit"
          title="The parts a brochure leaves out."
        />
        <ol className="mt-12 grid gap-x-12 gap-y-8 md:grid-cols-2">
          {project.investmentConsiderations.map((consideration, index) => (
            <Reveal key={consideration} delay={index * 0.05}>
              <li className="border-t border-border pt-6">
                <span aria-hidden className="eyebrow text-gold-ink">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className="body-text mt-3 text-muted-foreground">{consideration}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </Section>

      <Section id="gallery" data-surface="cream" className="scroll-mt-32">
        <SectionOpener eyebrow="Gallery" title="The developer's own renders." />
        <div className="mt-12">
          <ProjectGallery project={project} />
        </div>
        {project.brochureUrl ? (
          <div className="mt-12 max-w-3xl">
            <BrochureRequest project={project} />
          </div>
        ) : null}
      </Section>

      <Section className="pt-0">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <TrustSourcePanel project={project} />
          </div>
          <aside className="lg:col-span-6 lg:col-start-7" aria-label="Advertising compliance">
            <Eyebrow>Advertising compliance</Eyebrow>
            <p className="caption mt-4 max-w-measure text-muted-foreground">
              A DLD advertisement permit number, responsible broker BRN and authority-issued QR
              code are issued per release and are shown on the offer we send you. Nothing on this
              page is an offer or a claim of availability.
            </p>
          </aside>
        </div>
        <div className="mt-16">
          <RelatedProjects project={project} projects={allProjects} />
        </div>
      </Section>

      {/*
       * Where this actually is, and what that changes.
       *
       * The homepage stays Dubai-voiced and gives these projects a location
       * tag and nothing more. This is the page where someone has chosen to
       * read about the emirate, so it is the page that explains it: what
       * drives demand there, which authority sets the rules, and what this
       * site therefore cannot tell them.
       */}
      {cityContext ? (
        <Section data-surface="cream" id="location">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5">
              <Eyebrow>{cityContext.eyebrow}</Eyebrow>
              <h2 className="display-2 mt-5 text-balance">{cityContext.heading}</h2>
            </div>
            <div className="lg:col-span-7">
              {cityContext.paragraphs.map((paragraph) => (
                <p key={paragraph} className="body-text mt-0 mb-6 max-w-measure last:mb-0">
                  {paragraph}
                </p>
              ))}
              <p className="caption mt-8 border-t border-border pt-5 text-muted-foreground">
                {cityContext.dataNote}
              </p>
            </div>
          </div>
        </Section>
      ) : null}

      <Section data-surface="dark" id="actions">
        <Eyebrow className="text-gold">Next step</Eyebrow>
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
