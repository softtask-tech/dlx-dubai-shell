-- Rank the communities.
--
-- The published functions could answer three questions: how is Dubai doing,
-- how is this one community doing, and how do these twenty compare. They could
-- not answer the question a buyer actually arrives with, which is "where should
-- I be looking", because nothing could list communities in order of anything.
--
-- That is the whole reason the market pages read as a report rather than a
-- tool: the data supports a league table and there was no way to ask for one.
--
-- Same guarantees as the rest of the public surface. It reads the same view,
-- passes the same scope gate, returns nothing for a metric that has not been
-- opened to community level, and cannot reach a project, a building or a
-- contract. The only new capability is ordering.

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
    -- Two orderings rather than a format string, so the direction can never be
    -- assembled from caller input.
    case when sort_direction = 'asc' then v.metric_value end asc,
    case when sort_direction <> 'asc' then v.metric_value end desc,
    v.name_en
  limit greatest(1, least(result_limit, 200))
$$;

-- The latest period that actually has community rows for a metric, so a page
-- does not have to guess a date and render an empty table when the newest
-- quarter has not been published yet.
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
