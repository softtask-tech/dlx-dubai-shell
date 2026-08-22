import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";

import {
  activeBlogCategories,
  BLOG_CATEGORY_LABELS,
  listPosts,
  readingMinutesFor,
} from "@/data/blog";
import type { ContentCategory } from "@/data/types";
import { formatMonth } from "@/lib/format";
import { pageHead } from "@/lib/seo";
import { stagger } from "@/lib/motion";
import { Reveal } from "@/components/site/reveal";
import { TrustStrip } from "@/components/site/trust-strip";
import { Section, Eyebrow } from "@/components/ui/section";
import { Tag } from "@/components/ui/tag";

const CATEGORIES = [
  "buying",
  "selling",
  "investment",
  "golden_visa",
  "relocation",
  "market",
  "area_guide",
  "legal_and_tax",
] as const satisfies readonly ContentCategory[];

/**
 * The category filter lives in the URL, so a filtered journal is shareable,
 * survives a refresh and is server-rendered — a crawler sees real posts rather
 * than an empty shell waiting for JavaScript.
 */
const searchSchema = z.object({ category: z.enum(CATEGORIES).optional() });

/* The router sets its own `aria-current` on an active link, and every chip here
 * points at the same route — so the selected state rides on a data attribute we
 * own rather than one the router will overwrite. */
const CHIP =
  "eyebrow border border-border px-4 py-2.5 transition-colors hover:border-accent " +
  "data-[selected=true]:border-foreground data-[selected=true]:bg-foreground " +
  "data-[selected=true]:text-background";

export const Route = createFileRoute("/blog/")({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    /* The filtered view drives the list; the unfiltered one tells the filter bar
     * which categories have anything in them, so we never offer an empty tab. */
    const [posts, all] = await Promise.all([
      listPosts(deps.category ? { category: deps.category } : {}),
      listPosts(),
    ]);
    return { posts, categories: activeBlogCategories(all) };
  },
  /* Filtered views are the same posts in a different order, so the canonical
   * stays on /blog — which is what passing the bare path here does. */
  head: () => pageHead({ path: "/blog", breadcrumbs: [{ name: "Journal", path: "/blog" }] }),
  component: BlogIndex,
});

function BlogIndex() {
  const { posts, categories } = Route.useLoaderData();
  const search = Route.useSearch();
  const [lead, ...rest] = posts;

  return (
    <>
      <Section className="pt-44 pb-16 lg:pt-56">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Reveal>
              <Eyebrow>The journal</Eyebrow>
              <h1 className="display-1 mt-8">Notes from the desk</h1>
            </Reveal>
          </div>
          <div className="lg:col-span-4 lg:col-start-9">
            <Reveal delay={0.12}>
              <p className="body-text text-muted-foreground">
                What we are actually seeing — in buildings, in negotiations and in the registry —
                written as it happens rather than polished into a newsletter.
              </p>
              <div className="mt-10 h-px w-16 bg-accent" />
            </Reveal>
          </div>
        </div>
      </Section>

      {categories.length > 1 ? (
        <Section flush>
          <div className="mx-auto w-full max-w-shell px-6 md:px-10 lg:px-16">
            <Reveal>
              <nav aria-label="Filter by category" className="flex flex-wrap gap-2 pb-14">
                <Link
                  to="/blog"
                  search={{}}
                  className={CHIP}
                  data-selected={search.category ? undefined : "true"}
                >
                  All
                </Link>
                {categories.map((category) => (
                  <Link
                    key={category}
                    to="/blog"
                    search={{ category }}
                    className={CHIP}
                    data-selected={search.category === category ? "true" : undefined}
                  >
                    {BLOG_CATEGORY_LABELS[category]}
                  </Link>
                ))}
              </nav>
            </Reveal>
          </div>
        </Section>
      ) : null}

      {posts.length === 0 ? (
        <Section className="pt-0">
          <Reveal>
            <p className="lead max-w-measure text-muted-foreground">
              Nothing published here yet. The playbook is where the substance lives in the meantime
              —{" "}
              <Link to="/guides" className="link-underline">
                read the guides
              </Link>
              .
            </p>
          </Reveal>
        </Section>
      ) : null}

      {lead ? (
        <Section className="pt-0">
          <Reveal>
            <Link
              to="/blog/$slug"
              params={{ slug: lead.slug }}
              className="group block border-t border-border pt-12"
            >
              <div className="grid gap-10 lg:grid-cols-12">
                <div className="lg:col-span-7">
                  <div className="flex flex-wrap items-center gap-3">
                    <Tag variant="soft">{BLOG_CATEGORY_LABELS[lead.category]}</Tag>
                    {lead.published_at ? (
                      <Tag variant="bare">
                        <time dateTime={lead.published_at}>{formatMonth(lead.published_at)}</time>
                      </Tag>
                    ) : null}
                    <Tag variant="bare">{readingMinutesFor(lead)} min</Tag>
                  </div>
                  <h2 className="display-2 mt-8 transition-colors group-hover:text-accent">
                    {lead.title}
                  </h2>
                  {lead.excerpt ? (
                    <p className="lead mt-8 max-w-measure text-muted-foreground">{lead.excerpt}</p>
                  ) : null}
                  {lead.author ? (
                    <p className="caption mt-8">
                      {lead.author.full_name}
                      {lead.author.job_title ? ` · ${lead.author.job_title}` : null}
                    </p>
                  ) : null}
                </div>

                {lead.hero_image_url ? (
                  <div className="lg:col-span-4 lg:col-start-9">
                    <div className="aspect-[4/5] overflow-hidden bg-secondary">
                      <img
                        src={lead.hero_image_url}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-slower ease-editorial group-hover:scale-105"
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            </Link>
          </Reveal>
        </Section>
      ) : null}

      {rest.length > 0 ? (
        <Section className="pt-0">
          <div className="hairline" />
          {rest.map((post, index) => (
            <Reveal key={post.slug} delay={stagger(index)}>
              <Link
                to="/blog/$slug"
                params={{ slug: post.slug }}
                className="group grid gap-5 border-b border-border py-10 transition-colors hover:border-accent lg:grid-cols-12"
              >
                <div className="flex flex-wrap gap-3 lg:col-span-2">
                  <span className="eyebrow text-muted-foreground">
                    {post.published_at ? (
                      <time dateTime={post.published_at}>{formatMonth(post.published_at)}</time>
                    ) : (
                      "Draft"
                    )}
                  </span>
                </div>

                <div className="lg:col-span-5">
                  <h2 className="display-3 transition-colors group-hover:text-accent">
                    {post.title}
                  </h2>
                  <p className="caption mt-3 text-muted-foreground">
                    {BLOG_CATEGORY_LABELS[post.category]} · {readingMinutesFor(post)} min
                  </p>
                </div>

                {post.excerpt ? (
                  <p className="body-text text-muted-foreground lg:col-span-5">{post.excerpt}</p>
                ) : null}
              </Link>
            </Reveal>
          ))}
        </Section>
      ) : null}

      <TrustStrip className="pt-0" />
    </>
  );
}
