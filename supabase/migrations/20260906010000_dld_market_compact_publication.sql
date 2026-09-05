-- Phase 3C compact DLD market publication contract. Additive and intentionally unapplied.

create table if not exists public.dld_market_import_runs (
  import_run_id uuid primary key default gen_random_uuid(),
  schema_version text not null,
  methodology_version text not null,
  source_export_date date not null,
  package_sha256 text not null unique check (package_sha256 ~ '^[0-9a-f]{64}$'),
  manifest_sha256 text not null check (manifest_sha256 ~ '^[0-9a-f]{64}$'),
  expected_counts jsonb not null check (jsonb_typeof(expected_counts)='object'),
  expected_total bigint not null check (expected_total > 0 and expected_total <= 500000),
  status text not null default 'staging' check (status in ('staging','validated','published','failed')),
  validation_report jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  validated_at timestamptz,
  published_at timestamptz
);

create table if not exists public.dld_market_scope_registry (
  entity_type text not null,
  period_grain text not null,
  metric_code text not null,
  segment_type text not null,
  allowed_segment_codes text[] not null,
  minimum_observations integer not null check (minimum_observations in (10,30)),
  value_kind text not null check (value_kind in ('count','amount','change')),
  consumer text not null,
  primary key (entity_type,period_grain,metric_code,segment_type)
);

create table if not exists public.dld_market_stage (
  import_run_id uuid not null references public.dld_market_import_runs(import_run_id) on delete cascade,
  chunk_name text not null,
  aggregate_key text not null check (aggregate_key ~ '^[0-9a-f]{64}$'),
  entity_type text not null,
  entity_id text not null,
  name_en text not null default '',
  name_ar text not null default '',
  period_grain text not null,
  period_start date not null,
  period_end date not null,
  metric_code text not null,
  segment_type text not null,
  segment_code text not null,
  metric_value numeric not null,
  observation_count integer not null,
  confidence text not null,
  quality_flags jsonb not null default '[]'::jsonb,
  source_export_date date not null,
  methodology_version text not null,
  primary key (import_run_id,aggregate_key)
);

create table if not exists public.dld_market_aggregates (
  publication_run_id uuid not null references public.dld_market_import_runs(import_run_id),
  aggregate_key text not null,
  entity_type text not null,
  entity_id text not null,
  name_en text not null default '',
  name_ar text not null default '',
  period_grain text not null,
  period_start date not null,
  period_end date not null,
  metric_code text not null,
  segment_type text not null,
  segment_code text not null,
  metric_value numeric not null,
  observation_count integer not null,
  confidence text not null,
  quality_flags jsonb not null,
  source_export_date date not null,
  methodology_version text not null,
  primary key (publication_run_id,aggregate_key)
);

create table if not exists public.dld_market_publication_state (
  singleton boolean primary key default true check (singleton),
  active_run_id uuid references public.dld_market_import_runs(import_run_id),
  activated_at timestamptz
);
insert into public.dld_market_publication_state(singleton) values(true) on conflict do nothing;

alter table public.dld_market_import_runs enable row level security;
alter table public.dld_market_scope_registry enable row level security;
alter table public.dld_market_stage enable row level security;
alter table public.dld_market_aggregates enable row level security;
alter table public.dld_market_publication_state enable row level security;
revoke all on public.dld_market_import_runs,public.dld_market_scope_registry,public.dld_market_stage,public.dld_market_aggregates,public.dld_market_publication_state from public,anon,authenticated;
grant all on public.dld_market_import_runs,public.dld_market_scope_registry,public.dld_market_stage,public.dld_market_aggregates,public.dld_market_publication_state to service_role;

