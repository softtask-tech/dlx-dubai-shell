-- What off-plan costs against what ready property costs, community by community.
--
-- The aggregate table has carried this split since it was built: every price
-- metric exists segmented by sale_registration into off_plan and existing, at
-- community level, 1,053 and 1,226 rows of it. Nothing could read it. Every
-- published function pins segment_code = 'all', so the split has been sitting
-- in the database unreachable while the site told buyers we publish what the
-- register says.
--
-- It is worth reaching for. Dubai-wide, off-plan registered 23.9% above ready
-- property in the latest quarter, down from 41.5% two years ago. Per community
-- the spread is far wider than that average suggests, from -12% to +126%, and
-- the per-community view is the honest one because the Dubai-wide figure moves
-- with wherever the launches happened to be that quarter.
--
-- DELIBERATELY NOT A GENERAL SEGMENT PARAMETER. Adding `requested_segment` to
-- the leaderboard would have been less code and would have opened every
-- segment axis in the table to any caller, with the scope registry unable to
-- stop it — the gate keys on entity type, grain and metric, not on segment. So
-- this function does one thing, names the two segments itself, and cannot be
-- pointed anywhere else.
create or replace function public.get_dld_offplan_split(
  requested_metric text,
  requested_grain text,
  requested_period date,
  -- Both sides must clear this independently. A community with 400 off-plan
  -- sales and 3 resales has not got a comparable ready-property price, and
  -- publishing the ratio anyway would be describing three transactions.
  min_observations integer default 30,
  result_limit integer default 80
)
-- Output names deliberately do not repeat the view's own column names.
-- These become OUT parameters and sit in the same namespace as the columns of
-- dld_market_public inside the body; every reference below is qualified so it
-- would resolve either way, but a migration that fails here fails silently
-- into two empty charts, and the rename costs nothing.
returns table (
  community_id text,
  community_name_en text,
  community_name_ar text,
  off_plan_value numeric,
  off_plan_count integer,
  existing_value numeric,
  existing_count integer
)
language sql stable security definer set search_path='' as $$
  select
    o.entity_id,
    o.name_en,
    o.name_ar,
    o.metric_value,
    o.observation_count,
    e.metric_value,
    e.observation_count
  from public.dld_market_public o
  join public.dld_market_public e
    on e.entity_id = o.entity_id
   and e.metric_code = o.metric_code
   and e.period_grain = o.period_grain
   and e.period_start = o.period_start
   and e.entity_type = 'community'
   and e.segment_type = 'sale_registration'
   and e.segment_code = 'existing'
  where public.dld_market_scope_allowed('community', requested_grain, requested_metric)
    and o.entity_type = 'community'
    and o.metric_code = requested_metric
    and o.period_grain = requested_grain
    and o.period_start = requested_period
    and o.segment_type = 'sale_registration'
    and o.segment_code = 'off_plan'
    and o.observation_count >= greatest(1, coalesce(min_observations, 30))
    and e.observation_count >= greatest(1, coalesce(min_observations, 30))
    and e.metric_value > 0
  -- Widest gap first. Ordered here rather than by the caller because there is
  -- only one interesting ordering and no reason to accept a direction.
  order by (o.metric_value / e.metric_value) desc, o.name_en
  limit greatest(1, least(result_limit, 200))
$$;

-- The newest period where the split is actually publishable on both sides, so
-- a page does not render an empty comparison in the week an export lands with
-- the off-plan rows in and the resale rows still short of the threshold.
create or replace function public.get_dld_offplan_split_period(
  requested_metric text,
  requested_grain text,
  min_observations integer default 30
)
returns date
language sql stable security definer set search_path='' as $$
  select max(o.period_start)
  from public.dld_market_public o
  join public.dld_market_public e
    on e.entity_id = o.entity_id
   and e.metric_code = o.metric_code
   and e.period_grain = o.period_grain
   and e.period_start = o.period_start
   and e.entity_type = 'community'
   and e.segment_type = 'sale_registration'
   and e.segment_code = 'existing'
  where public.dld_market_scope_allowed('community', requested_grain, requested_metric)
    and o.entity_type = 'community'
    and o.metric_code = requested_metric
    and o.period_grain = requested_grain
    and o.segment_type = 'sale_registration'
    and o.segment_code = 'off_plan'
    and o.observation_count >= greatest(1, coalesce(min_observations, 30))
    and e.observation_count >= greatest(1, coalesce(min_observations, 30))
$$;

revoke all on function
  public.get_dld_offplan_split(text,text,date,integer,integer),
  public.get_dld_offplan_split_period(text,text,integer)
  from public;

grant execute on function
  public.get_dld_offplan_split(text,text,date,integer,integer),
  public.get_dld_offplan_split_period(text,text,integer)
  to anon, authenticated;

comment on function public.get_dld_offplan_split(text,text,date,integer,integer) is
  'Median registered price for off-plan against ready property, per community, '
  'where both sides clear the observation floor independently. Compares '
  'different homes: off-plan is new build, ready stock is any age, so part of '
  'any gap is what new construction costs anywhere.';
