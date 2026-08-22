/**
 * Listing queries.
 *
 * These run inside route loaders, which means they execute on the server during
 * SSR and in the browser on client navigation. Both paths use the publishable
 * key, so row-level security decides what comes back: unpublished listings are
 * invisible to the public without a single `is_published` check in this file.
 */
import { db } from "./database";
import { withFallback } from "./resilience";
import type { ListingType, PropertyType, PropertyWithRelations } from "./types";

/** Columns plus the related rows a card or detail page needs. */
const LISTING_SELECT = `
  *,
  area:areas (id, slug, name),
  developer:developers (id, slug, name, logo_url),
  project:projects (id, slug, name),
  agent:agents (id, slug, full_name, job_title, photo_url, email, phone, whatsapp, brn)
`;

export type PropertyFilters = {
  listingType?: ListingType;
  propertyType?: PropertyType;
  /** Community slug, e.g. "palm-jumeirah". */
  area?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  /** True for off-plan only, false for ready only, undefined for both. */
  offPlan?: boolean;
  sort?: PropertySort;
  limit?: number;
};

export type PropertySort = "newest" | "price_asc" | "price_desc";

/**
 * The portfolio index.
 *
 * Sorting by price puts nulls last on purpose: price-on-application listings
 * belong at the end of a price-ordered list, not pinned to the cheap end.
 */
export async function listProperties(
  filters: PropertyFilters = {},
): Promise<PropertyWithRelations[]> {
  return withFallback(() => runPropertyQuery(filters), [], "listProperties");
}

async function runPropertyQuery(filters: PropertyFilters): Promise<PropertyWithRelations[]> {
  let query = db.from("properties").select(LISTING_SELECT);

  if (filters.listingType) query = query.eq("listing_type", filters.listingType);
  if (filters.propertyType) query = query.eq("property_type", filters.propertyType);
  if (filters.minPrice !== undefined) query = query.gte("price", filters.minPrice);
  if (filters.maxPrice !== undefined) query = query.lte("price", filters.maxPrice);
  if (filters.bedrooms !== undefined) query = query.gte("bedrooms", filters.bedrooms);
  if (filters.offPlan !== undefined) {
    query = query.eq("completion_status", filters.offPlan ? "off_plan" : "ready");
  }
  /* Filtering on a joined column needs the embedded resource's path. */
  if (filters.area) query = query.eq("areas.slug", filters.area);

  switch (filters.sort) {
    case "price_asc":
      query = query.order("price", { ascending: true, nullsFirst: false });
      break;
    case "price_desc":
      query = query.order("price", { ascending: false, nullsFirst: false });
      break;
    default:
      query = query.order("is_featured", { ascending: false }).order("published_at", {
        ascending: false,
        nullsFirst: false,
      });
  }

  if (filters.limit) query = query.limit(filters.limit);

  const { data, error } = await query.returns<PropertyWithRelations[]>();
  if (error) throw error;
  return data ?? [];
}

/** A single listing by slug, or null when it does not exist or is not published. */
export async function getProperty(slug: string): Promise<PropertyWithRelations | null> {
  return withFallback(() => runGetProperty(slug), null, "getProperty");
}

async function runGetProperty(slug: string): Promise<PropertyWithRelations | null> {
  const { data, error } = await db
    .from("properties")
    .select(LISTING_SELECT)
    .eq("slug", slug)
    .maybeSingle<PropertyWithRelations>();

  if (error) throw error;
  return data;
}

/** Slugs for the sitemap. */
export async function listPropertySlugs(): Promise<string[]> {
  return withFallback(() => runListPropertySlugs(), [], "listPropertySlugs");
}

async function runListPropertySlugs(): Promise<string[]> {
  const { data, error } = await db.from("properties").select("slug").returns<{ slug: string }[]>();
  if (error) throw error;
  return (data ?? []).map((row) => row.slug);
}

/** More listings to show beneath one — same community first, then anything. */
export async function listRelatedProperties(
  property: PropertyWithRelations,
  limit = 3,
): Promise<PropertyWithRelations[]> {
  return withFallback(() => runListRelated(property, limit), [], "listRelatedProperties");
}

async function runListRelated(
  property: PropertyWithRelations,
  limit: number,
): Promise<PropertyWithRelations[]> {
  const query = db
    .from("properties")
    .select(LISTING_SELECT)
    .neq("id", property.id)
    .eq("listing_type", property.listing_type)
    .limit(limit);

  const { data, error } = await (
    property.area_id ? query.eq("area_id", property.area_id) : query
  ).returns<PropertyWithRelations[]>();

  if (error) throw error;
  if (data && data.length > 0) return data;

  /* Nothing else in that community — fall back to the newest listings. */
  const { data: fallback, error: fallbackError } = await db
    .from("properties")
    .select(LISTING_SELECT)
    .neq("id", property.id)
    .limit(limit)
    .returns<PropertyWithRelations[]>();

  if (fallbackError) throw fallbackError;
  return fallback ?? [];
}