insert into public.dld_market_scope_registry values
('dubai','month','registered_sale_count','all',array['all'],10,'count','Dubai overview'),
('dubai','month','registered_sale_count','sale_registration',array['existing','off_plan'],10,'count','Dubai sales composition'),
('dubai','month','registered_sale_count','property_class',array['apartment','villa'],10,'count','Dubai property composition'),
('dubai','month','registered_sale_count_change','all',array['all'],30,'change','Dubai overview'),
('dubai','month','registered_sale_count_change','sale_registration',array['existing','off_plan'],30,'change','Dubai sales trends'),
('dubai','month','registered_sale_count_change','property_class',array['apartment','villa'],30,'change','Dubai property trends'),
('dubai','month','registered_rental_contract_count','all',array['all'],10,'count','Dubai rental overview'),
('dubai','month','registered_new_rental_contract_count','rental_registration',array['new'],10,'count','Dubai rental composition'),
('dubai','month','registered_renewed_rental_contract_count','rental_registration',array['renewed'],10,'count','Dubai rental composition'),
('dubai','month','registered_rental_contract_count_change','all',array['all'],30,'change','Dubai rental trends'),
('dubai','month','registered_new_rental_contract_count_change','rental_registration',array['new'],30,'change','Dubai rental trends'),
('dubai','month','registered_renewed_rental_contract_count_change','rental_registration',array['renewed'],30,'change','Dubai rental trends'),
('dubai','month','median_registered_annual_rent_aed','all',array['all'],30,'amount','Dubai rent trend'),
('dubai','month','median_registered_annual_rent_aed','rental_registration',array['new','renewed'],30,'amount','Dubai rent composition'),
('dubai','month','median_registered_annual_rent_change','all',array['all'],30,'change','Dubai rent trend'),
('dubai','month','median_registered_annual_rent_change','rental_registration',array['new','renewed'],30,'change','Dubai rent trend')
on conflict do nothing;

-- Quarter/year Dubai rows use the same bounded combinations as month.
insert into public.dld_market_scope_registry
select entity_type,g.grain,metric_code,segment_type,allowed_segment_codes,minimum_observations,value_kind,consumer
from public.dld_market_scope_registry cross join (values('quarter'),('year')) g(grain)
where entity_type='dubai' and period_grain='month'
on conflict do nothing;

insert into public.dld_market_scope_registry values
('community','month','registered_sale_count','all',array['all'],10,'count','Community sparkline'),
('community','month','registered_rental_contract_count','all',array['all'],10,'count','Community sparkline'),
('community','quarter','registered_sale_count','all',array['all'],10,'count','Community overview'),
('community','quarter','registered_sale_count_change','all',array['all'],30,'change','Community comparison'),
('community','quarter','registered_rental_contract_count','all',array['all'],10,'count','Community overview'),
('community','quarter','registered_rental_contract_count_change','all',array['all'],30,'change','Community comparison'),
('community','quarter','median_registered_annual_rent_aed','all',array['all'],30,'amount','Community overview'),
('community','quarter','median_registered_annual_rent_change','all',array['all'],30,'change','Community comparison'),
('community','year','registered_sale_count','all',array['all'],10,'count','Community annual overview'),
('community','year','registered_sale_count','sale_registration',array['existing','off_plan'],10,'count','Community annual composition'),
('community','year','registered_sale_count','property_class',array['apartment','villa'],10,'count','Community annual composition'),
('community','year','registered_sale_count_change','all',array['all'],30,'change','Community annual trend'),
('community','year','registered_rental_contract_count','all',array['all'],10,'count','Community annual overview'),
('community','year','registered_new_rental_contract_count','rental_registration',array['new'],10,'count','Community annual composition'),
('community','year','registered_renewed_rental_contract_count','rental_registration',array['renewed'],10,'count','Community annual composition'),
('community','year','registered_rental_contract_count_change','all',array['all'],30,'change','Community annual trend'),
('community','year','median_registered_annual_rent_aed','all',array['all'],30,'amount','Community annual overview'),
('community','year','median_registered_annual_rent_change','all',array['all'],30,'change','Community annual trend'),
('project','quarter','registered_sale_count','all',array['all'],10,'count','Project recorded activity'),
('project','year','registered_sale_count','all',array['all'],10,'count','Project recorded activity'),
('developer','quarter','registered_sale_count','all',array['all'],10,'count','Developer recorded activity'),
('developer','year','registered_sale_count','all',array['all'],10,'count','Developer recorded activity')
on conflict do nothing;

