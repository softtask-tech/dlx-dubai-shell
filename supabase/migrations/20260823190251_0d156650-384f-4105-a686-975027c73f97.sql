-- Paid media: spend, conversions, routing and nurture.
--
-- Phase 6 asks a question the earlier phases could not answer: did the money
-- spent on an ad come back? Answering it needs three things this schema adds.
--
-- WHAT WAS SPENT. `campaign_spend` holds imported cost by campaign and day.
-- Nothing here estimates it: a day with no imported row is a day we do not know
-- the cost of, and the dashboard says so rather than dividing by an assumed
-- zero and reporting an infinite return.
--
-- WHAT WAS SENT BACK. `conversion_events` logs every dispatch to Meta and
-- Google — the payload's event id, whether it succeeded, and what came back.
-- Conversions fired into the dark are the normal failure mode of server-side
-- tracking: everything looks fine until a month of data is missing and nobody
-- can say when it stopped.
--
-- WHAT HAPPENED TO THE LEAD. Routing and outcome columns on `leads`, so a
-- closed deal can be attributed to the ad that produced it and sent back as an
-- offline conversion. Without the outcome, the platforms optimise for form
-- fills — which is how you buy a thousand worthless leads efficiently.

-- ---------------------------------------------------------------------------
-- Lead outcome, routing and consent
-- ---------------------------------------------------------------------------

-- What a won lead was actually worth to the business, so ROAS is measured
-- against revenue rather than against the count of enquiries.
alter table public.leads
  add column if not exists deal_value_aed numeric(14, 2)
    check (deal_value_aed is null or deal_value_aed >= 0),
  add column if not exists deal_closed_at timestamptz,
  -- When a consultant was actually put on it. The gap between this and
  -- created_at is the speed-to-lead number that decides whether paid traffic
  -- converts at all.
  add column if not exists routed_at timestamptz,
  add column if not exists routing_reason text,
  -- Set when the lead was held back from routing for nurture instead.
  add column if not exists nurture_started_at timestamptz,
  add column if not exists nurture_stage smallint not null default 0
    check (nurture_stage >= 0),
  add column if not exists nurture_last_sent_at timestamptz,
  add column if not exists unsubscribed_at timestamptz,
  -- First touch is kept alongside the last-touch UTMs already on the row:
  -- the campaign that introduced someone and the one they converted on are
  -- different questions and both get asked.
  add column if not exists first_utm_source text,
  add column if not exists first_utm_medium text,
  add column if not exists first_utm_campaign text,
  add column if not exists first_landing_page_url text,
  add column if not exists first_seen_at timestamptz,
  -- Meta's click id needs its browser id beside it to match reliably. `fbc`
  -- is the click id in the cookie format their API wants, and it embeds the
  -- click *time* — which is why it is stored rather than rebuilt later from
  -- `fbclid`, when that timestamp would be wrong.
  add column if not exists fbc text,
  add column if not exists fbp text,
  add column if not exists gbraid text,
  add column if not exists wbraid text,
  add column if not exists msclkid text,
  add column if not exists ttclid text,
  -- Where a native platform form was the origin, its own identifiers.
  add column if not exists external_form_id text,
  add column if not exists external_lead_id text,
  -- Deduplication: a stable fingerprint of contact details plus source.
  add column if not exists dedupe_key text,
  -- Anti-spam verdict, kept rather than acted on silently, so a wrongly
  -- rejected enquiry can be found and rescued.
  add column if not exists spam_score smallint
    check (spam_score is null or spam_score between 0 and 100),
  add column if not exists spam_reasons jsonb not null default '[]'::jsonb;

-- One native-platform lead arriving twice is the same lead. A partial index
-- so website leads, which have no external id, are unaffected.
create unique index if not exists leads_external_lead_idx
  on public.leads (external_lead_id)
  where external_lead_id is not null;

create index if not exists leads_dedupe_idx
  on public.leads (dedupe_key, created_at desc)
  where dedupe_key is not null;

create index if not exists leads_campaign_idx
  on public.leads (utm_source, utm_campaign, created_at desc);

create index if not exists leads_nurture_idx
  on public.leads (temperature, nurture_stage, nurture_last_sent_at)
  where unsubscribed_at is null;

-- ---------------------------------------------------------------------------
-- campaign_spend — what the ads cost
-- ---------------------------------------------------------------------------

