-- Phase 1A only: staging and atomic publication contract. Prepared, not applied.
create extension if not exists pg_trgm with schema extensions;

create table if not exists public.dld_directory_import_runs (
  import_run_id uuid primary key default gen_random_uuid(),
  status text not null default 'staging' check (status in ('staging','published','failed')),
  source_manifest jsonb not null, expected_counts jsonb not null,
  created_at timestamptz not null default now(), published_at timestamptz
);
create table if not exists public.dld_directory_stage (
  import_run_id uuid not null references public.dld_directory_import_runs(import_run_id) on delete cascade,
  entity_type text not null,
  source_key text not null,
  payload jsonb not null,
  primary key (import_run_id, entity_type, source_key)
);
alter table public.dld_directory_import_runs enable row level security;
alter table public.dld_directory_stage enable row level security;
revoke all on public.dld_directory_import_runs, public.dld_directory_stage from public, anon, authenticated;
grant all on public.dld_directory_import_runs, public.dld_directory_stage to service_role;

create materialized view if not exists public.dld_directory_search_index as
select 'community'::text entity_type, area_id source_key, name_en display_name_en, name_ar display_name_ar,
       area_id primary_number, municipality_number secondary_number, null::text status_en,
       null::date valid_from, null::date valid_to, '{}'::jsonb related_context, aliases,
       source_export_date, source_dataset from public.dld_directory_communities
union all select 'developer', developer_id, name_en, name_ar, developer_number, licence_number, legal_status_en, licence_issue_date, licence_expiry_date, '{}', aliases, source_export_date, source_dataset from public.dld_directory_developers
union all
select 'project', p.project_id, p.name_en, p.name_ar, p.project_number, p.developer_number, p.status_en,
       p.project_start_date, p.project_end_date,
       jsonb_strip_nulls(jsonb_build_object(
         'developer', case when d.developer_id is not null then jsonb_build_object('key', d.developer_id, 'name_en', d.name_en, 'name_ar', d.name_ar, 'number', d.developer_number) end,
         'community', case when c.area_id is not null then jsonb_build_object('key', c.area_id, 'name_en', c.name_en, 'name_ar', c.name_ar, 'number', c.municipality_number) end
       )), p.aliases, p.source_export_date, p.source_dataset
from public.dld_directory_projects p
left join public.dld_directory_developers d on d.developer_id = p.developer_id
left join public.dld_directory_communities c on c.area_id = p.area_id
union all
select 'broker', b.broker_id, b.name_en, b.name_ar, b.broker_number, null, null,
       b.licence_start_date, b.licence_end_date,
       jsonb_build_object('offices', coalesce((
         select jsonb_agg(jsonb_build_object('key', o.office_id, 'name_en', o.name_en, 'name_ar', o.name_ar, 'number', o.office_number) order by o.office_number)
         from public.dld_directory_broker_office_links l join public.dld_directory_offices o on o.office_id = l.office_id
         where l.broker_id = b.broker_id
       ), '[]'::jsonb)), b.aliases, b.source_export_date, b.source_dataset
from public.dld_directory_brokers b
union all select 'office', office_id, name_en, name_ar, office_number, licence_number, null, licence_issue_date, licence_expiry_date, '{}', aliases, source_export_date, source_dataset from public.dld_directory_offices
union all
select 'licence', l.licence_key, l.trade_name_en, l.trade_name_ar, l.licence_number, null, l.status_en,
       l.issue_date, l.expiry_date,
       jsonb_strip_nulls(jsonb_build_object(
         'office', case when o.office_id is not null then jsonb_build_object('key', o.office_id, 'name_en', o.name_en, 'name_ar', o.name_ar, 'number', o.office_number) end,
         'developer', case when d.developer_id is not null then jsonb_build_object('key', d.developer_id, 'name_en', d.name_en, 'name_ar', d.name_ar, 'number', d.developer_number) end
       )), l.aliases, l.source_export_date, l.source_dataset
from public.dld_directory_licences l
left join public.dld_directory_offices o on o.office_id = l.matched_office_id
left join public.dld_directory_developers d on d.developer_id = l.matched_developer_id
union all select 'permit', permit_id, participant_name_en, participant_name_ar, permit_number, licence_number, status_en, start_date, end_date, '{}', aliases, source_export_date, source_dataset from public.dld_directory_permits
union all select 'valuator', valuator_key, name_en, name_ar, valuator_number, valuation_company_number, null, licence_start_date, licence_end_date, '{}', aliases, source_export_date, source_dataset from public.dld_directory_valuators
union all select 'escrow_agent', escrow_agent_number, name_en, name_ar, escrow_agent_number, null, null, null, null, '{}', aliases, source_export_date, source_dataset from public.dld_directory_escrow_agents
union all select 'owner_association', association_key, name_en, name_ar, null, null, null, null, null, '{}', aliases, source_export_date, source_dataset from public.dld_directory_owner_associations
union all select 'free_zone_company', company_number, name_en, name_ar, company_number, licence_number, null, licence_issue_date, licence_expiry_date, '{}', aliases, source_export_date, source_dataset from public.dld_directory_free_zone_companies
with no data;
create unique index if not exists dld_directory_search_identity_idx on public.dld_directory_search_index(entity_type, source_key);
create index if not exists dld_directory_search_aliases_trgm_idx on public.dld_directory_search_index using gin (aliases extensions.gin_trgm_ops);
revoke all on public.dld_directory_search_index from public, anon, authenticated;
grant select on public.dld_directory_search_index to service_role;

