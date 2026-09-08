import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import type { CommercialProject } from "@/data/off-plan";
import { ConceptProjectImage } from "./project-primitives";
import { PrivateInventoryForm } from "./private-inventory-form";
import { MaskReveal, Reveal } from "@/components/motion";
import { PageHero } from "@/components/site/page-hero";
import { SectionOpener } from "@/components/site/section-opener";
import { Container, Eyebrow, Section } from "@/components/ui/section";
import { cn } from "@/lib/utils";

/**
 * The two mandates, as the product they are.
 *
 * This page used to open on a band of text with no photograph at all, which
 * next to the rest of the site read as unfinished, and then set both projects
 * as cards in an asymmetric grid. Cards are how you show twelve of something.
 * With two, a card is a way of making each look smaller than it is.
 *
 * So each project gets a full row: the photograph on one side at a size worth
 * looking at, the facts on the other, and the sides swap between them so the
 * page has a rhythm rather than a repeat. Below that they are set against each
 * other on the same rows, because with exactly two mandates the comparison is
 * the most useful thing this page can do and it is the thing a card grid can
 * never show.
 */
export function OffPlanIndex({ projects }: { projects: readonly CommercialProject[] }) {
  const hasProjects = projects.length > 0;

  return (
    <>
      <PageHero
        photo="downtown-fog-day"
        eyebrow="Off-plan, considered properly"
        title="A project page should help you test the decision, not repeat the brochure."
        lead="Price, payment timing, supply, service costs, delivery and recorded evidence, kept separate from sales narrative."
      />

      {hasProjects ? (
        <>
          <Section aria-label="Off-plan projects in focus">
            <SectionOpener
              title="Two masterplanned communities, set out with the developer's own figures."
              lead="Every number below is quoted from the developer's published material. Prices, payment terms and handover dates are issued per release and confirmed to you in writing."
            />
            <div className="mt-16 flex flex-col gap-20 md:gap-28">
              {projects.map((project, index) => (
                <ProjectRow key={project.slug} project={project} flipped={index % 2 === 1} />
              ))}
            </div>
          </Section>

          {projects.length > 1 ? <CompareProjects projects={projects} /> : null}
        </>
      ) : null}

      <Section data-surface="cream">
        <div className="grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <SectionOpener
              title="Some opportunities are shared privately."
              lead="Tell us what you are looking for and we will show you what fits. This page does not claim that a property or allocation exists: a consultant checks the market against your brief before suggesting anything."
            />
          </div>
          <div className="lg:col-span-6 lg:col-start-7">
            <PrivateInventoryForm />
          </div>
        </div>
      </Section>
    </>
  );
}

/**
 * One project, at full width.
 *
 * The photograph is given a real share of the row and uncovers itself on
 * scroll; the facts sit opposite as a hairline list rather than a paragraph,
 * because these are the things a buyer scans for and prose hides them.
 */
function ProjectRow({ project, flipped }: { project: CommercialProject; flipped: boolean }) {
  const facts = [
    { label: "Developer", value: project.developerName },
    { label: "Location", value: project.locationName },
    { label: "Homes", value: project.propertyTypes.join(" · ") },
    { label: "Handover", value: project.handover },
    { label: "Status", value: project.constructionStatus },
  ].filter((fact): fact is { label: string; value: string } => Boolean(fact.value));

  return (
    <article className="grid items-center gap-10 lg:grid-cols-12 lg:gap-16">
      <MaskReveal
        className={cn("lg:col-span-7", flipped && "lg:order-2 lg:col-start-6")}
      >
        <Link
          to="/off-plan/$slug"
          params={{ slug: project.slug }}
          className="focus-ring group block overflow-hidden"
          tabIndex={-1}
          aria-hidden="true"
        >
          <ConceptProjectImage
            project={project}
            sizes="(min-width: 1024px) 58vw, 100vw"
            className="aspect-[4/5] w-full object-cover transition-transform duration-cinematic ease-editorial group-hover:scale-[1.04] motion-reduce:transition-none sm:aspect-[3/2]"
          />
        </Link>
      </MaskReveal>

      <div className={cn("lg:col-span-5", flipped && "lg:order-1 lg:col-start-1")}>
        <Reveal>
          <Eyebrow>
            {project.locationName} · {project.developerName}
          </Eyebrow>
          <h3 className="display-2 mt-4 text-balance">{project.name}</h3>
          <p className="body-text mt-5 max-w-measure text-muted-foreground">{project.headline}</p>
        </Reveal>

        <Reveal delay={0.08}>
          <dl className="mt-8 border-t border-border">
            {facts.map((fact) => (
              <div key={fact.label} className="flex gap-6 border-b border-border py-3">
                <dt className="eyebrow w-28 shrink-0 text-muted-foreground">{fact.label}</dt>
                <dd className="caption text-foreground">{fact.value}</dd>
              </div>
            ))}
          </dl>

          <Link
            to="/off-plan/$slug"
            params={{ slug: project.slug }}
            className="focus-ring eyebrow group mt-8 inline-flex min-h-12 items-center gap-2 bg-green px-7 text-on-dark transition-colors hover:bg-green-mid"
          >
            Explore {project.name}
            <ArrowRight
              aria-hidden
              className="size-3.5 transition-transform duration-quick ease-editorial group-hover:translate-x-1 rtl:-scale-x-100"
            />
          </Link>
        </Reveal>
      </div>
    </article>
  );
}

