-- Roles, admin access and media storage.
--
-- Roles live in their own table rather than a column on `agents` or in the JWT:
--   * a column on a table users can update is a privilege-escalation waiting to
--     happen, and
--   * `has_role()` is SECURITY DEFINER so policies on other tables can call it
--     without tripping over recursive row-level security.

create type app_role as enum ('admin', 'agent');

create table user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table user_roles enable row level security;

-- SECURITY DEFINER so it reads user_roles regardless of the caller's own
-- policies. `set search_path` keeps a malicious search_path from redirecting it.
create or replace function has_role(check_user_id uuid, check_role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from user_roles
    where user_id = check_user_id and role = check_role
  );
$$;

-- A signed-in user may see their own roles. Nobody may grant a role through the
-- API: role changes go through the service role or SQL.
create policy "Users read their own roles"
  on user_roles for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Admins read all roles"
  on user_roles for select
  to authenticated
  using (has_role((select auth.uid()), 'admin'));

-- ---------------------------------------------------------------------------
-- Admin access to content
-- ---------------------------------------------------------------------------

-- One policy per table rather than a loop, so each is visible in the dashboard
-- and can be tightened individually later.
create policy "Admins manage areas" on areas for all to authenticated
  using (has_role((select auth.uid()), 'admin')) with check (has_role((select auth.uid()), 'admin'));

create policy "Admins manage developers" on developers for all to authenticated
  using (has_role((select auth.uid()), 'admin')) with check (has_role((select auth.uid()), 'admin'));

create policy "Admins manage agents" on agents for all to authenticated
  using (has_role((select auth.uid()), 'admin')) with check (has_role((select auth.uid()), 'admin'));

create policy "Admins manage projects" on projects for all to authenticated
  using (has_role((select auth.uid()), 'admin')) with check (has_role((select auth.uid()), 'admin'));

create policy "Admins manage properties" on properties for all to authenticated
  using (has_role((select auth.uid()), 'admin')) with check (has_role((select auth.uid()), 'admin'));

create policy "Admins manage guides" on guides for all to authenticated
  using (has_role((select auth.uid()), 'admin')) with check (has_role((select auth.uid()), 'admin'));

create policy "Admins manage blog posts" on blog_posts for all to authenticated
  using (has_role((select auth.uid()), 'admin')) with check (has_role((select auth.uid()), 'admin'));

create policy "Admins manage testimonials" on testimonials for all to authenticated
  using (has_role((select auth.uid()), 'admin')) with check (has_role((select auth.uid()), 'admin'));

-- Admins see and work the whole pipeline; consultants keep the narrower
-- own-leads policies from the previous migration.
create policy "Admins manage leads" on leads for all to authenticated
  using (has_role((select auth.uid()), 'admin')) with check (has_role((select auth.uid()), 'admin'));

-- ---------------------------------------------------------------------------
-- Lead activity — an audit trail for the inbox
-- ---------------------------------------------------------------------------

create table lead_notes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads (id) on delete cascade,
  author_id uuid,
  body text not null,
  created_at timestamptz not null default now()
);

create index lead_notes_lead_idx on lead_notes (lead_id, created_at desc);

alter table lead_notes enable row level security;

create policy "Admins manage lead notes" on lead_notes for all to authenticated
  using (has_role((select auth.uid()), 'admin')) with check (has_role((select auth.uid()), 'admin'));

-- A consultant may read and add notes on a lead that is theirs.
create policy "Agents read notes on their leads" on lead_notes for select to authenticated
  using (
    exists (
      select 1 from leads
      join agents on agents.id = leads.assigned_agent_id
      where leads.id = lead_notes.lead_id
        and agents.auth_user_id = (select auth.uid())
    )
  );

create policy "Agents add notes to their leads" on lead_notes for insert to authenticated
  with check (
    exists (
      select 1 from leads
      join agents on agents.id = leads.assigned_agent_id
      where leads.id = lead_notes.lead_id
        and agents.auth_user_id = (select auth.uid())
    )
  );
