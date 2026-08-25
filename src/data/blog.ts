/**
 * The journal, blog posts, read from `blog_posts`.
 *
 * The playbook in `guides.ts` is held in code because it is the brokerage's
 * settled position and changes rarely. The journal is the opposite: it is
 * written by the team as things happen, so it lives in the database and is
 * edited through the admin content editor. Only published rows are ever
 * returned to the public site, the RLS policy enforces that too, but a query
 * that says what it means is easier to reason about than one that relies on it.
 */
import { db } from "./database";
import { withFallback } from "./resilience";
import type { Agent, BlogPost, ContentCategory } from "./types";

export type BlogPostWithAuthor = BlogPost & {
  author: Pick<Agent, "id" | "slug" | "full_name" | "job_title" | "photo_url"> | null;
};

const POST_SELECT = `
  *,
  author:agents (id, slug, full_name, job_title, photo_url)
`;

export const BLOG_CATEGORY_LABELS: Record<ContentCategory, string> = {
  buying: "Buying",
  selling: "Selling",
  investment: "Investment",
  golden_visa: "Golden Visa",
  relocation: "Relocation",
  market: "Market",
  area_guide: "Communities",
  legal_and_tax: "Legal & tax",
};

export type ListPostsOptions = {
  category?: ContentCategory;
  limit?: number;
  /** Excluded from the result, used for "read next" rails. */
  excludeSlug?: string;
};

export async function listPosts(options: ListPostsOptions = {}): Promise<BlogPostWithAuthor[]> {
  return withFallback(() => runListPosts(options), [], "listPosts");
}

async function runListPosts(options: ListPostsOptions): Promise<BlogPostWithAuthor[]> {
  let query = db
    .from("blog_posts")
    .select(POST_SELECT)
    .eq("is_published", true)
    .order("published_at", { ascending: false, nullsFirst: false });

  if (options.category) query = query.eq("category", options.category);
  if (options.excludeSlug) query = query.neq("slug", options.excludeSlug);
  if (options.limit) query = query.limit(options.limit);

  const { data, error } = await query;
  if (error) throw error;

  /* PostgREST embeds cannot be inferred without relationship metadata in the
   * generated types, so the embedded author is shaped here rather than typed
   * through the client. */
  return (data ?? []) as unknown as BlogPostWithAuthor[];
}

export async function getPost(slug: string): Promise<BlogPostWithAuthor | null> {
  return withFallback(() => runGetPost(slug), null, "getPost");
}

async function runGetPost(slug: string): Promise<BlogPostWithAuthor | null> {
  const { data, error } = await db
    .from("blog_posts")
    .select(POST_SELECT)
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as unknown as BlogPostWithAuthor | null;
}

/** Published slugs, for the sitemap. */
export async function listPostSlugs(): Promise<string[]> {
  return withFallback(() => runListPostSlugs(), [], "listPostSlugs");
}

async function runListPostSlugs(): Promise<string[]> {
  const { data, error } = await db
    .from("blog_posts")
    .select("slug")
    .eq("is_published", true)
    .returns<Array<{ slug: string }>>();
  if (error) throw error;
  return (data ?? []).map((row) => row.slug);
}

/**
 * Posts worth reading next: same category first, topped up from the rest.
 *
 * Two queries rather than one clever one, because the fallback behaviour is
 * then obvious, if either fails the rail simply shows fewer posts.
 */
export async function relatedPosts(post: BlogPost, limit = 3): Promise<BlogPostWithAuthor[]> {
  const sameCategory = await listPosts({
    category: post.category,
    excludeSlug: post.slug,
    limit,
  });
  if (sameCategory.length >= limit) return sameCategory;

  const seen = new Set(sameCategory.map((entry) => entry.slug));
  const rest = await listPosts({ excludeSlug: post.slug, limit: limit * 2 });
  return [...sameCategory, ...rest.filter((entry) => !seen.has(entry.slug))].slice(0, limit);
}

/** Categories that actually have published posts, in the order they appear. */
export function activeBlogCategories(posts: readonly BlogPost[]): ContentCategory[] {
  const order: ContentCategory[] = [
    "market",
    "investment",
    "buying",
    "selling",
    "golden_visa",
    "relocation",
    "area_guide",
    "legal_and_tax",
  ];
  return order.filter((category) => posts.some((post) => post.category === category));
}

/**
 * Roughly how long a post takes to read, when the editor did not say.
 *
 * 200 words a minute, rounded up, floor of one, the convention every
 * publication uses. Shown as an estimate, never as a promise.
 */
export function readingMinutesFor(post: BlogPost): number {
  if (post.reading_minutes && post.reading_minutes > 0) return post.reading_minutes;
  const words = (post.body ?? "").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}
