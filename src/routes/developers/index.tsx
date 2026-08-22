import { createFileRoute, Link } from "@tanstack/react-router";

import { listDevelopers, listProjects } from "@/data/catalogue";
import { formatHandover, formatPrice } from "@/lib/format";
import { pageHead } from "@/lib/seo";
import { stagger } from "@/lib/motion";
import { Reveal } from "@/components/site/reveal";
import { Section, Eyebrow } from "@/components/ui/section";
import { Tag } from "@/components/ui/tag";

export const Route = createFileRoute("/developers/")({
  loader: async () => {
    const [developers, projects] = await Promise.all([
      listDevelopers(),
      listProjects({ limit: 9 }),
    ]);
    return { developers, projects };
  },
  head: () =>
    pageHead({ path: "/developers", breadcrumbs: [{ name: "Developers", path: "/developers" }] }),
  component: DevelopersIndex,
});

function DevelopersIndex() {
  const { developers, projects } = Route.useLoaderData();

  return (
    <>
      <Section className="pt-44 pb-20 lg:pt-56">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Reveal>
              <Eyebrow>The market</Eyebrow>
              <h1 className="display-1 mt-8">Developers &amp; Projects</h1>
            </Reveal>
          </div>
          <div className="lg:col-span-4 lg:col-start-9">
            <Reveal delay={0.12}>
              <p className="body-text text-muted-foreground">
                Who builds what in Dubai, where, and — the part that matters when you are buying
                off-plan — how reliably they deliver.
              </p>
              <div className="mt-10 h-px w-16 bg-accent" />
            </Reveal>
          </div>
        </div>
      </Section>

      {developers.length > 0 ? (
        <Section className="pt-0">
          <Reveal>
            <Eyebrow>Developers</Eyebrow>
          </Reveal>
          <div className="mt-10 hairline" />
          {developers.map((developer, index) => (
            <Reveal key={developer.id} delay={stagger(index)}>
              <Link
                to="/developers/$slug"
                params={{ slug: developer.slug }}
                className="group grid items-baseline gap-4 border-b border-border py-10 transition-colors hover:border-accent md:grid-cols-12"
              >
                <span className="display-3 transition-transform duration-slow ease-editorial group-hover:translate-x-3 md:col-span-5">
                  {developer.name}
                </span>
                <span className="body-text text-muted-foreground md:col-span-6">
                  {developer.summary ?? ""}
                </span>
                <span className="eyebrow transition-colors group-hover:text-accent md:col-span-1 md:text-right">
                  View
                </span>
              </Link>
            </Reveal>
          ))}
        </Section>
      ) : null}

      {projects.length > 0 ? (
        <Section className="bg-secondary">
          <Reveal>
            <Eyebrow>Projects</Eyebrow>
            <h2 className="display-2 mt-6">Currently worth knowing about</h2>
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
                    {project.developer?.name ?? "—"} ·{" "}
                    {formatHandover(project.handover_quarter, project.handover_year)}
                  </p>
                  <p className="eyebrow mt-3 text-foreground">
                    {project.starting_price
                      ? `From ${formatPrice(project.starting_price, project.currency)}`
                      : "Price on application"}
                  </p>
                </Link>
              </Reveal>
            ))}
          </div>
        </Section>
      ) : null}

      {developers.length === 0 && projects.length === 0 ? (
        <Section className="pt-0">
          <div className="border border-border p-12 text-center">
            <Eyebrow>Being prepared</Eyebrow>
            <h2 className="display-3 mt-6">Developer profiles are on their way.</h2>
            <p className="body-text mx-auto mt-6 max-w-measure text-muted-foreground">
              In the meantime, if you are weighing up a specific project or developer, ask us
              directly — we will tell you what we actually think.
            </p>
            <Link to="/contact" className="eyebrow link-underline mt-10 inline-block text-accent">
              Ask about a project
            </Link>
          </div>
        </Section>
      ) : null}
    </>
  );
}
