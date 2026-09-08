import { createFileRoute, Link } from "@tanstack/react-router";

import { listDevelopers, listProjects } from "@/data/catalogue";
import { loadDirectoryList } from "@/data/directory-route";
import { formatHandover } from "@/lib/format";
import { Price } from "@/components/tools/money";
import { pageHead, withHeroPreload } from "@/lib/seo";
import { itemListSchema } from "@/lib/schema";
import { stagger } from "@/lib/motion";
import { Reveal } from "@/components/site/reveal";
import { PageHero } from "@/components/site/page-hero";
import { Section, Eyebrow } from "@/components/ui/section";
import { Tag } from "@/components/ui/tag";

export const Route = createFileRoute("/developers/")({
  loader: async () => {
    /*
     * The registry alongside the curated table.
     *
     * `developers` has never been populated, so this page told every visitor
     * that developer profiles were "on their way" while the Dubai Land
     * Department's own developer register sat in the same database, already
     * powering /directory/developers. Whatever we eventually write about a
     * developer, the official record of who is registered is a better answer
     * than an apology, and it is one nobody else on the page can dispute.
     */
    const [developers, projects, registry] = await Promise.all([
      listDevelopers().catch(() => []),
      listProjects({ limit: 9 }).catch(() => []),
      loadDirectoryList({ q: "", page: 1 }, "developer").catch(() => null),
    ]);
    return { developers, projects, registry };
  },
  head: ({ loaderData }) =>
    withHeroPreload(
      "burj-al-arab-cloud",
      pageHead({
        path: "/developers",
        breadcrumbs: [{ name: "Developers", path: "/developers" }],
        schema: [
          itemListSchema({
            name: "Dubai developers covered by DLX Properties",
            items: (loaderData?.developers ?? []).map((developer) => ({
              name: developer.name,
              path: `/developers/${developer.slug}`,
              ...(developer.summary ? { description: developer.summary } : {}),
            })),
          }),
        ],
      }),
    ),
  component: DevelopersIndex,
});

function DevelopersIndex() {
  const { developers, projects, registry } = Route.useLoaderData();
  const registered = registry?.records ?? [];

  return (
    <>
      <PageHero
        photo="burj-al-arab-cloud"
        title="Who builds what, and how they deliver."
        lead="The developers behind Dubai's master communities, where they build, and, the part that matters when you are buying off-plan, how reliably they hand over."
      />

      {developers.length > 0 ? (
        <Section>
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
                    {project.developer?.name ?? "-"} ·{" "}
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

      {/*
       * The official register, which is the answer while our own profiles are
       * being written.
       *
       * This page used to tell every visitor that developer profiles were "on
       * their way", while the Dubai Land Department's own developer register
       * sat in the same database already powering the directory. Whatever we
       * eventually write about a developer, the official record of who is
       * registered is a better answer than an apology, and it is the one thing
       * on the page nobody can dispute.
       */}
      {registered.length > 0 ? (
        <Section data-surface="cream" className={developers.length > 0 ? "" : "pt-0"}>
          <Reveal>
            <h2 className="display-2 max-w-[22ch] text-balance">
              Every developer on the Dubai register.
            </h2>
            <p className="body-text mt-6 max-w-measure text-muted-foreground">
              Straight from Dubai Land Department open data, so you can check that whoever is
              selling you a plan is registered to. Our own view on how each one delivers is being
              written; the record is here now.
            </p>
          </Reveal>

          <ul className="mt-12 list-none border-t border-border p-0">
            {registered.slice(0, 12).map((record, index) => (
              <Reveal key={record.source_key ?? record.name_en} delay={stagger(index)}>
                <li className="border-b border-border">
                  <Link
                    to="/directory/developers"
                    search={{ q: record.name_en ?? "", page: 1 }}
                    className="focus-ring group grid items-baseline gap-x-6 gap-y-2 py-6 transition-[padding-inline-start] duration-quick ease-editorial hover:ps-3 md:grid-cols-12"
                  >
                    <span className="display-3 md:col-span-7">{record.name_en ?? "Unnamed"}</span>
                    <span className="caption text-muted-foreground md:col-span-4">
                      Registered developer
                    </span>
                    <span className="eyebrow text-gold-ink transition-colors md:col-span-1 md:text-end">
                      Record
                    </span>
                  </Link>
                </li>
              </Reveal>
            ))}
          </ul>

          <Reveal>
            <Link
              to="/directory/developers"
              className="focus-ring eyebrow mt-10 inline-flex items-center gap-2 border-b border-green-mid pb-1 text-green-mid transition-colors hover:text-gold-ink"
            >
              Search the full register
              <span aria-hidden className="rtl:-scale-x-100">
                &rarr;
              </span>
            </Link>
          </Reveal>
        </Section>
      ) : null}
    </>
  );
}
