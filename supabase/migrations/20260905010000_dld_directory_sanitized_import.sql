-- Phase 1D: additive sanitized JSONL publication contract. Prepared locally; unapplied.
-- The legacy Phase 1A publisher remains unchanged for backwards compatibility.

create extension if not exists pgcrypto with schema extensions;

alter table public.dld_directory_import_runs
  add column if not exists validation_report jsonb,
  add column if not exists manifest_sha256 text;

do $$ begin
  if not exists (select 1 from pg_constraint where conname='dld_directory_import_runs_manifest_sha256_check') then
    alter table public.dld_directory_import_runs add constraint dld_directory_import_runs_manifest_sha256_check
      check (manifest_sha256 is null or manifest_sha256 ~ '^[0-9a-f]{64}$');
  end if;
end $$;

create table if not exists public.dld_directory_transfer_limits (
  entity_type text primary key,
  maximum_count bigint not null check (maximum_count > 0),
  updated_at timestamptz not null default now()
);
alter table public.dld_directory_transfer_limits enable row level security;
revoke all on public.dld_directory_transfer_limits from public, anon, authenticated;
grant all on public.dld_directory_transfer_limits to service_role;
insert into public.dld_directory_transfer_limits(entity_type,maximum_count) values
  ('communities',10000),('developers',100000),('projects',100000),
  ('brokers',250000),('broker_office_links',500000),('offices',100000),
  ('office_activities',250000),('licences',250000),('permits',2000000),
  ('valuators',50000),('escrow_agents',10000),('owner_associations',50000),
  ('free_zone_companies',100000)
on conflict (entity_type) do nothing;

create or replace function public.dld_directory_transfer_fields(entity text)
returns text[] language sql immutable set search_path = '' as $$
  select case entity
    when 'communities' then array['municipality_number','name_en','name_ar','source_export_date','source_dataset']
    when 'developers' then array['developer_number','name_en','name_ar','registration_date','licence_number','licence_source_en','licence_source_ar','licence_issue_date','licence_expiry_date','legal_status_en','legal_status_ar','source_export_date','source_dataset']
    when 'escrow_agents' then array['escrow_agent_number','name_en','name_ar','source_export_date','source_dataset']
    when 'offices' then array['office_number','name_en','name_ar','licence_number','licence_source_en','licence_source_ar','licence_issue_date','licence_expiry_date','is_branch','source_export_date','source_dataset']
    when 'brokers' then array['broker_number','name_en','name_ar','licence_start_date','licence_end_date','source_export_date','source_dataset']
    when 'projects' then array['project_number','source_name','name_en','name_ar','developer_number','developer_relationship_state','master_developer_number','community_municipality_number','community_name_en','community_name_ar','community_relationship_state','escrow_agent_number','escrow_relationship_state','area_name_en','area_name_ar','status_en','status_ar','percent_completed','project_start_date','project_end_date','completion_date','cancellation_date','no_of_units','no_of_villas','no_of_buildings','source_export_date','source_dataset']
    when 'office_activities' then array['office_number','activity_type_id','activity_name_en','activity_name_ar','ded_activity_code','source_export_date','source_dataset']
    when 'broker_office_links' then array['broker_number','office_number','office_relationship_state','licence_start_date','licence_end_date','source_export_date','source_dataset']
    when 'licences' then array['activity_type_id','activity_name_en','activity_name_ar','licence_number','trade_name_en','trade_name_ar','status_en','status_ar','issue_date','expiry_date','cancel_date','legal_type_en','legal_type_ar','ded_activity_code','authority_id','office_number','office_relationship_state','developer_number','developer_relationship_state','source_export_date','source_dataset']
    when 'permits' then array['permit_number','licence_number','participant_name_en','participant_name_ar','service_id','service_en','service_ar','main_service_en','main_service_ar','status_en','status_ar','start_date','end_date','exhibition_name_en','exhibition_name_ar','source_export_date','source_dataset']
    when 'valuators' then array['valuator_number','name_en','name_ar','valuation_company_number','company_name_en','company_name_ar','licence_start_date','licence_end_date','source_export_date','source_dataset']
    when 'owner_associations' then array['name_en','name_ar','source_export_date','source_dataset']
    when 'free_zone_companies' then array['company_number','name_en','name_ar','licence_number','licence_source_en','licence_source_ar','licence_issue_date','licence_expiry_date','source_export_date','source_dataset']
  end
