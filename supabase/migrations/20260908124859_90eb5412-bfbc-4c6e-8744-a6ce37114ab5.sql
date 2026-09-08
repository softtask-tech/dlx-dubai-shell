create or replace function public.get_dld_latest_period(
  requested_entity_type text,
  requested_metric text,
  requested_grain text
)
returns date
language sql stable security definer set search_path='' as $$
  select max(a.period_start)
  from public.dld_market_aggregates a
  where public.dld_market_scope_allowed(requested_entity_type, requested_grain, requested_metric)
    and a.publication_run_id = (
      select p.active_run_id from public.dld_market_publication_state p where p.singleton
    )
    and a.entity_type = requested_entity_type
    and a.metric_code = requested_metric
    and a.period_grain = requested_grain
$$;

revoke all on function public.get_dld_latest_period(text,text,text) from public;
grant execute on function public.get_dld_latest_period(text,text,text) to anon, authenticated;