/**
 * The two, on the same rows.
 *
 * With a portfolio you show a grid and let the reader filter. With exactly two
 * mandates the honest and more useful thing is to put them against each other,
 * because that is the actual decision in front of anyone reading this page.
 * A field neither project publishes is left out of the table rather than
 * printed as a dash on both sides.
 */
function CompareProjects({ projects }: { projects: readonly CommercialProject[] }) {
  type CompareRow = { label: string; value: (project: CommercialProject) => string | null };
  const rows: CompareRow[] = (
    [
      { label: "Emirate", value: (p: CommercialProject) => p.locationName },
      { label: "Developer", value: (p: CommercialProject) => p.developerName },
      { label: "Type", value: (p: CommercialProject) => p.projectType },
      { label: "Homes", value: (p: CommercialProject) => p.propertyTypes.join(" · ") || null },
      { label: "Bedrooms", value: (p: CommercialProject) => p.bedrooms },
      { label: "Sizes", value: (p: CommercialProject) => p.unitSizeRangeSqFt },
      { label: "Handover", value: (p: CommercialProject) => p.handover },
      { label: "Construction", value: (p: CommercialProject) => p.constructionStatus },
      { label: "Price", value: (p: CommercialProject) => p.priceNote },
    ] satisfies CompareRow[]
  ).filter((row) => projects.some((project) => row.value(project)));

  return (
    <Section data-surface="dark">
      <SectionOpener
        title="The same questions, asked of both."
        lead="Two mandates is few enough to compare properly. Anything a developer has not published is left blank here rather than filled in."
      />

      <Reveal>
        <div className="mt-12 overflow-x-auto">
          <table className="w-full min-w-[36rem] border-collapse">
            <caption className="sr-only">
              Azizi Florence and Sobha City compared on the facts each developer publishes.
            </caption>
            <thead>
              <tr>
                <th scope="col" className="w-32 border-b border-border py-4 text-start">
                  <span className="sr-only">Field</span>
                </th>
                {projects.map((project) => (
                  <th
                    key={project.slug}
                    scope="col"
                    className="border-b border-border py-4 pe-6 text-start align-bottom"
                  >
                    <span className="display-3 block">{project.name}</span>
                    <span className="caption mt-1 block text-on-dark-muted">
                      {project.locationName}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label}>
                  <th
                    scope="row"
                    className="eyebrow border-b border-border py-4 pe-6 text-start align-top text-on-dark-muted"
                  >
                    {row.label}
                  </th>
                  {projects.map((project) => (
                    <td
                      key={project.slug}
                      className="caption border-b border-border py-4 pe-6 align-top text-on-dark"
                    >
                      {row.value(project) ?? (
                        <span className="text-on-dark-muted">Not published</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Reveal>

      <Reveal>
        <Container className="px-0">
          <p className="caption mt-8 max-w-measure text-on-dark-muted">
            Taken from each developer&rsquo;s published material on the date shown on that
            project&rsquo;s page. Releases change; a consultant confirms current terms in writing
            before anything is signed.
          </p>
        </Container>
      </Reveal>
    </Section>
  );
}
