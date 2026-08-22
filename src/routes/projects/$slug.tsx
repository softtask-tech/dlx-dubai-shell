import { createFileRoute, notFound, Link } from "@tanstack/react-router";

import { getProject } from "@/data/catalogue";
import { formatHandover, formatPrice, humanise } from "@/lib/format";
import { pageHead } from "@/lib/seo";
import { stagger } from "@/lib/motion";
import { QualifiedForm } from "@/components/forms/qualified-form";
import { Gallery } from "@/components/site/gallery";
import { Reveal } from "@/components/site/reveal";
import { Section, Container, Eyebrow } from "@/components/ui/section";
import { Tag } from "@/components/ui/tag";

export const Route = createFileRoute("/projects/$slug")({
  loader: async ({ params }) => {
    const project = await getProject(params.slug);
    if (!project) throw notFound();
    return { project };
  },
  head: ({ loaderData }) => {
    const project = loaderData?.project;
    if (!project) return {};

    const where = project.area?.name ?? "Dubai";
    return pageHead({
      path: `/projects/${project.slug}`,
      title: project.name,
      description:
        project.summary ??
        `${project.name} in ${where} by ${project.developer?.name ?? "its developer"} — availability, payment plan and handover, from DLX Properties.`,
      tagline: `${where} · ${formatHandover(project.handover_quarter, project.handover_year)}`,
      image: project.hero_image_url ?? "/og/developers.png",
      breadcrumbs: [
        { name: "Developers", path: "/developers" },
        { name: project.name, path: `/projects/${project.slug}` },
      ],
    });
  },
  component: ProjectPage,
});

function ProjectPage() {
  const { project } = Route.useLoaderData();
  const images = [project.hero_image_url, ...project.image_urls].filter((url): url is string =>
    Boolean(url),
  );

  return (
    <>
      <div className="relative h-[65svh] w-full overflow-hidden bg-muted">
        {images[0] ? (
          <img
            src={images[0]}
            alt={project.name}
            fetchPriority="high"
            width={1920}
            height={1280}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : null}
        <div className="absolute inset-0 bg-background/20" />
        <div className="relative flex h-full items-end pb-14">
          <Container>
            <div className="flex flex-wrap items-center gap-3">
              <Tag variant="soft">{project.area?.name ?? "Dubai"}</Tag>
              <Tag variant="soft">{humanise(project.status)}</Tag>
            </div>
            <h1 className="display-1 mt-6 max-w-4xl">{project.name}</h1>
            {project.developer ? (
              <p className="eyebrow mt-6">
                <Link
                  to="/developers/$slug"
                  params={{ slug: project.developer.slug }}
                  className="link-underline text-foreground"
                >
                  By {project.developer.name}
                </Link>
              </p>
            ) : null}
          </Container>
        </div>
      </div>

      <Section>
        <div className="grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Reveal>
              <p className="display-3">
                {project.starting_price
                  ? `From ${formatPrice(project.starting_price, project.currency)}`
                  : "Price on application"}
              </p>
              {project.summary ? (
                <p className="lead mt-8 text-muted-foreground">{project.summary}</p>
              ) : null}
            </Reveal>

            <Reveal delay={0.1}>
              <dl className="mt-12 grid grid-cols-2 gap-px border border-border bg-border sm:grid-cols-3">
                <Fact
                  label="Handover"
                  value={formatHandover(project.handover_quarter, project.handover_year)}
                />
                <Fact label="Status" value={humanise(project.status)} />
                <Fact
                  label="Bedrooms"
                  value={
                    project.bedrooms_min && project.bedrooms_max
                      ? `${project.bedrooms_min}–${project.bedrooms_max}`
                      : "—"
                  }
                />
                <Fact
                  label="Unit types"
                  value={
                    project.unit_types.length > 0
                      ? project.unit_types.map(humanise).join(", ")
                      : "—"
                  }
                />
                <Fact label="Community" value={project.area?.name ?? "—"} />
                <Fact label="Developer" value={project.developer?.name ?? "—"} />
              </dl>
            </Reveal>

            {project.description ? (
              <Reveal delay={0.15}>
                <div className="mt-14">
                  <Eyebrow>The project</Eyebrow>
                  {project.description.split("\n\n").map((paragraph) => (
                    <p key={paragraph.slice(0, 24)} className="body-text mt-6 max-w-measure">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </Reveal>
            ) : null}

            {project.amenities.length > 0 ? (
              <Reveal delay={0.2}>
                <div className="mt-14">
                  <Eyebrow>Amenities</Eyebrow>
                  <div className="mt-6 flex flex-wrap gap-3">
                    {project.amenities.map((amenity) => (
                      <Tag key={amenity}>{amenity}</Tag>
                    ))}
                  </div>
                </div>
              </Reveal>
            ) : null}
          </div>

          <aside className="lg:col-span-4 lg:col-start-9">
            <Reveal delay={0.1}>
              <div className="border border-border p-8">
                <Eyebrow>Payment plan</Eyebrow>
                <p className="body-text mt-5 text-muted-foreground">
                  {project.payment_plan ??
                    "Payment terms vary by unit and release. Ask us for the current schedule."}
                </p>

                <div className="mt-8 flex flex-col gap-4">
                  <a href="#enquire" className="eyebrow link-underline text-foreground">
                    Register your interest
                  </a>
                  {project.brochure_url ? (
                    <a
                      href={project.brochure_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="eyebrow link-underline text-foreground"
                    >
                      Download the brochure (PDF)
                    </a>
                  ) : null}
                  {project.floor_plan_url ? (
                    <a
                      href={project.floor_plan_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="eyebrow link-underline text-foreground"
                    >
                      Floor plans (PDF)
                    </a>
                  ) : null}
                </div>
              </div>
            </Reveal>
          </aside>
        </div>
      </Section>

      {images.length > 1 ? <Gallery images={images} title={project.name} /> : null}

      <Section className="bg-secondary" id="enquire">
        <div className="grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Reveal>
              <Eyebrow>Register interest</Eyebrow>
              <h2 className="display-2 mt-6">Get the release ahead of the portals.</h2>
              <p className="body-text mt-8 max-w-measure text-muted-foreground">
                Allocations on a good launch go before it is publicly advertised. Tell us what you
                are after and we will come to you when it moves.
              </p>
            </Reveal>
          </div>
          <div className="lg:col-span-7 lg:col-start-6">
            <Reveal delay={0.1}>
              <QualifiedForm
                sourceType="contact_form"
                sourceDetail={`project-${project.slug}`}
                defaultIntent="invest"
                title={`Register interest in ${project.name}`}
                submitLabel="Register interest"
              />
            </Reveal>
          </div>
        </div>
      </Section>
    </>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-background p-6">
      <dt className="eyebrow">{label}</dt>
      <dd className="body-text mt-2 text-foreground">{value}</dd>
    </div>
  );
}
