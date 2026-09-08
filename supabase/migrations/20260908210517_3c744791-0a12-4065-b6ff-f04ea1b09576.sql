create or replace function public.get_dld_offplan_split(
  requested_metric text,
  requested_grain text,
  requested_period date,
  min_observations integer default 30,
  result_limit integer default 80
)
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
  order by (o.metric_value / e.metric_value) desc, o.name_en
  limit greatest(1, least(result_limit, 200))
$$;

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
  'Median registered price for off-plan against ready property, per community, where both sides clear the observation floor independently.';