create or replace view public.dld_directory_search_public with (security_barrier=true, security_invoker=false) as
select entity_type, source_key, display_name_en, display_name_ar, primary_number, secondary_number,
       status_en, valid_from, valid_to, related_context, source_export_date, source_dataset,
       'Independent directory using Dubai Land Department open data; no affiliation or endorsement is implied.'::text non_affiliation
from public.dld_directory_search_index;
revoke all on public.dld_directory_search_public from public;
grant select on public.dld_directory_search_public to anon, authenticated;

create or replace function public.dld_directory_normalize_query(value text)
returns text language sql immutable strict set search_path = '' as $$
  select trim(regexp_replace(lower(translate(value, 'أإآٱىؤئـًٌٍَُِّْ', 'اااايوي')), '[^[:alnum:]ء-ي]+', ' ', 'g'))
$$;
create or replace function public.search_dld_directory(
  search_query text default '', entity_types text[] default null,
  page_number integer default 1, page_size integer default 24
)
returns table(entity_type text, source_key text, display_name_en text, display_name_ar text,
              primary_number text, secondary_number text, status_en text, valid_from date, valid_to date,
              related_context jsonb,
              total_count bigint,
              source_export_date date, source_dataset text, non_affiliation text)
language sql stable security definer set search_path = '' as $$
  select s.entity_type, s.source_key, s.display_name_en, s.display_name_ar,
         s.primary_number, s.secondary_number, s.status_en, s.valid_from, s.valid_to,
         s.related_context, count(*) over(),
         s.source_export_date, s.source_dataset,
         'Independent directory using Dubai Land Department open data; no affiliation or endorsement is implied.'::text
  from public.dld_directory_search_index s
  where (public.dld_directory_normalize_query(coalesce(search_query, '')) = ''
         or s.aliases ilike '%' || public.dld_directory_normalize_query(search_query) || '%')
    and (entity_types is null or cardinality(entity_types) = 0 or s.entity_type = any(entity_types))
  order by case when public.dld_directory_normalize_query(search_query) in
                       (public.dld_directory_normalize_query(s.primary_number), public.dld_directory_normalize_query(s.secondary_number))
                     then 0 else 1 end,
           greatest(extensions.similarity(s.aliases, public.dld_directory_normalize_query(search_query)), 0) desc,
           coalesce(s.display_name_en, s.display_name_ar), s.source_key
  limit least(greatest(coalesce(page_size, 24), 1), 100)
  offset (greatest(coalesce(page_number, 1), 1) - 1) * least(greatest(coalesce(page_size, 24), 1), 100)
$$;
revoke all on function public.dld_directory_normalize_query(text) from public;
revoke all on function public.search_dld_directory(text, text[], integer, integer) from public;
grant execute on function public.search_dld_directory(text, text[], integer, integer) to anon, authenticated;

create or replace function public.publish_dld_directory(target_run_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  entity text;
  expected bigint;
  actual bigint;
  table_name text;
  insert_order constant text[] := array['communities','developers','escrow_agents','offices','brokers','projects','office_activities','broker_office_links','licences','permits','valuators','owner_associations','free_zone_companies'];
  delete_order constant text[] := array['broker_office_links','office_activities','projects','licences','brokers','offices','developers','communities','escrow_agents','permits','valuators','owner_associations','free_zone_companies'];
begin
  perform pg_advisory_xact_lock(hashtext('dld_directory_publish'));
  if exists (select 1 from public.dld_directory_import_runs where import_run_id = target_run_id and status = 'published') then
    return;
  end if;
  if not exists (select 1 from public.dld_directory_import_runs where import_run_id = target_run_id and status = 'staging') then
    raise exception 'Unknown or non-staging DLD directory import run %', target_run_id;
  end if;
  if exists (
    select 1 from public.dld_directory_stage
    where import_run_id = target_run_id and not (entity_type = any(insert_order))
  ) then
    raise exception 'Unexpected entity type in DLD directory import run %', target_run_id;
  end if;
  set constraints all deferred;
  foreach entity in array insert_order loop
    select coalesce((expected_counts ->> entity)::bigint, -1) into expected
    from public.dld_directory_import_runs where import_run_id = target_run_id;
    select count(*) into actual from public.dld_directory_stage
    where import_run_id = target_run_id and entity_type = entity;
    if expected < 0 or expected <> actual then
      raise exception 'DLD directory count mismatch for %: expected %, staged %', entity, expected, actual;
    end if;
  end loop;
  foreach entity in array delete_order loop
    execute format('delete from public.dld_directory_%I', entity);
  end loop;
  foreach entity in array insert_order loop
    table_name := 'dld_directory_' || entity;
    execute format(
      'insert into public.%I select (jsonb_populate_record(null::public.%I, payload)).* from public.dld_directory_stage where import_run_id = $1 and entity_type = $2 order by source_key',
      table_name, table_name
    ) using target_run_id, entity;
  end loop;
  refresh materialized view public.dld_directory_search_index;
  update public.dld_directory_import_runs set status = 'published', published_at = now()
  where import_run_id = target_run_id;
end $$;
revoke all on function public.publish_dld_directory(uuid) from public, anon, authenticated;
grant execute on function public.publish_dld_directory(uuid) to service_role;
