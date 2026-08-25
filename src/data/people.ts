/** Consultants and client testimonials. */
import { db } from "./database";
import { withFallback } from "./resilience";
import type { Agent, Testimonial } from "./types";

export async function listAgents(): Promise<Agent[]> {
  return withFallback(() => runListAgents(), [], "listAgents");
}

async function runListAgents(): Promise<Agent[]> {
  const { data, error } = await db
    .from("agents")
    .select("*")
    .order("display_order")
    .order("full_name")
    .returns<Agent[]>();
  if (error) throw error;
  return data ?? [];
}

export async function getAgent(slug: string): Promise<Agent | null> {
  const { data, error } = await db.from("agents").select("*").eq("slug", slug).maybeSingle<Agent>();
  if (error) throw error;
  return data;
}

/**
 * Client testimonials, and the rule that governs them.
 *
 * Only reviews a reader can go and check are published. That means three things
 * together: the row is published, it names where the review came from, and it
 * carries a link to it. A quote with a first name and a city attached is what
 * every brokerage in Dubai already has on its homepage, and it persuades nobody
 *, because anyone can type one. A quote that says "Google review" and opens
 * the review is evidence.
 *
 * This also keeps the site the right side of a real line. Review schema tells a
 * search engine these are genuine reviews of this business; emitting it for
 * copy someone wrote in-house is the fabrication CLAUDE.md forbids and is what
 * gets rich results revoked. Gating both the block and the schema on the same
 * predicate means the two cannot drift.
 *
 * The consequence is that the block renders nothing until the review engine has
 * actually run and reviews have been imported, which is the correct behaviour
 * before launch, not a bug. `npm run preflight` reports it.
 */
export async function listTestimonials(limit?: number): Promise<Testimonial[]> {
  return withFallback(() => runListTestimonials(limit), [], "listTestimonials");
}

/** True when a reader could go and verify this review themselves. */
export function isVerifiedReview(testimonial: Testimonial): boolean {
  return (
    testimonial.is_published === true &&
    typeof testimonial.source === "string" &&
    testimonial.source.trim().length > 0 &&
    typeof testimonial.source_url === "string" &&
    /^https:\/\//i.test(testimonial.source_url)
  );
}

async function runListTestimonials(limit?: number): Promise<Testimonial[]> {
  /*
   * `is_published` is filtered here as well as by row-level security. RLS is
   * the guarantee; this is the statement of intent, and it means a future
   * caller holding a service-role client cannot accidentally publish drafts.
   */
  let query = db
    .from("testimonials")
    .select("*")
    .eq("is_published", true)
    .not("source", "is", null)
    .not("source_url", "is", null)
    .order("display_order");
  if (limit) query = query.limit(limit);
  const { data, error } = await query.returns<Testimonial[]>();
  if (error) throw error;

  /* The database filters what it can express; this filters what it cannot,
   * an empty string is not null, and a source_url that is not a link is not a
   * link. */
  return (data ?? []).filter(isVerifiedReview);
}

/**
 * Every published testimonial, verified or not, for the admin only.
 *
 * The desk needs to see the ones that are being withheld and why, or the
 * absence of a review block on the live site looks like a bug rather than a
 * standard being applied.
 */
export async function listAllTestimonials(): Promise<Testimonial[]> {
  return withFallback(
    async () => {
      const { data, error } = await db
        .from("testimonials")
        .select("*")
        .order("display_order")
        .returns<Testimonial[]>();
      if (error) throw error;
      return data ?? [];
    },
    [],
    "listAllTestimonials",
  );
}
