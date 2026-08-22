/**
 * The shape of the content editor, shared by the browser and the server.
 *
 * The server module `content.server.ts` imports this as its write allow-list,
 * and the admin UI imports it to render the forms — one definition, so a field
 * the editor shows is exactly a field the server will accept, and nothing else
 * can be written.
 */

export type ContentTable =
  "properties" | "developers" | "projects" | "agents" | "testimonials" | "blog_posts";

export type FieldKind =
  "text" | "textarea" | "number" | "boolean" | "select" | "list" | "url" | "date";

export type FieldSpec = {
  name: string;
  label: string;
  kind: FieldKind;
  /** Shown as a column in the table view. */
  inList?: boolean;
  required?: boolean;
  options?: readonly string[];
  help?: string;
};

export const CONTENT_TABLES: readonly ContentTable[] = [
  "properties",
  "developers",
  "projects",
  "agents",
  "testimonials",
  "blog_posts",
];

const LISTING_TYPES = ["sale", "rent"] as const;
const PROPERTY_TYPES = [
  "apartment",
  "villa",
  "townhouse",
  "penthouse",
  "duplex",
  "plot",
  "office",
  "retail",
] as const;
const PROPERTY_STATUSES = ["available", "under_offer", "sold", "let", "off_market"] as const;
const PROJECT_STATUSES = ["announced", "under_construction", "completed", "sold_out"] as const;
const CONTENT_CATEGORIES = [
  "buying",
  "selling",
  "investment",
  "golden_visa",
  "relocation",
  "market",
  "area_guide",
  "legal_and_tax",
] as const;

