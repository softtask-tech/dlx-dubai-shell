create extension if not exists "pgcrypto";

create type lead_temperature as enum ('hot', 'warm', 'cold');

create type lead_source_type as enum (
  'contact_form','valuation_form','listing_enquiry','guide_download','calculator',
  'market_report','ai_chat','voice_call','whatsapp','referral','other'
);

create type lead_status as enum (
  'new','contacted','qualified','viewing_booked','negotiating','won','lost','unqualified'
);

create type lead_timeline as enum ('immediately', 'within_3_months', 'within_12_months', 'researching');

create type lead_intent as enum ('buy', 'sell', 'rent', 'invest', 'relocate', 'advice');

create type listing_type as enum ('sale', 'rent');

create type property_type as enum (
  'apartment','villa','townhouse','penthouse','duplex','plot','office','retail'
);

create type property_status as enum ('available', 'under_offer', 'sold', 'let', 'off_market');

create type furnishing as enum ('unfurnished', 'semi_furnished', 'furnished');

create type project_status as enum ('announced', 'under_construction', 'completed', 'sold_out');

create type content_category as enum (
  'buying','selling','investment','golden_visa','relocation','market','area_guide','legal_and_tax'
);

create type app_role as enum ('admin', 'agent');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- areas ---------------------------------------------------------------------
create table public.areas (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  name_ar text,
  parent_area_id uuid references public.areas (id) on delete set null,
  summary text,
  description text,
  hero_image_url text,
  latitude numeric(9, 6),
  longitude numeric(9, 6),
  dld_area_name text,
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.areas to anon;
grant select, insert, update, delete on public.areas to authenticated;
grant all on public.areas to service_role;
create index areas_parent_idx on public.areas (parent_area_id);
create index areas_published_idx on public.areas (is_published) where is_published;

-- developers ----------------------------------------------------------------
create table public.developers (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  name_ar text,
  logo_url text,
  summary text,
  description text,
  website_url text,
  founded_year smallint,
  is_partner boolean not null default false,
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.developers to anon;
grant select, insert, update, delete on public.developers to authenticated;
grant all on public.developers to service_role;
create index developers_published_idx on public.developers (is_published) where is_published;
create index developers_partner_idx on public.developers (is_partner) where is_partner;

-- agents --------------------------------------------------------------------
create table public.agents (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  auth_user_id uuid unique,
  full_name text not null,
  job_title text,
  bio text,
  photo_url text,
  email text,
  phone text,
  whatsapp text,
  brn text,
  languages text[] not null default '{}',
  specialities text[] not null default '{}',
  linkedin_url text,
  display_order smallint not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.agents to anon;
grant select, insert, update, delete on public.agents to authenticated;
grant all on public.agents to service_role;
create index agents_active_idx on public.agents (is_active, display_order);

-- projects ------------------------------------------------------------------
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  name_ar text,
  developer_id uuid references public.developers (id) on delete set null,
  area_id uuid references public.areas (id) on delete set null,
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
  handover_quarter smallint check (handover_quarter between 1 and 4),
  handover_year smallint,
  payment_plan text,
  amenities text[] not null default '{}',
  brochure_url text,
  floor_plan_url text,
  is_featured boolean not null default false,
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.projects to anon;
grant select, insert, update, delete on public.projects to authenticated;
grant all on public.projects to service_role;
create index projects_developer_idx on public.projects (developer_id);
create index projects_area_idx on public.projects (area_id);
create index projects_published_idx on public.projects (is_published, published_at desc) where is_published;

-- properties ----------------------------------------------------------------
create table public.properties (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  reference text unique,
  title text not null,
  title_ar text,
  summary text,
  description text,
  listing_type listing_type not null,
  property_type property_type not null,
  status property_status not null default 'available',
  area_id uuid references public.areas (id) on delete set null,
  developer_id uuid references public.developers (id) on delete set null,
  project_id uuid references public.projects (id) on delete set null,
  agent_id uuid references public.agents (id) on delete set null,
  price numeric(14, 2),
  currency char(3) not null default 'AED',
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
  floor_plan_url text,
  brochure_url text,
  latitude numeric(9, 6),
  longitude numeric(9, 6),
  dld_permit_number text,
  is_featured boolean not null default false,
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.properties to anon;
grant select, insert, update, delete on public.properties to authenticated;
grant all on public.properties to service_role;
create index properties_area_idx on public.properties (area_id);
create index properties_project_idx on public.properties (project_id);
create index properties_agent_idx on public.properties (agent_id);
create index properties_published_idx on public.properties (is_published, published_at desc) where is_published;
create index properties_browse_idx on public.properties (listing_type, status, price) where is_published;

-- guides --------------------------------------------------------------------
create table public.guides (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  title_ar text,
  excerpt text,
  body text,
  category content_category not null default 'buying',
  hero_image_url text,
  reading_minutes smallint,
  is_gated boolean not null default false,
  author_agent_id uuid references public.agents (id) on delete set null,
  seo_title text,
  seo_description text,
  og_image_url text,
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.guides to anon;
grant select, insert, update, delete on public.guides to authenticated;
grant all on public.guides to service_role;
create index guides_category_idx on public.guides (category);
create index guides_published_idx on public.guides (is_published, published_at desc) where is_published;

-- blog_posts ----------------------------------------------------------------
create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  title_ar text,
  excerpt text,
  body text,
  category content_category not null default 'market',
  hero_image_url text,
  reading_minutes smallint,
  author_agent_id uuid references public.agents (id) on delete set null,
  tags text[] not null default '{}',
  seo_title text,
  seo_description text,
  og_image_url text,
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.blog_posts to anon;
grant select, insert, update, delete on public.blog_posts to authenticated;
grant all on public.blog_posts to service_role;
create index blog_posts_category_idx on public.blog_posts (category);
create index blog_posts_published_idx on public.blog_posts (is_published, published_at desc) where is_published;

-- testimonials --------------------------------------------------------------
create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  author_name text not null,
  author_location text,
  author_photo_url text,
  quote text not null,
  rating smallint check (rating between 1 and 5),
  source text,
  source_url text,
  agent_id uuid references public.agents (id) on delete set null,
  property_id uuid references public.properties (id) on delete set null,
  display_order smallint not null default 0,
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.testimonials to anon;
grant select, insert, update, delete on public.testimonials to authenticated;
grant all on public.testimonials to service_role;
create index testimonials_published_idx on public.testimonials (is_published, display_order);

-- leads ---------------------------------------------------------------------
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  full_name text,
  email text,
  phone text,
  country_code char(2),
  preferred_language text not null default 'en',
  preferred_contact text check (preferred_contact in ('email', 'phone', 'whatsapp')),
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
  qualification_answers jsonb not null default '{}'::jsonb,
  message text,
  temperature lead_temperature not null default 'cold',
  score smallint not null default 0 check (score between 0 and 100),
  status lead_status not null default 'new',
  assigned_agent_id uuid references public.agents (id) on delete set null,
  source_type lead_source_type not null,
  source_detail text,
  property_id uuid references public.properties (id) on delete set null,
  guide_id uuid references public.guides (id) on delete set null,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  referrer_url text,
  landing_page_url text,
  page_path text,
  fbclid text,
  gclid text,
  user_agent text,
  marketing_consent boolean not null default false,
  consent_at timestamptz,
  admin_notified_at timestamptz,
  client_confirmed_at timestamptz,
  internal_notes text,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint leads_contactable check (email is not null or phone is not null)
);
grant insert on public.leads to anon;
grant select, insert, update, delete on public.leads to authenticated;
grant all on public.leads to service_role;
create index leads_created_idx on public.leads (created_at desc);
create index leads_triage_idx on public.leads (status, temperature, created_at desc);
create index leads_source_idx on public.leads (source_type, created_at desc);
create index leads_assigned_idx on public.leads (assigned_agent_id, status);
create index leads_email_idx on public.leads (lower(email)) where email is not null;

-- lead_notes ----------------------------------------------------------------
create table public.lead_notes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  author_id uuid,
  body text not null,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.lead_notes to authenticated;
grant all on public.lead_notes to service_role;
create index lead_notes_lead_idx on public.lead_notes (lead_id, created_at desc);

-- user_roles ----------------------------------------------------------------
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;

create or replace function public.has_role(check_user_id uuid, check_role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = check_user_id and role = check_role
  );
$$;

-- updated_at triggers --------------------------------------------------------
create trigger areas_set_updated_at before update on public.areas
  for each row execute function public.set_updated_at();
create trigger developers_set_updated_at before update on public.developers
  for each row execute function public.set_updated_at();
create trigger agents_set_updated_at before update on public.agents
  for each row execute function public.set_updated_at();
create trigger projects_set_updated_at before update on public.projects
  for each row execute function public.set_updated_at();
create trigger properties_set_updated_at before update on public.properties
  for each row execute function public.set_updated_at();
create trigger guides_set_updated_at before update on public.guides
  for each row execute function public.set_updated_at();
create trigger blog_posts_set_updated_at before update on public.blog_posts
  for each row execute function public.set_updated_at();
create trigger testimonials_set_updated_at before update on public.testimonials
  for each row execute function public.set_updated_at();
create trigger leads_set_updated_at before update on public.leads
  for each row execute function public.set_updated_at();

-- row level security ---------------------------------------------------------
alter table public.areas enable row level security;
alter table public.developers enable row level security;
alter table public.agents enable row level security;
alter table public.projects enable row level security;
alter table public.properties enable row level security;
alter table public.guides enable row level security;
alter table public.blog_posts enable row level security;
alter table public.testimonials enable row level security;
alter table public.leads enable row level security;
alter table public.lead_notes enable row level security;
alter table public.user_roles enable row level security;

create policy "Published areas are public" on public.areas for select
  to anon, authenticated using (is_published);
create policy "Published developers are public" on public.developers for select
  to anon, authenticated using (is_published);
create policy "Active agents are public" on public.agents for select
  to anon, authenticated using (is_active);
create policy "Published projects are public" on public.projects for select
  to anon, authenticated using (is_published);
create policy "Published properties are public" on public.properties for select
  to anon, authenticated using (is_published);
create policy "Published guides are public" on public.guides for select
  to anon, authenticated using (is_published);
create policy "Published blog posts are public" on public.blog_posts for select
  to anon, authenticated using (is_published);
create policy "Published testimonials are public" on public.testimonials for select
  to anon, authenticated using (is_published);

create policy "Anyone may submit a lead" on public.leads for insert
  to anon, authenticated with check (true);

create policy "Agents read their own leads" on public.leads for select to authenticated
  using (
    exists (
      select 1 from public.agents
      where agents.id = leads.assigned_agent_id
        and agents.auth_user_id = (select auth.uid())
    )
  );

create policy "Agents update their own leads" on public.leads for update to authenticated
  using (
    exists (
      select 1 from public.agents
      where agents.id = leads.assigned_agent_id
        and agents.auth_user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.agents
      where agents.id = leads.assigned_agent_id
        and agents.auth_user_id = (select auth.uid())
    )
  );

create policy "Users read their own roles" on public.user_roles for select
  to authenticated using (user_id = (select auth.uid()));
create policy "Admins read all roles" on public.user_roles for select
  to authenticated using (public.has_role((select auth.uid()), 'admin'));

create policy "Admins manage areas" on public.areas for all to authenticated
  using (public.has_role((select auth.uid()), 'admin')) with check (public.has_role((select auth.uid()), 'admin'));
create policy "Admins manage developers" on public.developers for all to authenticated
  using (public.has_role((select auth.uid()), 'admin')) with check (public.has_role((select auth.uid()), 'admin'));
create policy "Admins manage agents" on public.agents for all to authenticated
  using (public.has_role((select auth.uid()), 'admin')) with check (public.has_role((select auth.uid()), 'admin'));
create policy "Admins manage projects" on public.projects for all to authenticated
  using (public.has_role((select auth.uid()), 'admin')) with check (public.has_role((select auth.uid()), 'admin'));
create policy "Admins manage properties" on public.properties for all to authenticated
  using (public.has_role((select auth.uid()), 'admin')) with check (public.has_role((select auth.uid()), 'admin'));
create policy "Admins manage guides" on public.guides for all to authenticated
  using (public.has_role((select auth.uid()), 'admin')) with check (public.has_role((select auth.uid()), 'admin'));
create policy "Admins manage blog posts" on public.blog_posts for all to authenticated
  using (public.has_role((select auth.uid()), 'admin')) with check (public.has_role((select auth.uid()), 'admin'));
create policy "Admins manage testimonials" on public.testimonials for all to authenticated
  using (public.has_role((select auth.uid()), 'admin')) with check (public.has_role((select auth.uid()), 'admin'));
create policy "Admins manage leads" on public.leads for all to authenticated
  using (public.has_role((select auth.uid()), 'admin')) with check (public.has_role((select auth.uid()), 'admin'));
create policy "Admins manage lead notes" on public.lead_notes for all to authenticated
  using (public.has_role((select auth.uid()), 'admin')) with check (public.has_role((select auth.uid()), 'admin'));

create policy "Agents read notes on their leads" on public.lead_notes for select to authenticated
  using (
    exists (
      select 1 from public.leads
      join public.agents on agents.id = leads.assigned_agent_id
      where leads.id = lead_notes.lead_id
        and agents.auth_user_id = (select auth.uid())
    )
  );

create policy "Agents add notes to their leads" on public.lead_notes for insert to authenticated
  with check (
    exists (
      select 1 from public.leads
      join public.agents on agents.id = leads.assigned_agent_id
      where leads.id = lead_notes.lead_id
        and agents.auth_user_id = (select auth.uid())
    )
  );

-- storage policies -----------------------------------------------------------
create policy "Staff read media" on storage.objects for select
  to authenticated
  using (bucket_id in ('property-media', 'brochures', 'team'));

create policy "Admins upload media" on storage.objects for insert
  to authenticated
  with check (
    bucket_id in ('property-media', 'brochures', 'team')
    and public.has_role((select auth.uid()), 'admin')
  );

create policy "Admins update media" on storage.objects for update
  to authenticated
  using (
    bucket_id in ('property-media', 'brochures', 'team')
    and public.has_role((select auth.uid()), 'admin')
  );

create policy "Admins delete media" on storage.objects for delete
  to authenticated
  using (
    bucket_id in ('property-media', 'brochures', 'team')
    and public.has_role((select auth.uid()), 'admin')
  );