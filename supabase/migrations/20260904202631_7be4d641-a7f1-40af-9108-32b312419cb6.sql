-- Phase 1A only: additive DLD directory foundation. Prepared locally; not applied.
-- Canonical tables retain matching-only identifiers behind RLS. Public views
-- expose professional verification fields and never contact data.

create table if not exists public.dld_directory_communities (
  area_id text primary key, municipality_number text, name_en text, name_ar text,
  aliases text not null default '', source_export_date date not null, source_dataset text not null
);
create table if not exists public.dld_directory_developers (
  developer_id text primary key, participant_id text, developer_number text, name_en text, name_ar text,
  registration_date date, licence_number text, licence_source_id text, licence_source_en text, licence_source_ar text,
  licence_issue_date date, licence_expiry_date date, legal_status_en text, legal_status_ar text,
  aliases text not null default '', source_export_date date not null, source_dataset text not null
);
create table if not exists public.dld_directory_escrow_agents (
  escrow_agent_number text primary key, name_en text, name_ar text, aliases text not null default '',
  source_export_date date not null, source_dataset text not null
);
create table if not exists public.dld_directory_projects (
  project_id text primary key, project_number text unique, source_name text, name_en text, name_ar text,
  source_developer_id text, developer_id text references public.dld_directory_developers(developer_id), developer_number text,
  source_developer_name text, master_developer_id text references public.dld_directory_developers(developer_id),
  area_id text references public.dld_directory_communities(area_id), area_name_en text, area_name_ar text,
  source_escrow_agent_number text, escrow_agent_number text references public.dld_directory_escrow_agents(escrow_agent_number),
  status_en text, status_ar text, percent_completed double precision, project_start_date date, project_end_date date,
  completion_date date, cancellation_date date, no_of_units bigint, no_of_villas bigint, no_of_buildings bigint,
  aliases text not null default '', source_export_date date not null, source_dataset text not null
);
create table if not exists public.dld_directory_offices (
  office_id text primary key, office_number text, participant_id text, name_en text, name_ar text,
  licence_number text, licence_source_id text, licence_source_en text, licence_source_ar text,
  licence_issue_date date, licence_expiry_date date, is_branch boolean, main_office_id text,
  aliases text not null default '', source_export_date date not null, source_dataset text not null
);
create table if not exists public.dld_directory_office_activities (
  activity_key text primary key,
  office_id text not null references public.dld_directory_offices(office_id) on delete cascade,
  activity_type_id text, activity_name_en text, activity_name_ar text, ded_activity_code text,
  source_export_date date not null, source_dataset text not null
);
create table if not exists public.dld_directory_brokers (
  broker_id text primary key, participant_id text, broker_number text, name_en text, name_ar text,
  licence_start_date date, licence_end_date date, aliases text not null default '',
  source_export_date date not null, source_dataset text not null
);
create table if not exists public.dld_directory_broker_office_links (
  broker_id text not null references public.dld_directory_brokers(broker_id) on delete cascade,
  source_office_id text not null,
  office_id text references public.dld_directory_offices(office_id) on delete cascade,
  office_number text, licence_start_date date, licence_end_date date,
  source_export_date date not null, source_dataset text not null,
  primary key (broker_id, source_office_id)
);
create table if not exists public.dld_directory_licences (
  licence_key text primary key, participant_id text, activity_type_id text, activity_name_en text, activity_name_ar text,
  licence_number text, trade_name_en text, trade_name_ar text, status_en text, status_ar text,
  issue_date date, expiry_date date, cancel_date date, legal_type_en text, legal_type_ar text,
  ded_activity_code text, authority_id text,
  matched_office_id text references public.dld_directory_offices(office_id),
  matched_developer_id text references public.dld_directory_developers(developer_id),
  aliases text not null default '', source_export_date date not null, source_dataset text not null
);
create table if not exists public.dld_directory_permits (
  permit_id text primary key, permit_number text unique, licence_number text,
  participant_name_en text, participant_name_ar text, service_id text, service_en text, service_ar text,
  main_service_en text, main_service_ar text, status_en text, status_ar text, start_date date, end_date date,
  exhibition_name_en text, exhibition_name_ar text, aliases text not null default '',
  source_export_date date not null, source_dataset text not null
);
create table if not exists public.dld_directory_valuators (
  valuator_key text primary key, valuator_number text, name_en text, name_ar text,
  valuation_company_number text, company_name_en text, company_name_ar text,
  licence_start_date date, licence_end_date date, aliases text not null default '',
  source_export_date date not null, source_dataset text not null
);
create table if not exists public.dld_directory_owner_associations (
  association_key text primary key, name_en text, name_ar text, latitude double precision, longitude double precision,
  aliases text not null default '', source_export_date date not null, source_dataset text not null
);
create table if not exists public.dld_directory_free_zone_companies (
  company_number text primary key, name_en text, name_ar text, licence_number text unique,
  licence_source_id text, licence_source_en text, licence_source_ar text,
  licence_issue_date date, licence_expiry_date date, aliases text not null default '',
  source_export_date date not null, source_dataset text not null
);

-- Nullable bridges: editorial DLX records remain authoritative and untouched.
alter table public.areas add column if not exists dld_directory_area_id text
  references public.dld_directory_communities(area_id) on delete no action deferrable initially deferred;
alter table public.developers add column if not exists dld_directory_developer_id text
  references public.dld_directory_developers(developer_id) on delete no action deferrable initially deferred;
alter table public.projects add column if not exists dld_directory_project_id text
  references public.dld_directory_projects(project_id) on delete no action deferrable initially deferred;

