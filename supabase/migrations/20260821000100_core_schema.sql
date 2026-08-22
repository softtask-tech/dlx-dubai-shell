-- DLX Properties — core schema.
--
-- Nine tables in three groups:
--   Places and people  areas, developers, agents
--   Inventory          projects, properties
--   Content and demand guides, blog_posts, testimonials, leads
--
-- Conventions used throughout:
--   * uuid primary keys, so ids can be generated client-side before insert;
--   * timestamptz everywhere — Dubai is UTC+4 and clients are worldwide;
--   * `slug` on anything with a public URL, unique and indexed;
--   * `is_published` + `published_at` on public content, so drafts are the
--     default and row-level security has one predicate to filter on;
--   * prices in fils/cents-free integers is *not* used — Dubai prices are
--     quoted in whole dirhams, so numeric(14,2) keeps it exact without the
--     mental overhead of minor units.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enumerations
-- ---------------------------------------------------------------------------

-- How warm a lead is. Set by scoring rules, not by hand.
create type lead_temperature as enum ('hot', 'warm', 'cold');

-- Where a lead came in from. Every capture surface has an entry.
create type lead_source_type as enum (
  'contact_form',
  'valuation_form',
  'listing_enquiry',
  'guide_download',
  'calculator',
  'market_report',
  'ai_chat',
  'voice_call',
  'whatsapp',
  'referral',
  'other'
);

-- Where a lead has reached in the pipeline.
create type lead_status as enum (
  'new',
  'contacted',
  'qualified',
  'viewing_booked',
  'negotiating',
  'won',
  'lost',
  'unqualified'
);

-- How soon the client wants to transact.
create type lead_timeline as enum ('immediately', 'within_3_months', 'within_12_months', 'researching');

-- What the client is trying to do.
create type lead_intent as enum ('buy', 'sell', 'rent', 'invest', 'relocate', 'advice');

create type listing_type as enum ('sale', 'rent');

create type property_type as enum (
  'apartment',
  'villa',
  'townhouse',
  'penthouse',
  'duplex',
  'plot',
  'office',
  'retail'
);

create type property_status as enum ('available', 'under_offer', 'sold', 'let', 'off_market');

create type furnishing as enum ('unfurnished', 'semi_furnished', 'furnished');

create type project_status as enum ('announced', 'under_construction', 'completed', 'sold_out');

create type content_category as enum (
  'buying',
  'selling',
  'investment',
  'golden_visa',
  'relocation',
  'market',
  'area_guide',
  'legal_and_tax'
);

-- ---------------------------------------------------------------------------
-- Shared trigger: keep updated_at honest
-- ---------------------------------------------------------------------------

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- areas — Dubai communities and districts
-- ---------------------------------------------------------------------------