create index if not exists dld_market_stage_run_scope_idx on public.dld_market_stage(import_run_id,entity_type,period_grain,metric_code);
create index if not exists dld_market_aggregate_series_idx on public.dld_market_aggregates(publication_run_id,entity_type,entity_id,metric_code,period_grain,period_start);
create index if not exists dld_market_aggregate_compare_idx on public.dld_market_aggregates(publication_run_id,entity_type,metric_code,period_grain,period_start,entity_id);
create index if not exists dld_market_aggregate_name_en_idx on public.dld_market_aggregates(publication_run_id,entity_type,(lower(name_en)) text_pattern_ops);
create index if not exists dld_market_aggregate_name_ar_idx on public.dld_market_aggregates(publication_run_id,entity_type,(lower(name_ar)) text_pattern_ops);

create or replace function public.dld_market_derive_aggregate_key(entity_type text,entity_id text,period_grain text,period_start date,period_end date,metric_code text,segment_type text,segment_code text,methodology_version text)
returns text language sql immutable strict set search_path='' as $$
  select encode(extensions.digest(convert_to(concat_ws(chr(31),entity_type,entity_id,period_grain,period_start::text,period_end::text,metric_code,segment_type,segment_code,methodology_version),'UTF8'),'sha256'),'hex')
$$;
revoke all on function public.dld_market_derive_aggregate_key(text,text,text,date,date,text,text,text,text) from public,anon,authenticated;
grant execute on function public.dld_market_derive_aggregate_key(text,text,text,date,date,text,text,text,text) to service_role;

create or replace function public.stage_dld_market_rows(target_run_id uuid,target_chunk text,rows jsonb)
returns integer language plpgsql security definer set search_path='' as $$
declare staged integer;
begin
  if auth.role() <> 'service_role' then raise exception 'service role required'; end if;
  if jsonb_typeof(rows) <> 'array' or jsonb_array_length(rows) > 10000 then raise exception 'invalid batch'; end if;
  insert into public.dld_market_stage
  select target_run_id,target_chunk,r.aggregate_key,r.entity_type,r.entity_id,coalesce(r.name_en,''),coalesce(r.name_ar,''),
    r.period_grain,r.period_start,r.period_end,r.metric_code,r.segment_type,r.segment_code,r.metric_value,
    r.observation_count,r.confidence,coalesce(r.quality_flags,'[]'::jsonb),r.source_export_date,r.methodology_version
  from jsonb_to_recordset(rows) as r(aggregate_key text,entity_type text,entity_id text,name_en text,name_ar text,
    period_grain text,period_start date,period_end date,metric_code text,segment_type text,segment_code text,
    metric_value numeric,observation_count integer,confidence text,quality_flags jsonb,source_export_date date,methodology_version text)
  on conflict (import_run_id,aggregate_key) do update set
    chunk_name=excluded.chunk_name,entity_type=excluded.entity_type,entity_id=excluded.entity_id,name_en=excluded.name_en,name_ar=excluded.name_ar,
    period_grain=excluded.period_grain,period_start=excluded.period_start,period_end=excluded.period_end,metric_code=excluded.metric_code,
    segment_type=excluded.segment_type,segment_code=excluded.segment_code,metric_value=excluded.metric_value,
    observation_count=excluded.observation_count,confidence=excluded.confidence,quality_flags=excluded.quality_flags,
    source_export_date=excluded.source_export_date,methodology_version=excluded.methodology_version;
  get diagnostics staged=row_count;
  return staged;
end $$;

