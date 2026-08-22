-- The DLD data engine.
--
-- Dubai Land Department publishes transaction and rent-contract records as open
-- data. This schema holds a cleaned copy of that, plus the metrics derived from
-- it, so the site only ever reads our own database — fast, cacheable, and
-- unaffected by the source being slow or down.
--
-- The organising idea is PROVENANCE. Every row records where it came from, and
-- the site's source line is derived from that column rather than hard-coded.
-- The consequence is that a page can only claim "Source: Dubai Land Department"
-- when the rows behind it actually are DLD records. Sample rows loaded for
-- development say so on the page. Publishing an invented figure under an
-- official attribution would be worse than showing nothing at all, and this
-- makes that failure structurally impossible rather than a matter of care.

create type data_provenance as enum (
  -- Cleaned records from Dubai Pulse open data.
  'dld_open_data',
  -- Illustrative rows for development and demos. Never presented as official.
  'sample'
);

-- ---------------------------------------------------------------------------
-- dld_transactions — one recorded sale
-- ---------------------------------------------------------------------------

create table public.dld_transactions (
  id uuid primary key default gen_random_uuid(),
  provenance data_provenance not null,

  -- The source's own identifier. Unique so a re-ingest updates rather than
  -- duplicates — the pipeline upserts on this.
  source_transaction_id text not null,

  transaction_date date not null,
  -- "Sales", "Mortgages", "Gifts" in DLD's vocabulary. Only sales feed pricing.
  transaction_group text,
  -- "Ready" or "Off-Plan".
  registration_type text,
  property_type text,
  property_subtype text,

  -- The community, both as DLD spells it and resolved to our own area row.
  -- Keeping the raw name means an unmatched area can be reconciled later
  -- instead of being silently dropped.
  area_name_raw text not null,
  area_id uuid references public.areas (id) on delete set null,
  building_name text,

  rooms_raw text,
  bedrooms smallint,

  amount numeric(14, 2) not null check (amount > 0),
  area_sqm numeric(12, 2) check (area_sqm > 0),
  -- Stored rather than computed on read: every chart and stat sorts and
  -- aggregates on these, and DLD publishes only square metres.
  area_sqft numeric(12, 2) generated always as (area_sqm * 10.7639104) stored,
  price_per_sqft numeric(12, 2) generated always as (
    case when area_sqm > 0 then amount / (area_sqm * 10.7639104) end
  ) stored,

  is_freehold boolean,
  latitude numeric(9, 6),
  longitude numeric(9, 6),

  ingested_at timestamptz not null default now(),
  created_at timestamptz not null default now(),

  unique (provenance, source_transaction_id)
);

create index dld_transactions_area_date_idx
  on public.dld_transactions (area_id, transaction_date desc);
create index dld_transactions_date_idx on public.dld_transactions (transaction_date desc);
-- The pricing aggregates only ever look at sales with a usable size.
create index dld_transactions_pricing_idx
  on public.dld_transactions (area_id, transaction_date)
  where price_per_sqft is not null;

-- ---------------------------------------------------------------------------
-- dld_rent_contracts — what tenancies actually register at
-- ---------------------------------------------------------------------------

-- Yield cannot be derived from sales alone. DLD publishes registered tenancy
-- contracts separately; this is the other half of the calculation.
create table public.dld_rent_contracts (
  id uuid primary key default gen_random_uuid(),
  provenance data_provenance not null,
  source_contract_id text not null,

  contract_start_date date not null,
  area_name_raw text not null,
  area_id uuid references public.areas (id) on delete set null,
  property_type text,
  bedrooms smallint,
  -- Normalised to a year, whatever the contract period was.
  annual_rent numeric(14, 2) not null check (annual_rent > 0),
  area_sqm numeric(12, 2) check (area_sqm > 0),

  ingested_at timestamptz not null default now(),
  created_at timestamptz not null default now(),

  unique (provenance, source_contract_id)
);

create index dld_rent_contracts_area_idx
  on public.dld_rent_contracts (area_id, contract_start_date desc);

-- ---------------------------------------------------------------------------
-- area_stats — the derived metrics, one row per community
-- ---------------------------------------------------------------------------

