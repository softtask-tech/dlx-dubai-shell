import { createFileRoute, notFound, Link } from "@tanstack/react-router";

import { BLOG_CATEGORY_LABELS, getPost, readingMinutesFor, relatedPosts } from "@/data/blog";
import { GUIDES } from "@/data/guides";
import { site } from "@/config/site";
import { formatMonth } from "@/lib/format";
import { articleSchema } from "@/lib/schema";
import { pageHead } from "@/lib/seo";
import { stagger } from "@/lib/motion";
import { PostBody } from "@/components/blog/post-body";
import { QualifiedForm } from "@/components/forms/qualified-form";
import { Reveal } from "@/components/site/reveal";
import { Section, Eyebrow } from "@/components/ui/section";
import { Tag } from "@/components/ui/tag";

/**
 * A journal post.
 *
 * Unlike a guide, the copy here is written by the team in the admin editor, so
 * this template's job is to make whatever they write read well and carry honest
 * metadata: a real author, a real date, and Article JSON-LD built from the
 * post's own fields rather than site-wide defaults. The excerpt doubles as the
 * meta description and the article description, so the summary a reader sees is
 * the summary a crawler gets.
 */
export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params }) => {
    const post = await getPost(params.slug);
    if (!post) throw notFound();

    const related = await relatedPosts(post);
    return { post, related };
  },
  head: ({ loaderData }) => {
    const post = loaderData?.post;
    if (!post) return {};

    const path = `/blog/${post.slug}`;
    /* Every post needs its own description. The editor's SEO field wins, then
     * the excerpt; the fallback is built from the post's own title rather than
     * a site-wide default, because a shared description across posts is exactly
     * what the SEO rules forbid. */
    const description =
      post.seo_description ??
      post.excerpt ??
      `${post.title}, a note from the DLX Properties desk on the Dubai market.`;

    return pageHead({
      path,
      title: post.seo_title ?? post.title,
      description,
      tagline: post.excerpt ?? post.title,
      image: post.og_image_url ?? post.hero_image_url ?? "/og/blog.png",
      type: "article",
      breadcrumbs: [
        { name: "Journal", path: "/blog" },
        { name: post.title, path },
      ],
      schema: [
        articleSchema({
          headline: post.title,
          description,
          path,
          image: post.og_image_url ?? post.hero_image_url ?? "/og/blog.png",
          datePublished: post.published_at ?? post.created_at,
          dateModified: post.updated_at,
          ...(post.author ? { author: post.author.full_name } : {}),
        }),
      ],
    });
  },
  component: PostPage,
});

