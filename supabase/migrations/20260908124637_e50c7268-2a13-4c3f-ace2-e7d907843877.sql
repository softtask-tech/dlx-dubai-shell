create or replace function public.get_dld_community_leaderboard(
  requested_metric text,
  requested_grain text,
  requested_period date,
  sort_direction text default 'desc',
  result_limit integer default 60
)
returns setof public.dld_market_public
language sql stable security definer set search_path='' as $$
  select v.* from public.dld_market_public v
  where public.dld_market_scope_allowed('community', requested_grain, requested_metric)
    and v.entity_type = 'community'
    and v.metric_code = requested_metric
    and v.period_grain = requested_grain
    and v.period_start = requested_period
    and v.segment_code = 'all'
  order by
    case when sort_direction = 'asc' then v.metric_value end asc,
    case when sort_direction <> 'asc' then v.metric_value end desc,
    v.name_en
  limit greatest(1, least(result_limit, 200))
$$;

create or replace function public.get_dld_latest_period(
  requested_entity_type text,
  requested_metric text,
  requested_grain text
)
returns date
language sql stable security definer set search_path='' as $$
  select max(v.period_start) from public.dld_market_public v
  where public.dld_market_scope_allowed(requested_entity_type, requested_grain, requested_metric)
    and v.entity_type = requested_entity_type
    and v.metric_code = requested_metric
    and v.period_grain = requested_grain
$$;

revoke all on function
  public.get_dld_community_leaderboard(text,text,date,text,integer),
  public.get_dld_latest_period(text,text,text)
from public;

grant execute on function
  public.get_dld_community_leaderboard(text,text,date,text,integer),
  public.get_dld_latest_period(text,text,text)
to anon, authenticated;