create table public.area_stats (
  id uuid primary key default gen_random_uuid(),
  area_id uuid not null unique references public.areas (id) on delete cascade,
  provenance data_provenance not null,

  -- The window the headline metrics cover, so a page can say what "median
  -- price" is the median *of*.
  window_start date not null,
  window_end date not null,

  transaction_count integer not null default 0,
  median_price numeric(14, 2),
  average_price numeric(14, 2),
  median_price_per_sqft numeric(12, 2),
  average_price_per_sqft numeric(12, 2),

  -- The same window a year earlier, and the change between them.
  prior_transaction_count integer,
  prior_median_price_per_sqft numeric(12, 2),
  yoy_price_change_pct numeric(6, 2),
  yoy_volume_change_pct numeric(6, 2),

  -- Null when we hold no rent contracts for the area — a yield we cannot
  -- evidence is not displayed.
  median_annual_rent numeric(14, 2),
  gross_yield_pct numeric(5, 2),

  off_plan_share_pct numeric(5, 2),

  last_updated timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index area_stats_yield_idx on public.area_stats (gross_yield_pct desc nulls last);

-- ---------------------------------------------------------------------------
-- area_price_history — the monthly series behind the charts
-- ---------------------------------------------------------------------------

create table public.area_price_history (
  id uuid primary key default gen_random_uuid(),
  area_id uuid not null references public.areas (id) on delete cascade,
  provenance data_provenance not null,
  -- First day of the month the row summarises.
  period_month date not null,
  transaction_count integer not null default 0,
  median_price_per_sqft numeric(12, 2),
  median_price numeric(14, 2),
  created_at timestamptz not null default now(),

  unique (area_id, period_month)
);

create index area_price_history_area_idx
  on public.area_price_history (area_id, period_month);

-- ---------------------------------------------------------------------------
-- dld_ingest_runs — the audit trail the admin data view reads
-- ---------------------------------------------------------------------------

create table public.dld_ingest_runs (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  -- 'running', 'succeeded', 'failed'
  status text not null default 'running',
  -- 'scheduled', 'manual', 'import'
  trigger_source text not null default 'scheduled',
  dataset text,
  rows_fetched integer not null default 0,
  rows_upserted integer not null default 0,
  rows_rejected integer not null default 0,
  areas_refreshed integer not null default 0,
  error_message text,
  created_at timestamptz not null default now()
);

create index dld_ingest_runs_recent_idx on public.dld_ingest_runs (started_at desc);

-- ---------------------------------------------------------------------------
-- report_grants — the gate in front of the full reports
-- ---------------------------------------------------------------------------

create table public.report_grants (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  lead_id uuid references public.leads (id) on delete set null,
  -- Null means the whole-market report rather than one community.
  area_id uuid references public.areas (id) on delete cascade,
  expires_at timestamptz not null,
  first_viewed_at timestamptz,
  view_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index report_grants_token_idx on public.report_grants (token);

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------

alter table public.dld_transactions enable row level security;
alter table public.dld_rent_contracts enable row level security;
alter table public.area_stats enable row level security;
alter table public.area_price_history enable row level security;
alter table public.dld_ingest_runs enable row level security;
alter table public.report_grants enable row level security;

-- The derived metrics and the transaction records are the public evidence
-- behind every number on the site, so they are world-readable. That is the
-- point of building on open data: a visitor can check our working.
create policy "Market data is public"
  on public.dld_transactions for select to anon, authenticated using (true);

create policy "Rent contracts are public"
  on public.dld_rent_contracts for select to anon, authenticated using (true);

create policy "Area stats are public"
  on public.area_stats for select to anon, authenticated using (true);

create policy "Price history is public"
  on public.area_price_history for select to anon, authenticated using (true);

-- Ingestion history is operational detail, not public evidence.
create policy "Admins read ingest runs"
  on public.dld_ingest_runs for select to authenticated
  using (public.has_role((select auth.uid()), 'admin'));

-- Report grants are looked up by token through a server function running as the
-- service role. Nothing else may read them: the table maps tokens to leads.
create policy "Admins read report grants"
  on public.report_grants for select to authenticated
  using (public.has_role((select auth.uid()), 'admin'));

-- Only server-side code writes market data. There is no path from the browser.
create policy "Admins manage market data"
  on public.dld_transactions for all to authenticated
  using (public.has_role((select auth.uid()), 'admin'))
  with check (public.has_role((select auth.uid()), 'admin'));

create policy "Admins manage rent contracts"
  on public.dld_rent_contracts for all to authenticated
  using (public.has_role((select auth.uid()), 'admin'))
  with check (public.has_role((select auth.uid()), 'admin'));

create policy "Admins manage area stats"
  on public.area_stats for all to authenticated
  using (public.has_role((select auth.uid()), 'admin'))
  with check (public.has_role((select auth.uid()), 'admin'));

create policy "Admins manage price history"
  on public.area_price_history for all to authenticated
  using (public.has_role((select auth.uid()), 'admin'))
  with check (public.has_role((select auth.uid()), 'admin'));

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

grant select on public.dld_transactions to anon;
grant select, insert, update, delete on public.dld_transactions to authenticated;
grant all on public.dld_transactions to service_role;

grant select on public.dld_rent_contracts to anon;
grant select, insert, update, delete on public.dld_rent_contracts to authenticated;
grant all on public.dld_rent_contracts to service_role;

grant select on public.area_stats to anon;
grant select, insert, update, delete on public.area_stats to authenticated;
grant all on public.area_stats to service_role;

grant select on public.area_price_history to anon;
grant select, insert, update, delete on public.area_price_history to authenticated;
grant all on public.area_price_history to service_role;

grant select on public.dld_ingest_runs to authenticated;
grant all on public.dld_ingest_runs to service_role;

grant select on public.report_grants to authenticated;
grant all on public.report_grants to service_role;