create table areas (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  name_ar text,
  -- Nested communities: Dubai Marina sits inside Dubai Marina district, and
  -- sub-communities hang off their parent.
  parent_area_id uuid references areas (id) on delete set null,
  summary text,
  description text,
  hero_image_url text,
  latitude numeric(9, 6),
  longitude numeric(9, 6),
  -- DLD publishes transactions against its own area names; keep the mapping so
  -- market data can be joined to the community page without fuzzy matching.
  dld_area_name text,
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index areas_parent_idx on areas (parent_area_id);
create index areas_published_idx on areas (is_published) where is_published;

-- ---------------------------------------------------------------------------
-- developers
-- ---------------------------------------------------------------------------

create table developers (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  name_ar text,
  logo_url text,
  summary text,
  description text,
  website_url text,
  founded_year smallint,
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index developers_published_idx on developers (is_published) where is_published;

-- ---------------------------------------------------------------------------
-- agents — the brokerage's own people
-- ---------------------------------------------------------------------------

create table agents (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  -- Links a consultant to their Supabase Auth user, so an agent can sign in
  -- and see their own leads. Null for team members without a login.
  auth_user_id uuid unique,
  full_name text not null,
  job_title text,
  bio text,
  photo_url text,
  email text,
  phone text,
  whatsapp text,
  -- RERA Broker Registration Number. Dubai requires it on agent profiles.
  brn text,
  languages text[] not null default '{}',
  linkedin_url text,
  display_order smallint not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index agents_active_idx on agents (is_active, display_order);

-- ---------------------------------------------------------------------------
-- projects — off-plan developments
-- ---------------------------------------------------------------------------

create table projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  name_ar text,
  developer_id uuid references developers (id) on delete set null,
  area_id uuid references areas (id) on delete set null,
  status project_status not null default 'announced',
  summary text,
  description text,
  hero_image_url text,
  image_urls jsonb not null default '[]'::jsonb,
  starting_price numeric(14, 2),
  currency char(3) not null default 'AED',
  unit_types property_type[] not null default '{}',
  bedrooms_min smallint,
  bedrooms_max smallint,
  -- Handover is quoted as a quarter in Dubai marketing, e.g. Q4 2027.
  handover_quarter smallint check (handover_quarter between 1 and 4),
  handover_year smallint,
  payment_plan text,
  amenities text[] not null default '{}',
  is_featured boolean not null default false,
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index projects_developer_idx on projects (developer_id);
create index projects_area_idx on projects (area_id);
create index projects_published_idx on projects (is_published, published_at desc) where is_published;

-- ---------------------------------------------------------------------------
-- properties — individual listings
-- ---------------------------------------------------------------------------

create table properties (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  -- Internal reference shown to clients, e.g. DLX-1042.
  reference text unique,
  title text not null,
  title_ar text,
  summary text,
  description text,
  listing_type listing_type not null,
  property_type property_type not null,
  status property_status not null default 'available',
  area_id uuid references areas (id) on delete set null,
  developer_id uuid references developers (id) on delete set null,
  project_id uuid references projects (id) on delete set null,
  agent_id uuid references agents (id) on delete set null,
  -- Null means price on application, which is common for off-market
  -- representation. An absent price must never be rendered as zero.
  price numeric(14, 2),
  currency char(3) not null default 'AED',
  -- Rentals are quoted per year in Dubai; null for sales.
  rent_frequency text check (rent_frequency in ('yearly', 'monthly', 'weekly', 'daily')),
  service_charge_per_sqft numeric(10, 2),
  bedrooms smallint,
  bathrooms smallint,
  built_up_sqft numeric(10, 2),
  plot_sqft numeric(10, 2),
  floor text,
  furnishing furnishing,
  view text,
  completion_status text check (completion_status in ('ready', 'off_plan')),
  handover_year smallint,
  amenities text[] not null default '{}',
  hero_image_url text,
  image_urls jsonb not null default '[]'::jsonb,
  latitude numeric(9, 6),
  longitude numeric(9, 6),
  -- Dubai law requires a DLD permit number on every advertised listing.
  dld_permit_number text,
  is_featured boolean not null default false,
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index properties_area_idx on properties (area_id);
create index properties_project_idx on properties (project_id);
create index properties_agent_idx on properties (agent_id);
create index properties_published_idx on properties (is_published, published_at desc) where is_published;
-- The portfolio's default filter: what is for sale, available, most recent first.
create index properties_browse_idx on properties (listing_type, status, price) where is_published;

-- ---------------------------------------------------------------------------
-- guides — the playbook the AI advisor and the Guides pages both read
-- ---------------------------------------------------------------------------

create table guides (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  title_ar text,
  excerpt text,
  -- Markdown. Rendered server-side so crawlers and AI read the full text.
  body text,
  category content_category not null default 'buying',
  hero_image_url text,
  reading_minutes smallint,
  -- A gated guide shows its opening section and asks for an email for the rest;
  -- that exchange is what creates the lead.
  is_gated boolean not null default false,
  author_agent_id uuid references agents (id) on delete set null,
  -- Per-page SEO. Falls back to title/excerpt when null.
  seo_title text,
  seo_description text,
  og_image_url text,
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index guides_category_idx on guides (category);
create index guides_published_idx on guides (is_published, published_at desc) where is_published;

-- ---------------------------------------------------------------------------
-- blog_posts — market commentary and news
-- ---------------------------------------------------------------------------

create table blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  title_ar text,
  excerpt text,
  body text,
  category content_category not null default 'market',
  hero_image_url text,
  reading_minutes smallint,
  author_agent_id uuid references agents (id) on delete set null,
  tags text[] not null default '{}',
  seo_title text,
  seo_description text,
  og_image_url text,
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index blog_posts_category_idx on blog_posts (category);
create index blog_posts_published_idx on blog_posts (is_published, published_at desc) where is_published;

-- ---------------------------------------------------------------------------
-- testimonials
-- ---------------------------------------------------------------------------

create table testimonials (
  id uuid primary key default gen_random_uuid(),
  author_name text not null,
  -- "London, UK" — where the client came from matters to other buyers.
  author_location text,
  author_photo_url text,
  quote text not null,
  rating smallint check (rating between 1 and 5),
  -- Where the review was left: google, our own form, a portal.
  source text,
  source_url text,
  agent_id uuid references agents (id) on delete set null,
  property_id uuid references properties (id) on delete set null,
  display_order smallint not null default 0,
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index testimonials_published_idx on testimonials (is_published, display_order);

-- ---------------------------------------------------------------------------
-- leads — every form, tool, chat and call lands here
-- ---------------------------------------------------------------------------

create table leads (
  id uuid primary key default gen_random_uuid(),

  -- Contact ---------------------------------------------------------------
  full_name text,
  email text,
  phone text,
  -- ISO 3166-1 alpha-2, used to route enquiries and pick a currency.
  country_code char(2),
  preferred_language text not null default 'en',
  preferred_contact text check (preferred_contact in ('email', 'phone', 'whatsapp')),

  -- Qualification ---------------------------------------------------------
  intent lead_intent,
  timeline lead_timeline,
  budget_min numeric(14, 2),
  budget_max numeric(14, 2),
  budget_currency char(3) not null default 'AED',
  property_types property_type[] not null default '{}',
  bedrooms_min smallint,
  area_ids uuid[] not null default '{}',
  is_financing boolean,
  is_first_purchase boolean,
  -- Anything the surface asked that does not deserve its own column yet:
  -- calculator inputs, quiz answers, a chat's extracted preferences.
  qualification_answers jsonb not null default '{}'::jsonb,
  message text,

  -- Scoring ---------------------------------------------------------------
  temperature lead_temperature not null default 'cold',
  -- 0-100, so scoring rules can be tuned without changing the enum.
  score smallint not null default 0 check (score between 0 and 100),
  status lead_status not null default 'new',
  assigned_agent_id uuid references agents (id) on delete set null,

  -- Attribution -----------------------------------------------------------
  source_type lead_source_type not null,
  -- Which specific form, tool or guide: "mortgage-calculator", "golden-visa".
  source_detail text,
  -- The listing or guide being looked at when the lead was created.
  property_id uuid references properties (id) on delete set null,
  guide_id uuid references guides (id) on delete set null,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  referrer_url text,
  landing_page_url text,
  page_path text,
  -- Meta and Google click ids, needed to send conversions back server-side.
  fbclid text,
  gclid text,
  user_agent text,

  -- Consent and handling --------------------------------------------------
  marketing_consent boolean not null default false,
  consent_at timestamptz,
  admin_notified_at timestamptz,
  client_confirmed_at timestamptz,
  internal_notes text,
  -- The untouched payload, so nothing is lost if a field is added later.
  raw_payload jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- A lead with no way to reach the person is not a lead.
  constraint leads_contactable check (email is not null or phone is not null)
);

create index leads_created_idx on leads (created_at desc);
create index leads_triage_idx on leads (status, temperature, created_at desc);
create index leads_source_idx on leads (source_type, created_at desc);
create index leads_assigned_idx on leads (assigned_agent_id, status);
create index leads_email_idx on leads (lower(email)) where email is not null;

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------

create trigger areas_set_updated_at before update on areas
  for each row execute function set_updated_at();
create trigger developers_set_updated_at before update on developers
  for each row execute function set_updated_at();
create trigger agents_set_updated_at before update on agents
  for each row execute function set_updated_at();
create trigger projects_set_updated_at before update on projects
  for each row execute function set_updated_at();
create trigger properties_set_updated_at before update on properties
  for each row execute function set_updated_at();
create trigger guides_set_updated_at before update on guides
  for each row execute function set_updated_at();
create trigger blog_posts_set_updated_at before update on blog_posts
  for each row execute function set_updated_at();
create trigger testimonials_set_updated_at before update on testimonials
  for each row execute function set_updated_at();
create trigger leads_set_updated_at before update on leads
  for each row execute function set_updated_at();
