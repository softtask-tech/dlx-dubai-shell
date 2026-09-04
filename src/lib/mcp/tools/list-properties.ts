import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

import { listProperties } from "@/data/properties";

/** A compact card, so an assistant is not handed 60 columns per listing. */
function card(p: Awaited<ReturnType<typeof listProperties>>[number]) {
  return {
    slug: p.slug,
    title: p.title,
    listing_type: p.listing_type,
    property_type: p.property_type,
    status: p.status,
    price: p.price,
    currency: p.currency,
    rent_frequency: p.rent_frequency,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    built_up_sqft: p.built_up_sqft,
    completion_status: p.completion_status,
    handover_year: p.handover_year,
    area: p.area?.name ?? null,
    area_slug: p.area?.slug ?? null,
    developer: p.developer?.name ?? null,
    summary: p.summary,
  };
}

export default defineTool({
  name: "list_properties",
  title: "List properties",
  description:
    "Search DLX Properties' published Dubai listings by listing type, property type, community, price range, bedrooms and completion status.",
  inputSchema: {
    listing_type: z.enum(["sale", "rent"]).optional().describe("Sale or rental listings."),
    property_type: z
      .enum(["apartment", "villa", "townhouse", "penthouse", "duplex", "plot", "office", "retail"])
      .optional(),
    area: z.string().optional().describe('Community slug, e.g. "palm-jumeirah".'),
    min_price: z.number().optional().describe("Minimum price in AED."),
    max_price: z.number().optional().describe("Maximum price in AED."),
    bedrooms: z.number().optional().describe("Minimum number of bedrooms."),
    off_plan: z.boolean().optional().describe("True for off-plan only, false for ready only."),
    sort: z.enum(["newest", "price_asc", "price_desc"]).optional(),
    limit: z.number().optional().describe("How many listings to return (default 12, max 50)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (input) => {
    const limit = Math.min(Math.max(Math.trunc(input.limit ?? 12), 1), 50);
    const rows = await listProperties({
      ...(input.listing_type ? { listingType: input.listing_type } : {}),
      ...(input.property_type ? { propertyType: input.property_type } : {}),
      ...(input.area ? { area: input.area } : {}),
      ...(input.min_price !== undefined ? { minPrice: input.min_price } : {}),
      ...(input.max_price !== undefined ? { maxPrice: input.max_price } : {}),
      ...(input.bedrooms !== undefined ? { bedrooms: input.bedrooms } : {}),
      ...(input.off_plan !== undefined ? { offPlan: input.off_plan } : {}),
      ...(input.sort ? { sort: input.sort } : {}),
      limit,
    });
    const listings = rows.map(card);
    return {
      content: [
        { type: "text" as const, text: JSON.stringify({ count: listings.length, listings }, null, 2) },
      ],
      structuredContent: { count: listings.length, listings },
    };
  },
});
