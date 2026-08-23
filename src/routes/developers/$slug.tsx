import { createFileRoute, notFound, Link } from "@tanstack/react-router";

import { getDeveloper, listProjects } from "@/data/catalogue";
import { formatHandover } from "@/lib/format";
import { Price } from "@/components/tools/money";
import { pageHead } from "@/lib/seo";
import { stagger } from "@/lib/motion";
import { QualifiedForm } from "@/components/forms/qualified-form";
import { Reveal } from "@/components/site/reveal";
import { Section, Eyebrow } from "@/components/ui/section";
import { ExternalLink } from "@/components/ui/link";
import { Tag } from "@/components/ui/tag";

export const Route = createFileRoute("/developers/$slug")({
  loader: async ({ params }) => {
    const developer = await getDeveloper(params.slug);
    if (!developer) throw notFound();
    const projects = await listProjects({ developerId: developer.id });
    return { developer, projects };
  },
  head: ({ loaderData }) => {
    const developer = loaderData?.developer;
    if (!developer) return {};

    return pageHead({
      path: `/developers/${developer.slug}`,
      title: developer.name,
      description:
        developer.summary ??
        `${developer.name} — projects, delivery record and current availability, from DLX Properties.`,
      tagline: developer.summary ?? `Projects and availability from ${developer.name}.`,
      image: developer.logo_url ?? "/og/developers.png",
      breadcrumbs: [
        { name: "Developers", path: "/developers" },
        { name: developer.name, path: `/developers/${developer.slug}` },
      ],
    });
  },
  component: DeveloperPage,
});

function DeveloperPage() {
  const { developer, projects } = Route.useLoaderData();

  return (
    <>
      <Section className="pt-44 pb-20 lg:pt-56">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Reveal>
              <Eyebrow>Developer</Eyebrow>
              <h1 className="display-1 mt-8">{developer.name}</h1>
              {developer.summary ? (
                <p className="lead mt-10 max-w-measure text-muted-foreground">
                  {developer.summary}
                </p>
              ) : null}
            </Reveal>
          </div>
          <div className="lg:col-span-4 lg:col-start-9">
            <Reveal delay={0.12}>
              <dl className="flex flex-col gap-6">
                {developer.founded_year ? (
                  <div>
                    <dt className="eyebrow">Founded</dt>
                    <dd className="display-3 mt-2">{developer.founded_year}</dd>
                  </div>
                ) : null}
                <div>
                  <dt className="eyebrow">Projects we represent</dt>
                  <dd className="display-3 mt-2">{projects.length}</dd>
                </div>
              </dl>
              {developer.website_url ? (
                <ExternalLink
                  href={developer.website_url}
                  variant="eyebrow"
                  className="mt-8 inline-block"
                >
                  Developer website
                </ExternalLink>
              ) : null}
              <div className="mt-10 h-px w-16 bg-accent" />
            </Reveal>
          </div>
        </div>
      </Section>

      {developer.description ? (
        <Section className="pt-0 pb-24">
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="flex flex-col gap-8 lg:col-span-8 lg:col-start-3">
              {developer.description.split("\n\n").map((paragraph, index) => (
                <Reveal key={paragraph.slice(0, 24)} delay={stagger(index)}>
                  <p className="lead">{paragraph}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </Section>
      ) : null}

      {projects.length > 0 ? (
        <Section className="bg-secondary">
          <Reveal>
            <Eyebrow>Projects</Eyebrow>
          </Reveal>
          <div className="mt-12 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project, index) => (
              <Reveal key={project.id} delay={stagger(index % 3)}>
                <Link to="/projects/$slug" params={{ slug: project.slug }} className="group block">
                  <div className="aspect-[4/3] overflow-hidden bg-muted">
                    {project.hero_image_url ? (
                      <img
                        src={project.hero_image_url}
                        alt={project.name}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover transition-transform duration-slow ease-editorial group-hover:scale-[1.03]"
                      />
                    ) : null}
                  </div>
                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <Tag variant="bare">{project.area?.name ?? "Dubai"}</Tag>
                    <Tag variant="soft">{project.status.replace(/_/g, " ")}</Tag>
                  </div>
                  <h3 className="display-3 mt-4 transition-colors group-hover:text-accent">
                    {project.name}
                  </h3>
                  <p className="caption mt-2">
                    {formatHandover(project.handover_quarter, project.handover_year)}
                  </p>
                  <p className="eyebrow mt-3 text-foreground">
                    {project.starting_price ? (
                      <Price amount={project.starting_price} currency={project.currency} />
                    ) : (
                      "Price on application"
                    )}
                  </p>
                </Link>
              </Reveal>
            ))}
          </div>
        </Section>
      ) : null}

      <Section>
        <div className="grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Reveal>
              <Eyebrow>Enquire</Eyebrow>
              <h2 className="display-2 mt-6">Considering {developer.name}?</h2>
              <p className="body-text mt-8 max-w-measure text-muted-foreground">
                We will tell you what we actually think of the product, the location and the
                delivery record — including when we think you should look elsewhere.
              </p>
            </Reveal>
          </div>
          <div className="lg:col-span-7 lg:col-start-6">
            <Reveal delay={0.1}>
              <QualifiedForm
                sourceType="contact_form"
                sourceDetail={`developer-${developer.slug}`}
                defaultIntent="invest"
                title={`Ask about ${developer.name}`}
              />
            </Reveal>
          </div>
        </div>
      </Section>
    </>
  );
}