export const CONTENT_SCHEMA: Record<ContentTable, { label: string; fields: FieldSpec[] }> = {
  properties: {
    label: "Properties",
    fields: [
      { name: "title", label: "Title", kind: "text", required: true, inList: true },
      { name: "slug", label: "Slug", kind: "text", required: true, help: "Used in the URL." },
      { name: "reference", label: "Reference", kind: "text", inList: true },
      {
        name: "listing_type",
        label: "For",
        kind: "select",
        options: LISTING_TYPES,
        required: true,
        inList: true,
      },
      {
        name: "property_type",
        label: "Type",
        kind: "select",
        options: PROPERTY_TYPES,
        required: true,
      },
      { name: "status", label: "Status", kind: "select", options: PROPERTY_STATUSES, inList: true },
      {
        name: "price",
        label: "Price",
        kind: "number",
        inList: true,
        help: "Leave empty for price on application.",
      },
      { name: "currency", label: "Currency", kind: "text" },
      { name: "bedrooms", label: "Bedrooms", kind: "number" },
      { name: "bathrooms", label: "Bathrooms", kind: "number" },
      { name: "built_up_sqft", label: "Built-up (sq ft)", kind: "number" },
      { name: "plot_sqft", label: "Plot (sq ft)", kind: "number" },
      { name: "summary", label: "Summary", kind: "textarea" },
      { name: "description", label: "Description", kind: "textarea" },
      { name: "amenities", label: "Amenities", kind: "list", help: "One per line." },
      { name: "hero_image_url", label: "Hero image URL", kind: "url" },
      { name: "image_urls", label: "Gallery image URLs", kind: "list", help: "One per line." },
      { name: "floor_plan_url", label: "Floor plan URL", kind: "url" },
      { name: "brochure_url", label: "Brochure URL", kind: "url" },
      { name: "latitude", label: "Latitude", kind: "number" },
      { name: "longitude", label: "Longitude", kind: "number" },
      {
        name: "dld_permit_number",
        label: "DLD permit number",
        kind: "text",
        help: "Required by law on advertised listings.",
      },
      { name: "is_featured", label: "Featured", kind: "boolean" },
      { name: "is_published", label: "Published", kind: "boolean", inList: true },
    ],
  },
  developers: {
    label: "Developers",
    fields: [
      { name: "name", label: "Name", kind: "text", required: true, inList: true },
      { name: "slug", label: "Slug", kind: "text", required: true },
      { name: "summary", label: "Summary", kind: "textarea", inList: true },
      { name: "description", label: "Description", kind: "textarea" },
      { name: "logo_url", label: "Logo URL", kind: "url" },
      { name: "website_url", label: "Website", kind: "url" },
      { name: "founded_year", label: "Founded", kind: "number" },
      { name: "is_partner", label: "Partner", kind: "boolean", inList: true },
      { name: "is_published", label: "Published", kind: "boolean", inList: true },
    ],
  },
  projects: {
    label: "Projects",
    fields: [
      { name: "name", label: "Name", kind: "text", required: true, inList: true },
      { name: "slug", label: "Slug", kind: "text", required: true },
      { name: "status", label: "Status", kind: "select", options: PROJECT_STATUSES, inList: true },
      { name: "summary", label: "Summary", kind: "textarea" },
      { name: "description", label: "Description", kind: "textarea" },
      { name: "starting_price", label: "From", kind: "number", inList: true },
      { name: "currency", label: "Currency", kind: "text" },
      { name: "bedrooms_min", label: "Bedrooms from", kind: "number" },
      { name: "bedrooms_max", label: "Bedrooms to", kind: "number" },
      { name: "handover_quarter", label: "Handover quarter", kind: "number", help: "1–4." },
      { name: "handover_year", label: "Handover year", kind: "number", inList: true },
      { name: "payment_plan", label: "Payment plan", kind: "textarea" },
      { name: "amenities", label: "Amenities", kind: "list", help: "One per line." },
      { name: "hero_image_url", label: "Hero image URL", kind: "url" },
      { name: "image_urls", label: "Gallery image URLs", kind: "list", help: "One per line." },
      { name: "brochure_url", label: "Brochure URL", kind: "url" },
      { name: "floor_plan_url", label: "Floor plans URL", kind: "url" },
      { name: "is_featured", label: "Featured", kind: "boolean" },
      { name: "is_published", label: "Published", kind: "boolean", inList: true },
    ],
  },
  agents: {
    label: "Team",
    fields: [
      { name: "full_name", label: "Name", kind: "text", required: true, inList: true },
      { name: "slug", label: "Slug", kind: "text", required: true },
      { name: "job_title", label: "Title", kind: "text", inList: true },
      { name: "brn", label: "RERA BRN", kind: "text", inList: true },
      { name: "bio", label: "Bio", kind: "textarea" },
      { name: "photo_url", label: "Photo URL", kind: "url" },
      { name: "email", label: "Email", kind: "text" },
      { name: "phone", label: "Phone", kind: "text" },
      { name: "whatsapp", label: "WhatsApp", kind: "text" },
      { name: "languages", label: "Languages", kind: "list", help: "One per line." },
      { name: "specialities", label: "Specialities", kind: "list", help: "One per line." },
      { name: "linkedin_url", label: "LinkedIn", kind: "url" },
      { name: "display_order", label: "Order", kind: "number" },
      { name: "is_active", label: "Active", kind: "boolean", inList: true },
    ],
  },
  testimonials: {
    label: "Testimonials",
    fields: [
      { name: "author_name", label: "Client", kind: "text", required: true, inList: true },
      { name: "author_location", label: "Location", kind: "text", inList: true },
      { name: "quote", label: "Quote", kind: "textarea", required: true },
      { name: "rating", label: "Rating", kind: "number", help: "1–5." },
      { name: "source", label: "Source", kind: "text" },
      { name: "source_url", label: "Source URL", kind: "url" },
      { name: "display_order", label: "Order", kind: "number" },
      { name: "is_published", label: "Published", kind: "boolean", inList: true },
    ],
  },
  blog_posts: {
    label: "Journal",
    fields: [
      { name: "title", label: "Title", kind: "text", required: true, inList: true },
      { name: "slug", label: "Slug", kind: "text", required: true, help: "Used in the URL." },
      {
        name: "category",
        label: "Category",
        kind: "select",
        options: CONTENT_CATEGORIES,
        required: true,
        inList: true,
      },
      {
        name: "excerpt",
        label: "Excerpt",
        kind: "textarea",
        help: "One or two sentences. Doubles as the meta description and the social preview line, so write it for a stranger.",
      },
      {
        name: "body",
        label: "Body",
        kind: "textarea",
        help: "Markdown subset: ## heading, ### sub-heading, - list, > quote, **bold**, [text](/path).",
      },
      { name: "hero_image_url", label: "Hero image", kind: "url" },
      {
        name: "reading_minutes",
        label: "Reading time",
        kind: "number",
        help: "Leave blank to estimate it from the body.",
      },
      { name: "tags", label: "Tags", kind: "list" },
      {
        name: "seo_title",
        label: "SEO title",
        kind: "text",
        help: "Overrides the title in search and social. Leave blank to use the title.",
      },
      { name: "seo_description", label: "SEO description", kind: "textarea" },
      { name: "og_image_url", label: "Social image", kind: "url", help: "1200×630." },
      { name: "published_at", label: "Published on", kind: "date", inList: true },
      { name: "is_published", label: "Published", kind: "boolean", inList: true },
    ],
  },
};