create table if not exists public.campaign_spend (
  id uuid primary key default gen_random_uuid(),
  -- "meta", "google", "tiktok" — free text rather than an enum so adding a
  -- channel is an import, not a migration.
  platform text not null,
  campaign_id text not null,
  campaign_name text,
  adset_id text,
  adset_name text,
  -- Empty string rather than null for "the whole campaign". Null would be the
  -- natural choice, but the uniqueness rule below has to be a plain index for
  -- PostgREST's upsert to target it — and a null in a unique index does not
  -- collide with another null, so re-importing a campaign-level row would
  -- insert a second one every time instead of correcting the first.
  ad_id text not null default '',
  ad_name text,
  spend_date date not null,
  spend_aed numeric(14, 2) not null check (spend_aed >= 0),
  impressions integer check (impressions is null or impressions >= 0),
  clicks integer check (clicks is null or clicks >= 0),
  -- What the platform itself counted, for comparison with what we counted.
  platform_conversions integer check (platform_conversions is null or platform_conversions >= 0),
  imported_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Re-importing a day corrects it rather than doubling it. Deliberately a plain
-- index over the raw columns: an expression index (wrapping ad_id in coalesce)
-- reads better but cannot be named as an upsert target, and the import would
-- fail every time after the first.
create unique index if not exists campaign_spend_identity_idx
  on public.campaign_spend (platform, campaign_id, ad_id, spend_date);

grant select, insert, update, delete on public.campaign_spend to authenticated;
grant all on public.campaign_spend to service_role;
revoke all on public.campaign_spend from anon;

create index if not exists campaign_spend_date_idx on public.campaign_spend (spend_date desc);

drop trigger if exists campaign_spend_set_updated_at on public.campaign_spend;
create trigger campaign_spend_set_updated_at before update on public.campaign_spend
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- conversion_events — what we sent to the ad platforms
-- ---------------------------------------------------------------------------

-- Guarded so the file can be re-applied against a database that already has
-- part of it — which is what happens every time this is tested locally.
do $$ begin
  create type conversion_destination as enum ('meta_capi', 'google_ads', 'ga4');
exception when duplicate_object then null; end $$;

do $$ begin
  create type conversion_status as enum ('pending', 'sent', 'failed', 'skipped');
exception when duplicate_object then null; end $$;

create table if not exists public.conversion_events (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads (id) on delete cascade,
  destination conversion_destination not null,
  -- "Lead", "QualifiedLead", "Purchase" — the name as the platform knows it.
  event_name text not null,
  -- Shared with the browser pixel so the platform can deduplicate the pair.
  -- Unique per destination: the same id sent twice to Meta is one conversion.
  event_id text not null,
  value_aed numeric(14, 2) check (value_aed is null or value_aed >= 0),
  status conversion_status not null default 'pending',
  attempts smallint not null default 0 check (attempts >= 0),
  -- Whatever the platform said. Kept verbatim: a rejected event's reason is
  -- usually the only way to find out that hashing or consent is wrong.
  response jsonb,
  error text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (destination, event_id)
);

grant select, insert, update, delete on public.conversion_events to authenticated;
grant all on public.conversion_events to service_role;
revoke all on public.conversion_events from anon;

create index if not exists conversion_events_lead_idx on public.conversion_events (lead_id);
create index if not exists conversion_events_retry_idx
  on public.conversion_events (status, created_at)
  where status in ('pending', 'failed');

drop trigger if exists conversion_events_set_updated_at on public.conversion_events;
create trigger conversion_events_set_updated_at before update on public.conversion_events
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.campaign_spend enable row level security;
alter table public.conversion_events enable row level security;

-- Spend and conversion logs are commercial internals. No anon policy at all;
-- the dispatchers run with the service role, which bypasses RLS.
drop policy if exists "Admins read spend" on public.campaign_spend;
create policy "Admins read spend"
  on public.campaign_spend for select to authenticated
  using (public.has_role((select auth.uid()), 'admin'));

drop policy if exists "Admins manage spend" on public.campaign_spend;
create policy "Admins manage spend"
  on public.campaign_spend for all to authenticated
  using (public.has_role((select auth.uid()), 'admin'))
  with check (public.has_role((select auth.uid()), 'admin'));

drop policy if exists "Admins read conversion events" on public.conversion_events;
create policy "Admins read conversion events"
  on public.conversion_events for select to authenticated
  using (public.has_role((select auth.uid()), 'admin'));

drop policy if exists "Admins manage conversion events" on public.conversion_events;
create policy "Admins manage conversion events"
  on public.conversion_events for all to authenticated
  using (public.has_role((select auth.uid()), 'admin'))
  with check (public.has_role((select auth.uid()), 'admin'));