create or replace function public.validate_dld_market_import(target_run_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare run public.dld_market_import_runs%rowtype; errors jsonb; actual bigint;
begin
  if auth.role() <> 'service_role' then raise exception 'service role required'; end if;
  select * into run from public.dld_market_import_runs where import_run_id=target_run_id for update;
  if not found then raise exception 'import run not found'; end if;
  if run.schema_version <> 'dld-market-transfer/1' then raise exception 'unsupported schema version'; end if;
  if exists(select 1 from jsonb_each(run.expected_counts) e where e.key !~ '^(dubai|community|project|developer)\|(month|quarter|year)\|[a-z0-9_]+$' or jsonb_typeof(e.value)<>'number' or e.value::text !~ '^(0|[1-9][0-9]*)$') then raise exception 'invalid expected_counts'; end if;
  select count(*) into actual from public.dld_market_stage where import_run_id=target_run_id;
  if actual <> run.expected_total then raise exception 'staged_count_mismatch: expected %, actual %',run.expected_total,actual; end if;
  if (select coalesce(sum((value::text)::bigint),0) from jsonb_each(run.expected_counts)) <> run.expected_total then raise exception 'manifest count mismatch'; end if;
  if exists(
    select 1 from public.dld_market_stage s left join public.dld_market_scope_registry r
      on (r.entity_type,r.period_grain,r.metric_code,r.segment_type)=(s.entity_type,s.period_grain,s.metric_code,s.segment_type)
    where s.import_run_id=target_run_id and (r.entity_type is null or not s.segment_code=any(r.allowed_segment_codes))
  ) then raise exception 'metric/scope allowlist validation failed'; end if;
  if exists(select 1 from public.dld_market_stage where import_run_id=target_run_id and (observation_count < 10 or observation_count < case when metric_code like '%_change' or metric_code='median_registered_annual_rent_aed' then 30 else 10 end)) then raise exception 'suppression threshold failed'; end if;
  if exists(select 1 from public.dld_market_stage where import_run_id=target_run_id and (
    (metric_code like '%_count' and metric_value<>observation_count)
    or (metric_code='median_registered_annual_rent_aed' and metric_value<=0)
  )) then raise exception 'metric value type/range validation failed'; end if;
  if exists(select 1 from public.dld_market_stage where import_run_id=target_run_id and (period_start < date '2010-01-01' or period_end >= case period_grain when 'month' then date_trunc('month',source_export_date)::date when 'quarter' then date_trunc('quarter',source_export_date)::date when 'year' then date_trunc('year',source_export_date)::date else date '0001-01-01' end)) then raise exception 'completed period validation failed'; end if;
  if exists(select 1 from public.dld_market_stage where import_run_id=target_run_id and (source_export_date<>run.source_export_date or methodology_version<>run.methodology_version or confidence not in ('higher','moderate','counts_only') or jsonb_typeof(quality_flags)<>'array')) then raise exception 'row metadata validation failed'; end if;
  if exists(select aggregate_key from public.dld_market_stage where import_run_id=target_run_id group by aggregate_key having count(*)>1) then raise exception 'duplicate aggregate key'; end if;
  if exists(select 1 from public.dld_market_stage s where s.import_run_id=target_run_id and s.aggregate_key<>public.dld_market_derive_aggregate_key(s.entity_type,s.entity_id,s.period_grain,s.period_start,s.period_end,s.metric_code,s.segment_type,s.segment_code,s.methodology_version)) then raise exception 'aggregate key derivation failed'; end if;
  if exists(select 1 from public.dld_market_stage where import_run_id=target_run_id and (entity_id='' or entity_id ~* '^(developer|project|community):' or entity_type not in ('dubai','community','project','developer'))) then raise exception 'unsafe entity identity'; end if;
  if exists(select 1 from public.dld_market_stage s where s.import_run_id=target_run_id and s.entity_type='project' and (select count(*) from public.dld_directory_projects p where p.project_number=s.entity_id)<>1) then raise exception 'unmatched or ambiguous public project identifier'; end if;
  if exists(select 1 from public.dld_market_stage s where s.import_run_id=target_run_id and s.entity_type='developer' and (select count(*) from public.dld_directory_developers d where d.developer_number=s.entity_id)<>1) then raise exception 'unmatched or ambiguous public developer identifier'; end if;
  if exists(select 1 from public.dld_market_stage where import_run_id=target_run_id and (
    period_start<>case period_grain when 'month' then date_trunc('month',period_start)::date when 'quarter' then date_trunc('quarter',period_start)::date when 'year' then date_trunc('year',period_start)::date end
    or period_end<>case period_grain when 'month' then (date_trunc('month',period_start)+interval '1 month'-interval '1 day')::date when 'quarter' then (date_trunc('quarter',period_start)+interval '3 months'-interval '1 day')::date when 'year' then (date_trunc('year',period_start)+interval '1 year'-interval '1 day')::date end
  )) then raise exception 'invalid period boundary'; end if;
  if exists(
    select 1 from (
      select entity_type||'|'||period_grain||'|'||metric_code key,count(*) count
      from public.dld_market_stage where import_run_id=target_run_id group by 1
    ) a full join jsonb_each_text(run.expected_counts) e on e.key=a.key
    where coalesce(a.count,-1)<>coalesce(e.value::bigint,-1)
  ) then raise exception 'manifest grouped count mismatch'; end if;
  errors='[]'::jsonb;
  update public.dld_market_import_runs set status='validated',validation_report=errors,validated_at=now() where import_run_id=target_run_id;
  return jsonb_build_object('ok',true,'rows',actual,'errors',errors);
end $$;

create or replace function public.publish_dld_market_import(target_run_id uuid)
returns text language plpgsql security definer set search_path='' as $$
declare run_status text;
begin
  if auth.role() <> 'service_role' then raise exception 'service role required'; end if;
  perform pg_advisory_xact_lock(hashtext('dld_market_publication'));
  select status into run_status from public.dld_market_import_runs where import_run_id=target_run_id for update;
  if run_status='published' then return 'already_published'; end if;
  perform public.validate_dld_market_import(target_run_id);
  delete from public.dld_market_aggregates where publication_run_id=target_run_id;
  insert into public.dld_market_aggregates
  select import_run_id,aggregate_key,entity_type,entity_id,name_en,name_ar,period_grain,period_start,period_end,
    metric_code,segment_type,segment_code,metric_value,observation_count,confidence,quality_flags,source_export_date,methodology_version
  from public.dld_market_stage where import_run_id=target_run_id;
  update public.dld_market_publication_state set active_run_id=target_run_id,activated_at=now() where singleton;
  update public.dld_market_import_runs set status='published',published_at=now() where import_run_id=target_run_id;
  return 'published';
end $$;

create or replace function public.activate_dld_market_publication(target_run_id uuid)
returns void language plpgsql security definer set search_path='' as $$
begin
  if auth.role() <> 'service_role' then raise exception 'service role required'; end if;
  if not exists(select 1 from public.dld_market_import_runs where import_run_id=target_run_id and status='published') then raise exception 'published run not found'; end if;
  perform pg_advisory_xact_lock(hashtext('dld_market_publication'));
  update public.dld_market_publication_state set active_run_id=target_run_id,activated_at=now() where singleton;
end $$;

create or replace view public.dld_market_public as
select a.aggregate_key,a.entity_type,a.entity_id,a.name_en,a.name_ar,a.period_grain,a.period_start,a.period_end,
  a.metric_code,a.segment_type,a.segment_code,a.metric_value,a.observation_count,a.confidence,a.quality_flags,
  a.source_export_date,a.methodology_version
from public.dld_market_aggregates a join public.dld_market_publication_state p on p.active_run_id=a.publication_run_id and p.singleton;
revoke all on public.dld_market_public from public;

create or replace function public.dld_market_scope_allowed(requested_entity text,requested_grain text,requested_metric text)
returns boolean language sql stable security definer set search_path='' as $$
  select requested_entity in ('dubai','community','project','developer')
    and requested_grain in ('month','quarter','year')
    and exists(select 1 from public.dld_market_scope_registry r where r.entity_type=requested_entity and r.period_grain=requested_grain and r.metric_code=requested_metric)
$$;
revoke all on function public.dld_market_scope_allowed(text,text,text) from public,anon,authenticated;

create or replace function public.get_dld_market_overview(requested_metrics text[],requested_grain text,from_date date,to_date date,result_limit integer default 500)
returns setof public.dld_market_public language sql stable security definer set search_path='' as $$
  select v.* from public.dld_market_public v where cardinality(requested_metrics) between 1 and 10
    and not exists(select 1 from unnest(requested_metrics) m where not public.dld_market_scope_allowed('dubai',requested_grain,m))
    and v.entity_type='dubai' and v.period_grain=requested_grain
    and v.metric_code=any(requested_metrics[1:10]) and v.period_start between from_date and least(to_date,from_date+interval '20 years')
  order by v.period_start,v.metric_code,v.segment_type,v.segment_code limit greatest(1,least(result_limit,2000))
$$;

create or replace function public.get_dld_market_entity_series(requested_entity_type text,requested_entity_id text,requested_metric text,requested_grain text,from_date date,to_date date,result_limit integer default 200)
returns setof public.dld_market_public language sql stable security definer set search_path='' as $$
  select v.* from public.dld_market_public v where public.dld_market_scope_allowed(requested_entity_type,requested_grain,requested_metric)
    and v.entity_type=requested_entity_type and v.entity_id=requested_entity_id
    and v.metric_code=requested_metric and v.period_grain=requested_grain and v.period_start between from_date and least(to_date,from_date+interval '20 years')
  order by v.period_start,v.segment_type,v.segment_code limit greatest(1,least(result_limit,1000))
$$;

create or replace function public.compare_dld_market_communities(community_ids text[],requested_metric text,requested_grain text,requested_period date,result_limit integer default 50)
returns setof public.dld_market_public language sql stable security definer set search_path='' as $$
  select v.* from public.dld_market_public v where cardinality(community_ids) between 1 and 20
    and public.dld_market_scope_allowed('community',requested_grain,requested_metric)
    and v.entity_type='community' and v.entity_id=any(community_ids[1:20])
    and v.metric_code=requested_metric and v.period_grain=requested_grain and v.period_start=requested_period
  order by v.name_en,v.entity_id limit greatest(1,least(result_limit,100))
$$;

create or replace function public.search_dld_market_entities(query text,requested_types text[] default array['community','project','developer'],result_limit integer default 20,result_offset integer default 0)
returns table(entity_type text,entity_id text,name_en text,name_ar text,source_export_date date,methodology_version text)
language sql stable security definer set search_path='' as $$
  select distinct v.entity_type,v.entity_id,v.name_en,v.name_ar,v.source_export_date,v.methodology_version
  from public.dld_market_public v where cardinality(requested_types) between 1 and 3 and requested_types <@ array['community','project','developer']::text[]
    and length(query) between 1 and 100 and v.entity_type=any(requested_types[1:3])
    and (lower(v.name_en) like lower(query)||'%' or lower(v.name_ar) like lower(query)||'%' or v.entity_id=query)
  order by v.name_en,v.entity_id limit greatest(1,least(result_limit,50)) offset greatest(0,least(result_offset,5000))
$$;

create or replace function public.get_dld_market_metadata()
returns table(source_export_date date,methodology_version text,published_at timestamptz,row_count bigint)
language sql stable security definer set search_path='' as $$
  select max(a.source_export_date),max(a.methodology_version),max(r.published_at),count(*)
  from public.dld_market_public a join public.dld_market_publication_state p on p.singleton
  join public.dld_market_import_runs r on r.import_run_id=p.active_run_id
$$;

revoke all on function public.stage_dld_market_rows(uuid,text,jsonb),public.validate_dld_market_import(uuid),public.publish_dld_market_import(uuid),public.activate_dld_market_publication(uuid) from public,anon,authenticated;
grant execute on function public.stage_dld_market_rows(uuid,text,jsonb),public.validate_dld_market_import(uuid),public.publish_dld_market_import(uuid),public.activate_dld_market_publication(uuid) to service_role;
revoke all on function public.get_dld_market_overview(text[],text,date,date,integer),public.get_dld_market_entity_series(text,text,text,text,date,date,integer),public.compare_dld_market_communities(text[],text,text,date,integer),public.search_dld_market_entities(text,text[],integer,integer),public.get_dld_market_metadata() from public;
grant execute on function public.get_dld_market_overview(text[],text,date,date,integer),public.get_dld_market_entity_series(text,text,text,text,date,date,integer),public.compare_dld_market_communities(text[],text,text,date,integer),public.search_dld_market_entities(text,text[],integer,integer),public.get_dld_market_metadata() to anon,authenticated;