create index if not exists dld_directory_developers_number_idx on public.dld_directory_developers(developer_number);
create index if not exists dld_directory_brokers_number_idx on public.dld_directory_brokers(broker_number);
create index if not exists dld_directory_offices_number_idx on public.dld_directory_offices(office_number);
create index if not exists dld_directory_licences_number_idx on public.dld_directory_licences(licence_number);
create index if not exists dld_directory_permits_number_idx on public.dld_directory_permits(permit_number);

do $$ declare t text; begin
  foreach t in array array['communities','developers','projects','brokers','broker_office_links','offices','office_activities','licences','permits','valuators','escrow_agents','owner_associations','free_zone_companies'] loop
    execute format('alter table public.dld_directory_%I enable row level security', t);
    execute format('revoke all on public.dld_directory_%I from public, anon, authenticated', t);
    execute format('grant all on public.dld_directory_%I to service_role', t);
    execute format('create policy %I on public.dld_directory_%I for all to authenticated using (public.has_role((select auth.uid()), ''admin'')) with check (public.has_role((select auth.uid()), ''admin''))', 'dld_directory_' || t || '_admin', t);
  end loop;
end $$;

create or replace view public.dld_directory_developers_public with (security_barrier=true, security_invoker=false) as
select developer_id, developer_number, name_en, name_ar, registration_date, licence_number,
       licence_source_en, licence_source_ar, licence_issue_date, licence_expiry_date,
       legal_status_en, legal_status_ar, source_export_date, source_dataset
from public.dld_directory_developers;
create or replace view public.dld_directory_projects_public with (security_barrier=true, security_invoker=false) as
select project_id, project_number, source_name, name_en, name_ar, developer_id, developer_number,
       master_developer_id, area_id, area_name_en, area_name_ar, escrow_agent_number, status_en, status_ar,
       percent_completed, project_start_date, project_end_date, completion_date, cancellation_date,
       no_of_units, no_of_villas, no_of_buildings, source_export_date, source_dataset
from public.dld_directory_projects;
create or replace view public.dld_directory_brokers_public with (security_barrier=true, security_invoker=false) as
select broker_id, broker_number, name_en, name_ar, licence_start_date, licence_end_date,
       source_export_date, source_dataset
from public.dld_directory_brokers;
create or replace view public.dld_directory_broker_office_links_public with (security_barrier=true, security_invoker=false) as
select broker_id, office_id, office_number, licence_start_date, licence_end_date,
       source_export_date, source_dataset
from public.dld_directory_broker_office_links;
create or replace view public.dld_directory_offices_public with (security_barrier=true, security_invoker=false) as
select office_id, office_number, name_en, name_ar, licence_number, licence_source_en, licence_source_ar,
       licence_issue_date, licence_expiry_date, is_branch, source_export_date, source_dataset
from public.dld_directory_offices;
create or replace view public.dld_directory_office_activities_public with (security_barrier=true, security_invoker=false) as
select activity_key, office_id, activity_type_id, activity_name_en, activity_name_ar, ded_activity_code,
       source_export_date, source_dataset
from public.dld_directory_office_activities;
create or replace view public.dld_directory_licences_public with (security_barrier=true, security_invoker=false) as
select licence_key, activity_type_id, activity_name_en, activity_name_ar, licence_number,
       trade_name_en, trade_name_ar, status_en, status_ar, issue_date, expiry_date, cancel_date,
       legal_type_en, legal_type_ar, ded_activity_code, source_export_date, source_dataset
from public.dld_directory_licences;
create or replace view public.dld_directory_permits_public with (security_barrier=true, security_invoker=false) as
select permit_id, permit_number, licence_number, participant_name_en, participant_name_ar,
       service_id, service_en, service_ar, main_service_en, main_service_ar, status_en, status_ar,
       start_date, end_date, exhibition_name_en, exhibition_name_ar, source_export_date, source_dataset
from public.dld_directory_permits;
create or replace view public.dld_directory_valuators_public with (security_barrier=true, security_invoker=false) as
select valuator_key, valuator_number, name_en, name_ar, valuation_company_number,
       company_name_en, company_name_ar, licence_start_date, licence_end_date, source_export_date, source_dataset
from public.dld_directory_valuators;
create or replace view public.dld_directory_escrow_agents_public with (security_barrier=true, security_invoker=false) as
select escrow_agent_number, name_en, name_ar, source_export_date, source_dataset from public.dld_directory_escrow_agents;
create or replace view public.dld_directory_owner_associations_public with (security_barrier=true, security_invoker=false) as
select association_key, name_en, name_ar, source_export_date, source_dataset
from public.dld_directory_owner_associations;
create or replace view public.dld_directory_communities_public with (security_barrier=true, security_invoker=false) as
select area_id, municipality_number, name_en, name_ar, source_export_date, source_dataset
from public.dld_directory_communities;
create or replace view public.dld_directory_free_zone_companies_public with (security_barrier=true, security_invoker=false) as
select company_number, name_en, name_ar, licence_number, licence_source_en, licence_source_ar,
       licence_issue_date, licence_expiry_date, source_export_date, source_dataset
from public.dld_directory_free_zone_companies;

do $$ declare v text; begin
  foreach v in array array['communities','developers','projects','brokers','broker_office_links','offices','office_activities','licences','permits','valuators','escrow_agents','owner_associations','free_zone_companies'] loop
    execute format('revoke all on public.dld_directory_%I_public from public', v);
    execute format('grant select on public.dld_directory_%I_public to anon, authenticated', v);
  end loop;
end $$;