$$;

create or replace function public.dld_directory_derive_key(entity text, transfer_source_key text)
returns text language sql immutable strict set search_path = '' as $$
  select 'd1_' || encode(extensions.digest(convert_to('phase1d-sanitized-v1' || chr(31) || entity || chr(31) || transfer_source_key, 'UTF8'), 'sha256'), 'hex')
$$;

create or replace function public.dld_directory_build_aliases(values_to_index text[])
returns text language sql immutable set search_path = '' as $$
  select coalesce(string_agg(value, ' ' order by ordinal), '')
  from (
    select public.dld_directory_normalize_query(value) value, min(ordinality) ordinal
    from unnest(coalesce(values_to_index, array[]::text[])) with ordinality as u(value, ordinality)
    where value is not null and public.dld_directory_normalize_query(value) <> ''
    group by public.dld_directory_normalize_query(value)
  ) normalized
$$;

revoke all on function public.dld_directory_transfer_fields(text) from public, anon, authenticated;
revoke all on function public.dld_directory_derive_key(text,text) from public, anon, authenticated;
revoke all on function public.dld_directory_build_aliases(text[]) from public, anon, authenticated;
grant execute on function public.dld_directory_transfer_fields(text) to service_role;
grant execute on function public.dld_directory_derive_key(text,text) to service_role;
grant execute on function public.dld_directory_build_aliases(text[]) to service_role;

create or replace function public.validate_dld_directory_sanitized(target_run_id uuid)
returns table(severity text, entity_type text, source_key text, code text, detail text)
language plpgsql security definer set search_path = '' as $$
declare
  entity text;
  allowed text[];
  counts jsonb;
  manifest_counts jsonb;
  manifest_schema text;
  expected bigint;
  actual bigint;
  total_expected numeric;
  relationship record;
  entities constant text[] := array['communities','developers','escrow_agents','offices','brokers','projects','office_activities','broker_office_links','licences','permits','valuators','owner_associations','free_zone_companies'];
