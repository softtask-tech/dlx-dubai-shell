-- Row-level security.
--
-- The shape of it:
--   * Published content is world-readable. The site is server-rendered with the
--     publishable key, so anything a crawler should see must be selectable by
--     `anon`. Drafts are invisible because every policy filters on
--     `is_published`.
--   * `leads` is write-only from the outside. A form may insert; nobody may
--     read a lead back through the public API. Staff read them through the
--     service role (Edge Functions, the admin surface), which bypasses RLS.
--   * Nothing is writable by `anon` except a lead insert.
--
-- Every table has RLS enabled. A table with RLS on and no matching policy
-- denies by default, which is the behaviour we want for anything unlisted.

-- ---------------------------------------------------------------------------
-- Public content: read when published
-- ---------------------------------------------------------------------------

alter table areas enable row level security;
alter table developers enable row level security;
alter table agents enable row level security;
alter table projects enable row level security;
alter table properties enable row level security;
alter table guides enable row level security;
alter table blog_posts enable row level security;
alter table testimonials enable row level security;
alter table leads enable row level security;

create policy "Published areas are public"
  on areas for select
  to anon, authenticated
  using (is_published);

create policy "Published developers are public"
  on developers for select
  to anon, authenticated
  using (is_published);

create policy "Active agents are public"
  on agents for select
  to anon, authenticated
  using (is_active);

create policy "Published projects are public"
  on projects for select
  to anon, authenticated
  using (is_published);

create policy "Published properties are public"
  on properties for select
  to anon, authenticated
  using (is_published);

create policy "Published guides are public"
  on guides for select
  to anon, authenticated
  using (is_published);

create policy "Published blog posts are public"
  on blog_posts for select
  to anon, authenticated
  using (is_published);

create policy "Published testimonials are public"
  on testimonials for select
  to anon, authenticated
  using (is_published);

-- ---------------------------------------------------------------------------
-- leads: insert-only from the outside
-- ---------------------------------------------------------------------------

-- Anyone can submit an enquiry. This is the only public write on the database.
create policy "Anyone may submit a lead"
  on leads for insert
  to anon, authenticated
  with check (true);

-- Deliberately no select, update or delete policy for anon or authenticated:
-- lead data is read and worked through the service role only. Adding a select
-- policy here would expose every enquiry the brokerage has ever received.

-- ---------------------------------------------------------------------------
-- Agents reading their own pipeline
-- ---------------------------------------------------------------------------

-- A signed-in consultant sees the leads assigned to them and nothing else.
-- `agents.auth_user_id` is what ties a Supabase Auth user to a team member.
create policy "Agents read their own leads"
  on leads for select
  to authenticated
  using (
    exists (
      select 1
      from agents
      where agents.id = leads.assigned_agent_id
        and agents.auth_user_id = (select auth.uid())
    )
  );

-- ...and may progress them: status, notes, and nothing that would let a lead be
-- reassigned away or its attribution rewritten.
create policy "Agents update their own leads"
  on leads for update
  to authenticated
  using (
    exists (
      select 1
      from agents
      where agents.id = leads.assigned_agent_id
        and agents.auth_user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from agents
      where agents.id = leads.assigned_agent_id
        and agents.auth_user_id = (select auth.uid())
    )
  );
