/**
 * Row shapes for the DLX tables.
 *
 * Hand-written to mirror `supabase/migrations/`, because
 * `src/integrations/supabase/types.ts` is generated from the *live* project and
 * the migrations have not been pushed there yet. Once they are, regenerate that
 * file (`npx supabase gen types typescript --linked`) and these can be replaced
 * by the generated `Tables<"properties">` helpers, the field names deliberately
 * match one-for-one so the swap is mechanical.
 *
 * Keep this file in step with the migrations. If a column is added there and
 * not here, the query modules will simply not surface it.
 */

/**
 * A value that survives the trip from the server to the browser.
 *
 * Used for the free-form JSON columns. `unknown` would be more permissive but
 * the server-function boundary rejects it, and rightly: anything crossing that
 * boundary has to be serializable.
 */
export type JsonValue =
  string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
export type JsonObject = { [key: string]: JsonValue };

export type LeadTemperature = "hot" | "warm" | "cold";

export type LeadSourceType =
  | "contact_form"
  | "valuation_form"
  | "listing_enquiry"
  | "guide_download"
  | "calculator"
  | "market_report"
  | "ai_chat"
  | "voice_call"
  | "whatsapp"
  | "referral"
  | "other";

export type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "viewing_booked"
  | "negotiating"
  | "won"
  | "lost"
  | "unqualified";

export type LeadTimeline = "immediately" | "within_3_months" | "within_12_months" | "researching";

export type LeadIntent = "buy" | "sell" | "rent" | "invest" | "relocate" | "advice";

export type ListingType = "sale" | "rent";

export type PropertyType =
  "apartment" | "villa" | "townhouse" | "penthouse" | "duplex" | "plot" | "office" | "retail";

export type PropertyStatus = "available" | "under_offer" | "sold" | "let" | "off_market";

export type Furnishing = "unfurnished" | "semi_furnished" | "furnished";

export type ProjectStatus = "announced" | "under_construction" | "completed" | "sold_out";

export type ContentCategory =
  | "buying"
  | "selling"
  | "investment"
  | "golden_visa"
  | "relocation"
  | "market"
  | "area_guide"
  | "legal_and_tax";

export type AppRole = "admin" | "agent";

export type Area = {
  id: string;
  slug: string;
  name: string;
  name_ar: string | null;
  parent_area_id: string | null;
  summary: string | null;
  description: string | null;
  hero_image_url: string | null;
  latitude: number | null;
  longitude: number | null;
  dld_area_name: string | null;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Developer = {
  id: string;
  slug: string;
  name: string;
  name_ar: string | null;
  logo_url: string | null;
  summary: string | null;
  description: string | null;
  website_url: string | null;
  founded_year: number | null;
  is_partner: boolean;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Agent = {
  id: string;
  slug: string;
  auth_user_id: string | null;
  full_name: string;
  job_title: string | null;
  bio: string | null;
  photo_url: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  /** RERA Broker Registration Number. */
  brn: string | null;
  languages: string[];
  specialities: string[];
  linkedin_url: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Project = {
  id: string;
  slug: string;
  name: string;
  name_ar: string | null;
  developer_id: string | null;
  area_id: string | null;
  status: ProjectStatus;
  summary: string | null;
  description: string | null;
  hero_image_url: string | null;
  image_urls: string[];
  starting_price: number | null;
  currency: string;
  unit_types: PropertyType[];
  bedrooms_min: number | null;
  bedrooms_max: number | null;
  handover_quarter: number | null;
  handover_year: number | null;
  payment_plan: string | null;
  amenities: string[];
  brochure_url: string | null;
  floor_plan_url: string | null;
  is_featured: boolean;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Property = {
  id: string;
  slug: string;
  reference: string | null;
  title: string;
  title_ar: string | null;
  summary: string | null;
  description: string | null;
  listing_type: ListingType;
  property_type: PropertyType;
  status: PropertyStatus;
  area_id: string | null;
  developer_id: string | null;
  project_id: string | null;
  agent_id: string | null;
  /** Null means price on application, never render it as zero. */
  price: number | null;
  currency: string;
  rent_frequency: "yearly" | "monthly" | "weekly" | "daily" | null;
  service_charge_per_sqft: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  built_up_sqft: number | null;
  plot_sqft: number | null;
  floor: string | null;
  furnishing: Furnishing | null;
  view: string | null;
  completion_status: "ready" | "off_plan" | null;
  handover_year: number | null;
  amenities: string[];
  hero_image_url: string | null;
  image_urls: string[];
  floor_plan_url: string | null;
  brochure_url: string | null;
  latitude: number | null;
  longitude: number | null;
  /** Dubai law requires a DLD permit number on every advertised listing. */
  dld_permit_number: string | null;
  is_featured: boolean;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

/** A listing with the related records the detail and card views need. */
export type PropertyWithRelations = Property & {
  area: Pick<Area, "id" | "slug" | "name"> | null;
  developer: Pick<Developer, "id" | "slug" | "name" | "logo_url"> | null;
  project: Pick<Project, "id" | "slug" | "name"> | null;
  agent: Pick<
    Agent,
    "id" | "slug" | "full_name" | "job_title" | "photo_url" | "email" | "phone" | "whatsapp" | "brn"
  > | null;
};

export type Testimonial = {
  id: string;
  author_name: string;
  author_location: string | null;
  author_photo_url: string | null;
  quote: string;
  rating: number | null;
  source: string | null;
  source_url: string | null;
  agent_id: string | null;
  property_id: string | null;
  display_order: number;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  title_ar: string | null;
  excerpt: string | null;
  body: string | null;
  category: ContentCategory;
  hero_image_url: string | null;
  reading_minutes: number | null;
  author_agent_id: string | null;
  tags: string[];
  seo_title: string | null;
  seo_description: string | null;
  og_image_url: string | null;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Lead = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  country_code: string | null;
  preferred_language: string;
  preferred_contact: "email" | "phone" | "whatsapp" | null;
  intent: LeadIntent | null;
  timeline: LeadTimeline | null;
  budget_min: number | null;
  budget_max: number | null;
  budget_currency: string;
  property_types: PropertyType[];
  bedrooms_min: number | null;
  area_ids: string[];
  is_financing: boolean | null;
  is_first_purchase: boolean | null;
  qualification_answers: JsonObject;
  message: string | null;
  temperature: LeadTemperature;
  score: number;
  status: LeadStatus;
  assigned_agent_id: string | null;
  source_type: LeadSourceType;
  source_detail: string | null;
  property_id: string | null;
  guide_id: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  referrer_url: string | null;
  landing_page_url: string | null;
  page_path: string | null;
  fbclid: string | null;
  gclid: string | null;
  user_agent: string | null;
  marketing_consent: boolean;
  consent_at: string | null;
  admin_notified_at: string | null;
  client_confirmed_at: string | null;
  internal_notes: string | null;
  raw_payload: JsonObject;
  created_at: string;
  updated_at: string;
};

export type LeadNote = {
  id: string;
  lead_id: string;
  author_id: string | null;
  body: string;
  created_at: string;
};