begin
  select r.expected_counts,r.source_manifest->'expected_counts',r.source_manifest->>'schema_version'
    into counts,manifest_counts,manifest_schema
  from public.dld_directory_import_runs r where r.import_run_id=target_run_id;
  if not found then
    return query select 'error'::text,'<manifest>'::text,null::text,'missing_import_run'::text,'Import run does not exist'::text;
    return;
  end if;
  if jsonb_typeof(counts) is distinct from 'object' then
    return query select 'error'::text,'<manifest>'::text,null::text,'malformed_expected_counts'::text,'expected_counts must be a JSON object'::text;
    return;
  end if;
  if manifest_schema is distinct from 'dld-directory-transfer/1' then
    return query select 'error'::text,'<manifest>'::text,null::text,'unsupported_schema_version'::text,'Unsupported Phase 1D transfer schema'::text;
  end if;
  if manifest_counts is distinct from counts then
    return query select 'error'::text,'<manifest>'::text,null::text,'manifest_count_contract_mismatch'::text,'source_manifest.expected_counts must exactly equal the import run expected_counts'::text;
  end if;
  return query
  select 'error'::text,'<manifest>'::text,null::text,'unknown_entity_count'::text,format('Unknown expected_counts key: %s',key)
  from jsonb_object_keys(counts) key where not (key=any(entities));
  return query
  select 'error'::text,'<manifest>'::text,null::text,'missing_entity_count'::text,format('Missing expected_counts key: %s',required)
  from unnest(entities) required where not (counts ? required);
  return query
  select 'error'::text,'<manifest>'::text,null::text,'invalid_entity_count'::text,format('Count for %s must be a non-negative JSON integer',entry.key)
  from jsonb_each(counts) entry
  where entry.key=any(entities) and (jsonb_typeof(entry.value)<>'number' or entry.value::text !~ '^(0|[1-9][0-9]*)$');
  return query
  select 'error'::text,'<manifest>'::text,null::text,'missing_entity_limit'::text,format('No configured maximum for %s',required)
  from unnest(entities) required left join public.dld_directory_transfer_limits l on l.entity_type=required
  where l.entity_type is null;
  return query
  select 'error'::text,'<manifest>'::text,null::text,'excessive_entity_count'::text,
         format('Count for %s exceeds configured maximum %s',entry.key,l.maximum_count)
  from jsonb_each(counts) entry join public.dld_directory_transfer_limits l on l.entity_type=entry.key
  where jsonb_typeof(entry.value)='number' and entry.value::text ~ '^(0|[1-9][0-9]*)$'
    and (entry.value::text)::numeric>l.maximum_count;
  if not exists(select 1 from jsonb_object_keys(counts) key where not (key=any(entities)))
     and not exists(select 1 from unnest(entities) required where not (counts ? required))
     and not exists(select 1 from jsonb_each(counts) entry where jsonb_typeof(entry.value)<>'number' or entry.value::text !~ '^(0|[1-9][0-9]*)$')
     and not exists(select 1 from unnest(entities) required left join public.dld_directory_transfer_limits l on l.entity_type=required where l.entity_type is null)
     and not exists(select 1 from jsonb_each(counts) entry join public.dld_directory_transfer_limits l on l.entity_type=entry.key where (entry.value::text)::numeric>l.maximum_count) then
    select sum((entry.value::text)::numeric) into total_expected from jsonb_each(counts) entry;
    if total_expected=0 then
      return query select 'error'::text,'<manifest>'::text,null::text,'zero_total_records'::text,'Total expected records must be greater than zero'::text;
    end if;
    foreach entity in array entities loop
      expected := (counts->>entity)::bigint;
      select count(*) into actual from public.dld_directory_stage s where s.import_run_id=target_run_id and s.entity_type=entity;
      if expected<>actual then
        return query select 'error'::text,entity,null::text,'staged_count_mismatch'::text,format('Manifest count %s, staged count %s',expected,actual);
      end if;
    end loop;
  end if;

  return query
  select 'error', coalesce(s.entity_type, '<null>'), s.source_key, 'invalid_entity_type', 'Entity type is not part of the Phase 1D contract'
  from public.dld_directory_stage s
  where s.import_run_id=target_run_id and not (s.entity_type=any(entities));

  foreach entity in array entities loop
    allowed := public.dld_directory_transfer_fields(entity);
    return query
    select 'error', s.entity_type, s.source_key, 'invalid_source_key', 'source_key must be a lowercase SHA-256'
    from public.dld_directory_stage s
    where s.import_run_id=target_run_id and s.entity_type=entity and s.source_key !~ '^[0-9a-f]{64}$';

    return query
    select 'error', s.entity_type, s.source_key, 'payload_schema_mismatch',
           format('Payload keys differ from the allowlist for %s', entity)
    from public.dld_directory_stage s
    where s.import_run_id=target_run_id and s.entity_type=entity and (
      jsonb_typeof(s.payload) <> 'object'
      or exists (select 1 from jsonb_object_keys(case when jsonb_typeof(s.payload)='object' then s.payload else '{}'::jsonb end) k where not (k=any(allowed)))
      or exists (select 1 from unnest(allowed) k where not (s.payload ? k))
    );
  end loop;

  -- Stable public identifiers used for exact relationship resolution must not collide.
  for relationship in
    select * from (values
      ('developers','developer_number'),('brokers','broker_number'),('offices','office_number'),
      ('projects','project_number'),('permits','permit_number'),('escrow_agents','escrow_agent_number'),
      ('free_zone_companies','company_number')
    ) r(parent_entity, number_field)
  loop
    return query execute format(
      'select ''error'', %L, min(source_key), ''duplicate_stable_identifier'', format(''%%s occurs %%s times'', payload->>%L, count(*))
       from public.dld_directory_stage where import_run_id=$1 and entity_type=%L
       group by payload->>%L having payload->>%L is null or payload->>%L='''' or count(*)>1',
      relationship.parent_entity, relationship.number_field, relationship.parent_entity,
      relationship.number_field, relationship.number_field, relationship.number_field
    ) using target_run_id;
  end loop;

  return query
  select 'error','communities',min(s.source_key),'ambiguous_community_identity','Community public composite identity is duplicated'
  from public.dld_directory_stage s where s.import_run_id=target_run_id and s.entity_type='communities'
  group by s.payload->>'municipality_number',s.payload->>'name_en',s.payload->>'name_ar' having count(*)>1;

  -- Relationship rules: matched requires exactly one parent; none/unmatched must carry no identifier.
  return query
  with refs as (
    select s.entity_type,s.source_key,'developer' rel,s.payload->>'developer_relationship_state' state,s.payload->>'developer_number' number,
      (select count(*) from public.dld_directory_stage p where p.import_run_id=target_run_id and p.entity_type='developers' and p.payload->>'developer_number'=s.payload->>'developer_number') matches
    from public.dld_directory_stage s where s.import_run_id=target_run_id and s.entity_type='projects'
    union all select s.entity_type,s.source_key,'master_developer','matched',s.payload->>'master_developer_number',
      (select count(*) from public.dld_directory_stage p where p.import_run_id=target_run_id and p.entity_type='developers' and p.payload->>'developer_number'=s.payload->>'master_developer_number')
    from public.dld_directory_stage s where s.import_run_id=target_run_id and s.entity_type='projects'
    union all select s.entity_type,s.source_key,'escrow_agent',s.payload->>'escrow_relationship_state',s.payload->>'escrow_agent_number',
      (select count(*) from public.dld_directory_stage p where p.import_run_id=target_run_id and p.entity_type='escrow_agents' and p.payload->>'escrow_agent_number'=s.payload->>'escrow_agent_number')
    from public.dld_directory_stage s where s.import_run_id=target_run_id and s.entity_type='projects'
    union all select s.entity_type,s.source_key,'broker','matched',s.payload->>'broker_number',
      (select count(*) from public.dld_directory_stage p where p.import_run_id=target_run_id and p.entity_type='brokers' and p.payload->>'broker_number'=s.payload->>'broker_number')
    from public.dld_directory_stage s where s.import_run_id=target_run_id and s.entity_type='broker_office_links'
    union all select s.entity_type,s.source_key,'office',s.payload->>'office_relationship_state',s.payload->>'office_number',
      (select count(*) from public.dld_directory_stage p where p.import_run_id=target_run_id and p.entity_type='offices' and p.payload->>'office_number'=s.payload->>'office_number')
    from public.dld_directory_stage s where s.import_run_id=target_run_id and s.entity_type in ('broker_office_links','licences')
    union all select s.entity_type,s.source_key,'developer',s.payload->>'developer_relationship_state',s.payload->>'developer_number',
      (select count(*) from public.dld_directory_stage p where p.import_run_id=target_run_id and p.entity_type='developers' and p.payload->>'developer_number'=s.payload->>'developer_number')
    from public.dld_directory_stage s where s.import_run_id=target_run_id and s.entity_type='licences'
    union all select s.entity_type,s.source_key,'office','matched',s.payload->>'office_number',
      (select count(*) from public.dld_directory_stage p where p.import_run_id=target_run_id and p.entity_type='offices' and p.payload->>'office_number'=s.payload->>'office_number')
    from public.dld_directory_stage s where s.import_run_id=target_run_id and s.entity_type='office_activities'
  )
  select case when r.state='unmatched' and r.number is null then 'warning' else 'error' end, r.entity_type, r.source_key,
    case when r.state='unmatched' and r.number is null then 'unmatched_relationship'
         when r.state is null or r.state not in ('matched','none','unmatched') then 'invalid_relationship_state'
         when r.state='matched' and r.matches=0 then 'missing_parent'
         when r.state='matched' and r.matches>1 then 'ambiguous_parent'
         else 'unexpected_relationship_identifier' end,
    format('%s relationship state=%s identifier=%s matches=%s',r.rel,r.state,coalesce(r.number,'<null>'),r.matches)
  from refs r
  where r.state='unmatched'
     or r.state is null or r.state not in ('matched','none','unmatched')
     or (r.state='matched' and (r.number is null or r.number='' or r.matches<>1))
     or (r.state in ('none','unmatched') and r.number is not null);

  return query
  select 'error'::text,'projects'::text,q.source_key,
         case when matches=0 then 'missing_parent' else 'ambiguous_parent' end,
         format('community relationship matches=%s',matches)
  from (
    select s.source_key,s.payload->>'community_relationship_state' state,(select count(*) from public.dld_directory_stage c
      where c.import_run_id=target_run_id and c.entity_type='communities'
        and c.payload->>'municipality_number' is not distinct from s.payload->>'community_municipality_number'
        and c.payload->>'name_en' is not distinct from s.payload->>'community_name_en'
        and c.payload->>'name_ar' is not distinct from s.payload->>'community_name_ar') matches
    from public.dld_directory_stage s where s.import_run_id=target_run_id and s.entity_type='projects'
  ) q where q.state is distinct from 'matched' or q.matches<>1;
end $$;

revoke all on function public.validate_dld_directory_sanitized(uuid) from public, anon, authenticated;
grant execute on function public.validate_dld_directory_sanitized(uuid) to service_role;

create or replace function public.publish_dld_directory_sanitized(target_run_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  entity text;
  first_error record;
  entities constant text[] := array['communities','developers','escrow_agents','offices','brokers','projects','office_activities','broker_office_links','licences','permits','valuators','owner_associations','free_zone_companies'];
  delete_order constant text[] := array['broker_office_links','office_activities','projects','licences','brokers','offices','developers','communities','escrow_agents','permits','valuators','owner_associations','free_zone_companies'];
begin
  perform pg_advisory_xact_lock(hashtext('dld_directory_publish'));
  if exists(select 1 from public.dld_directory_import_runs where import_run_id=target_run_id and status='published') then return; end if;
  if not exists(select 1 from public.dld_directory_import_runs where import_run_id=target_run_id and status='staging') then
    raise exception 'Unknown or non-staging DLD directory import run %',target_run_id;
  end if;
  if (select source_manifest->>'schema_version' from public.dld_directory_import_runs where import_run_id=target_run_id) <> 'dld-directory-transfer/1' then
    raise exception 'Unsupported Phase 1D transfer schema';
  end if;
  select * into first_error from public.validate_dld_directory_sanitized(target_run_id) where severity='error' limit 1;
  if found then raise exception 'Phase 1D validation failed: %/%/%: %',first_error.entity_type,first_error.source_key,first_error.code,first_error.detail; end if;

  set constraints all deferred;
  foreach entity in array delete_order loop execute format('delete from public.dld_directory_%I',entity); end loop;

  insert into public.dld_directory_communities
  select public.dld_directory_derive_key('community',source_key),payload->>'municipality_number',payload->>'name_en',payload->>'name_ar',
    public.dld_directory_build_aliases(array[payload->>'name_en',payload->>'name_ar',payload->>'municipality_number']),
    (payload->>'source_export_date')::date,payload->>'source_dataset'
  from public.dld_directory_stage where import_run_id=target_run_id and entity_type='communities' order by source_key;

  insert into public.dld_directory_developers
  select public.dld_directory_derive_key('developer',source_key),null,payload->>'developer_number',payload->>'name_en',payload->>'name_ar',
    (payload->>'registration_date')::date,payload->>'licence_number',null,payload->>'licence_source_en',payload->>'licence_source_ar',
    (payload->>'licence_issue_date')::date,(payload->>'licence_expiry_date')::date,payload->>'legal_status_en',payload->>'legal_status_ar',
    public.dld_directory_build_aliases(array[payload->>'name_en',payload->>'name_ar',payload->>'developer_number',payload->>'licence_number']),
    (payload->>'source_export_date')::date,payload->>'source_dataset'
  from public.dld_directory_stage where import_run_id=target_run_id and entity_type='developers' order by source_key;

  insert into public.dld_directory_escrow_agents
  select payload->>'escrow_agent_number',payload->>'name_en',payload->>'name_ar',
    public.dld_directory_build_aliases(array[payload->>'name_en',payload->>'name_ar',payload->>'escrow_agent_number']),
    (payload->>'source_export_date')::date,payload->>'source_dataset'
  from public.dld_directory_stage where import_run_id=target_run_id and entity_type='escrow_agents' order by source_key;

  insert into public.dld_directory_offices
  select public.dld_directory_derive_key('office',source_key),payload->>'office_number',null,payload->>'name_en',payload->>'name_ar',payload->>'licence_number',null,
    payload->>'licence_source_en',payload->>'licence_source_ar',(payload->>'licence_issue_date')::date,(payload->>'licence_expiry_date')::date,
    (payload->>'is_branch')::boolean,null,
    public.dld_directory_build_aliases(array[payload->>'name_en',payload->>'name_ar',payload->>'office_number',payload->>'licence_number']),
    (payload->>'source_export_date')::date,payload->>'source_dataset'
  from public.dld_directory_stage where import_run_id=target_run_id and entity_type='offices' order by source_key;

  insert into public.dld_directory_brokers
  select public.dld_directory_derive_key('broker',source_key),null,payload->>'broker_number',payload->>'name_en',payload->>'name_ar',
    (payload->>'licence_start_date')::date,(payload->>'licence_end_date')::date,
    public.dld_directory_build_aliases(array[payload->>'name_en',payload->>'name_ar',payload->>'broker_number']),
    (payload->>'source_export_date')::date,payload->>'source_dataset'
  from public.dld_directory_stage where import_run_id=target_run_id and entity_type='brokers' order by source_key;

  insert into public.dld_directory_projects
  select public.dld_directory_derive_key('project',s.source_key),s.payload->>'project_number',s.payload->>'source_name',s.payload->>'name_en',s.payload->>'name_ar',
    null,d.developer_id,case when d.developer_id is not null then s.payload->>'developer_number' end,null,md.developer_id,c.area_id,s.payload->>'area_name_en',s.payload->>'area_name_ar',
    null,e.escrow_agent_number,s.payload->>'status_en',s.payload->>'status_ar',(s.payload->>'percent_completed')::double precision,
    (s.payload->>'project_start_date')::date,(s.payload->>'project_end_date')::date,(s.payload->>'completion_date')::date,(s.payload->>'cancellation_date')::date,
    (s.payload->>'no_of_units')::bigint,(s.payload->>'no_of_villas')::bigint,(s.payload->>'no_of_buildings')::bigint,
    public.dld_directory_build_aliases(array[s.payload->>'source_name',s.payload->>'name_en',s.payload->>'name_ar',s.payload->>'project_number']),
    (s.payload->>'source_export_date')::date,s.payload->>'source_dataset'
  from public.dld_directory_stage s
  left join public.dld_directory_developers d on s.payload->>'developer_relationship_state'='matched' and d.developer_number=s.payload->>'developer_number'
  join public.dld_directory_developers md on md.developer_number=s.payload->>'master_developer_number'
  join public.dld_directory_communities c on c.municipality_number is not distinct from s.payload->>'community_municipality_number' and c.name_en is not distinct from s.payload->>'community_name_en' and c.name_ar is not distinct from s.payload->>'community_name_ar'
  left join public.dld_directory_escrow_agents e on s.payload->>'escrow_relationship_state'='matched' and e.escrow_agent_number=s.payload->>'escrow_agent_number'
  where s.import_run_id=target_run_id and s.entity_type='projects' order by s.source_key;

  insert into public.dld_directory_office_activities
  select public.dld_directory_derive_key('office_activity',s.source_key),o.office_id,s.payload->>'activity_type_id',s.payload->>'activity_name_en',s.payload->>'activity_name_ar',s.payload->>'ded_activity_code',
    (s.payload->>'source_export_date')::date,s.payload->>'source_dataset'
  from public.dld_directory_stage s join public.dld_directory_offices o on o.office_number=s.payload->>'office_number'
  where s.import_run_id=target_run_id and s.entity_type='office_activities' order by s.source_key;

  insert into public.dld_directory_broker_office_links
  select b.broker_id,public.dld_directory_derive_key('broker_office_relationship',s.source_key),o.office_id,
    case when o.office_id is not null then s.payload->>'office_number' end,(s.payload->>'licence_start_date')::date,(s.payload->>'licence_end_date')::date,
    (s.payload->>'source_export_date')::date,s.payload->>'source_dataset'
  from public.dld_directory_stage s join public.dld_directory_brokers b on b.broker_number=s.payload->>'broker_number'
  left join public.dld_directory_offices o on s.payload->>'office_relationship_state'='matched' and o.office_number=s.payload->>'office_number'
  where s.import_run_id=target_run_id and s.entity_type='broker_office_links' order by s.source_key;

  insert into public.dld_directory_licences
  select public.dld_directory_derive_key('licence',s.source_key),null,s.payload->>'activity_type_id',s.payload->>'activity_name_en',s.payload->>'activity_name_ar',
    s.payload->>'licence_number',s.payload->>'trade_name_en',s.payload->>'trade_name_ar',s.payload->>'status_en',s.payload->>'status_ar',
    (s.payload->>'issue_date')::date,(s.payload->>'expiry_date')::date,(s.payload->>'cancel_date')::date,s.payload->>'legal_type_en',s.payload->>'legal_type_ar',
    s.payload->>'ded_activity_code',s.payload->>'authority_id',o.office_id,d.developer_id,
    public.dld_directory_build_aliases(array[s.payload->>'trade_name_en',s.payload->>'trade_name_ar',s.payload->>'licence_number',s.payload->>'activity_name_en',s.payload->>'activity_name_ar']),
    (s.payload->>'source_export_date')::date,s.payload->>'source_dataset'
  from public.dld_directory_stage s
  left join public.dld_directory_offices o on s.payload->>'office_relationship_state'='matched' and o.office_number=s.payload->>'office_number'
  left join public.dld_directory_developers d on s.payload->>'developer_relationship_state'='matched' and d.developer_number=s.payload->>'developer_number'
  where s.import_run_id=target_run_id and s.entity_type='licences' order by s.source_key;

  insert into public.dld_directory_permits
  select public.dld_directory_derive_key('permit',source_key),payload->>'permit_number',payload->>'licence_number',payload->>'participant_name_en',payload->>'participant_name_ar',
    payload->>'service_id',payload->>'service_en',payload->>'service_ar',payload->>'main_service_en',payload->>'main_service_ar',payload->>'status_en',payload->>'status_ar',
    (payload->>'start_date')::date,(payload->>'end_date')::date,payload->>'exhibition_name_en',payload->>'exhibition_name_ar',
    public.dld_directory_build_aliases(array[payload->>'participant_name_en',payload->>'participant_name_ar',payload->>'permit_number',payload->>'licence_number',payload->>'service_en',payload->>'service_ar']),
    (payload->>'source_export_date')::date,payload->>'source_dataset'
  from public.dld_directory_stage where import_run_id=target_run_id and entity_type='permits' order by source_key;

  insert into public.dld_directory_valuators
  select public.dld_directory_derive_key('valuator',source_key),payload->>'valuator_number',payload->>'name_en',payload->>'name_ar',payload->>'valuation_company_number',payload->>'company_name_en',payload->>'company_name_ar',
    (payload->>'licence_start_date')::date,(payload->>'licence_end_date')::date,
    public.dld_directory_build_aliases(array[payload->>'name_en',payload->>'name_ar',payload->>'valuator_number',payload->>'valuation_company_number',payload->>'company_name_en',payload->>'company_name_ar']),
    (payload->>'source_export_date')::date,payload->>'source_dataset'
  from public.dld_directory_stage where import_run_id=target_run_id and entity_type='valuators' order by source_key;

  insert into public.dld_directory_owner_associations
  select public.dld_directory_derive_key('owner_association',source_key),payload->>'name_en',payload->>'name_ar',null,null,
    public.dld_directory_build_aliases(array[payload->>'name_en',payload->>'name_ar']),
    (payload->>'source_export_date')::date,payload->>'source_dataset'
  from public.dld_directory_stage where import_run_id=target_run_id and entity_type='owner_associations' order by source_key;

  insert into public.dld_directory_free_zone_companies
  select payload->>'company_number',payload->>'name_en',payload->>'name_ar',payload->>'licence_number',null,payload->>'licence_source_en',payload->>'licence_source_ar',
    (payload->>'licence_issue_date')::date,(payload->>'licence_expiry_date')::date,
    public.dld_directory_build_aliases(array[payload->>'name_en',payload->>'name_ar',payload->>'company_number',payload->>'licence_number']),
    (payload->>'source_export_date')::date,payload->>'source_dataset'
  from public.dld_directory_stage where import_run_id=target_run_id and entity_type='free_zone_companies' order by source_key;

  refresh materialized view public.dld_directory_search_index;
  update public.dld_directory_import_runs set status='published',published_at=now(),
    manifest_sha256=encode(extensions.digest(convert_to(source_manifest::text,'UTF8'),'sha256'),'hex'),
    validation_report=jsonb_build_object(
    'contract','dld-directory-transfer/1',
    'manifest_sha256',encode(extensions.digest(convert_to(source_manifest::text,'UTF8'),'sha256'),'hex'),
    'warnings',coalesce((select jsonb_agg(to_jsonb(v)) from public.validate_dld_directory_sanitized(target_run_id) v where severity='warning'),'[]'::jsonb)
  ) where import_run_id=target_run_id;
end $$;

revoke all on function public.publish_dld_directory_sanitized(uuid) from public, anon, authenticated;
grant execute on function public.publish_dld_directory_sanitized(uuid) to service_role;