function PostPage() {
  const { post, related } = Route.useLoaderData();
  const published = post.published_at ?? post.created_at;

  /* The journal is the news and the playbook is the reference, so a post should
   * always offer the reference. Prefer the guide the author actually linked to
   * in the body. That is a human judgement about relevance, and it beats the
   * category match, which is only a fallback for a post that linked to none. */
  const guide =
    GUIDES.find((entry) => (post.body ?? "").includes(`/guides/${entry.slug}`)) ??
    GUIDES.find((entry) => entry.category === post.category);

  return (
    <article>
      {/*
       * A masthead, not a blog header.
       *
       * This opened as white-on-white: a headline in an eight-column block
       * with an author card floating beside it, which is the shape every blog
       * on the internet has. Nothing anchored the top of the page, so an
       * article read as a document someone had pasted in.
       *
       * A cream plate fixes it structurally rather than decoratively. The
       * head of the piece now sits on its own ground, the body sits on paper
       * beneath it, and the change of surface is what tells a reader the
       * article has started. The byline is a line of type under the headline
       * where a magazine puts it, not a card competing with it.
       */}
      <Section data-surface="cream" className="pt-14 pb-14 md:pt-20 md:pb-16">
        <div className="max-w-4xl">
          <Reveal>
            <Tag variant="soft">{BLOG_CATEGORY_LABELS[post.category]}</Tag>
            <h1 className="display-1 mt-7 text-balance">{post.title}</h1>
          </Reveal>

          {post.excerpt ? (
            <Reveal delay={0.08}>
              {/* The standfirst carries the piece, so it is set in ink at lead
                  size rather than in the grey used for captions. */}
              <p className="lead mt-8 max-w-measure text-foreground">{post.excerpt}</p>
            </Reveal>
          ) : null}

          <Reveal delay={0.14}>
            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-border pt-6">
              {post.author ? (
                <Link
                  to="/team"
                  className="focus-ring group flex items-center gap-4 transition-colors hover:text-gold-ink"
                >
                  {post.author.photo_url ? (
                    <img
                      src={post.author.photo_url}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="size-11 shrink-0 object-cover"
                    />
                  ) : null}
                  <span>
                    <span className="caption block text-foreground">
                      {post.author.full_name}
                    </span>
                    {post.author.job_title ? (
                      <span className="caption block text-muted-foreground">
                        {post.author.job_title}
                      </span>
                    ) : null}
                  </span>
                </Link>
              ) : null}

              <p className="caption ms-auto text-muted-foreground">
                <time dateTime={published}>{formatMonth(published)}</time>, {readingMinutesFor(post)}{" "}
                minutes
              </p>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* Full bleed, so the plate separates the cream masthead from the white
          the article is set on. Inside the container it read as a third block
          of white with a picture in it. */}
      {post.hero_image_url ? (
        <Section flush bleed>
          <Reveal>
            <div className="aspect-[16/7] w-full overflow-hidden bg-secondary">
              <img
                src={post.hero_image_url}
                alt=""
                className="h-full w-full object-cover"
                fetchPriority="high"
              />
            </div>
          </Reveal>
        </Section>
      ) : null}

      <Section className="pt-16 md:pt-20">
        <div className="grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-8 lg:col-start-3">
            <Reveal>{post.body ? <PostBody body={post.body} /> : null}</Reveal>

            {post.tags.length > 0 ? (
              <Reveal className="mt-16 flex flex-wrap gap-2 border-t border-border pt-8">
                {post.tags.map((tag) => (
                  <Tag key={tag} variant="outline">
                    {tag}
                  </Tag>
                ))}
              </Reveal>
            ) : null}

            {guide ? (
              <Reveal className="mt-12">
                <Link
                  to="/guides/$slug"
                  params={{ slug: guide.slug }}
                  className="group flex items-baseline justify-between gap-8 border-t border-border py-6 transition-colors hover:border-accent"
                >
                  <span>
                    <span className="eyebrow block text-muted-foreground">The reference</span>
                    <span className="lead mt-2 block transition-colors group-hover:text-accent">
                      {guide.title}
                    </span>
                  </span>
                  <span className="eyebrow shrink-0">Guide</span>
                </Link>
              </Reveal>
            ) : null}
          </div>
        </div>
      </Section>

      <Section className="bg-secondary">
        <div className="grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Reveal>
              <Eyebrow>Next step</Eyebrow>
              <h2 className="display-2 mt-6">Ask us what this means for you.</h2>
              <p className="body-text mt-8 max-w-measure text-muted-foreground">
                {site.shortName} consultants read the market for a living. Tell us what you own or
                what you are considering, and we will tell you how this actually lands.
              </p>
            </Reveal>
          </div>
          <div className="lg:col-span-7 lg:col-start-6">
            <Reveal delay={0.1}>
              <QualifiedForm
                sourceType="contact_form"
                sourceDetail={`blog-${post.slug}`}
                title="Start a conversation"
                description="No obligation, and no mailing list you did not ask for."
              />
            </Reveal>
          </div>
        </div>
      </Section>

      {related.length > 0 ? (
        <Section>
          <Reveal>
            <Eyebrow>Read next</Eyebrow>
          </Reveal>
          <div className="mt-10 grid gap-px bg-border md:grid-cols-3">
            {related.map((other, index) => (
              <Reveal key={other.slug} delay={stagger(index)} className="bg-background">
                <Link
                  to="/blog/$slug"
                  params={{ slug: other.slug }}
                  className="group flex h-full flex-col justify-between gap-10 p-8 transition-colors hover:bg-secondary"
                >
                  <div>
                    <span className="eyebrow text-muted-foreground">
                      {BLOG_CATEGORY_LABELS[other.category]}
                    </span>
                    <h3 className="display-3 mt-4 transition-colors group-hover:text-accent">
                      {other.title}
                    </h3>
                  </div>
                  {other.excerpt ? (
                    <span className="caption text-muted-foreground">{other.excerpt}</span>
                  ) : null}
                </Link>
              </Reveal>
            ))}
          </div>
        </Section>
      ) : null}
    </article>
  );
}
