-- Deriving the market metrics.
--
-- Everything the site shows about a community is computed here and stored, so
-- a page load is a single indexed read rather than an aggregate over hundreds
-- of thousands of transactions.
--
-- Two decisions worth stating, because they change what the numbers mean:
--
--   * The headline window is the last 12 months, compared with the 12 months
--     before it. A quarter is too noisy at community level, a single tower
--     completing can swing it, and anything longer stops being current.
--
--   * The median leads, not the average. Dubai's prime communities contain a
--     handful of trophy sales that pull a mean far above what a normal buyer
--     transacts at. Both are stored; the pages lead with the median.
--
-- Only registered SALES with a usable size feed pricing. Mortgages and gifts
-- are recorded transfers, not evidence of what a property is worth.

create or replace function public.refresh_area_stats()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  window_end date := current_date;
  window_start date := current_date - interval '12 months';
  prior_start date := current_date - interval '24 months';
  prior_end date := current_date - interval '12 months';
  refreshed integer := 0;
begin
  -- Which provenance are we describing? If the table holds any real DLD rows,
  -- the stats describe those and sample rows are ignored entirely. Mixing the
  -- two would produce a number that is neither.
  with source as (
    select case
      when exists (select 1 from dld_transactions where provenance = 'dld_open_data')
        then 'dld_open_data'::data_provenance
      else 'sample'::data_provenance
    end as provenance
  ),

  -- Sales in the current window, per area.
  current_window as (
    select
      t.area_id,
      count(*)::integer as transaction_count,
      percentile_cont(0.5) within group (order by t.amount) as median_price,
      avg(t.amount) as average_price,
      percentile_cont(0.5) within group (order by t.price_per_sqft)
        filter (where t.price_per_sqft is not null) as median_ppsf,
      avg(t.price_per_sqft) filter (where t.price_per_sqft is not null) as average_ppsf,
      100.0 * count(*) filter (where t.registration_type ilike 'off%plan')::numeric
        / nullif(count(*), 0) as off_plan_share
    from dld_transactions t, source s
    where t.area_id is not null
      and t.provenance = s.provenance
      and t.transaction_date >= window_start
      and t.transaction_date <= window_end
      and coalesce(t.transaction_group, 'Sales') ilike 'sales'
    group by t.area_id
  ),

  -- The same window a year earlier, for the year-on-year comparison.
  prior_window as (
    select
      t.area_id,
      count(*)::integer as transaction_count,
      percentile_cont(0.5) within group (order by t.price_per_sqft)
        filter (where t.price_per_sqft is not null) as median_ppsf
    from dld_transactions t, source s
    where t.area_id is not null
      and t.provenance = s.provenance
      and t.transaction_date >= prior_start
      and t.transaction_date < prior_end
      and coalesce(t.transaction_group, 'Sales') ilike 'sales'
    group by t.area_id
  ),

  -- Registered tenancies in the current window give the rent side of yield.
  rents as (
    select
      r.area_id,
      percentile_cont(0.5) within group (order by r.annual_rent) as median_rent
    from dld_rent_contracts r, source s
    where r.area_id is not null
      and r.provenance = s.provenance
      and r.contract_start_date >= window_start
    group by r.area_id
  )

  insert into area_stats (
    area_id, provenance, window_start, window_end,
    transaction_count, median_price, average_price,
    median_price_per_sqft, average_price_per_sqft,
    prior_transaction_count, prior_median_price_per_sqft,
    yoy_price_change_pct, yoy_volume_change_pct,
    median_annual_rent, gross_yield_pct, off_plan_share_pct, last_updated
  )
  select
    c.area_id,
    (select provenance from source),
    window_start,
    window_end,
    c.transaction_count,
    round(c.median_price::numeric, 2),
    round(c.average_price::numeric, 2),
    round(c.median_ppsf::numeric, 2),
    round(c.average_ppsf::numeric, 2),
    p.transaction_count,
    round(p.median_ppsf::numeric, 2),
    -- Year-on-year needs both sides; a community with no history last year
    -- gets null rather than a made-up 0% or an infinite rise.
    case
      when p.median_ppsf is not null and p.median_ppsf > 0 and c.median_ppsf is not null
      then round((100.0 * (c.median_ppsf - p.median_ppsf) / p.median_ppsf)::numeric, 2)
    end,
    case
      when p.transaction_count is not null and p.transaction_count > 0
      then round(100.0 * (c.transaction_count - p.transaction_count)::numeric / p.transaction_count, 2)
    end,
    round(r.median_rent::numeric, 2),
    -- Gross yield: a year's median rent over the median sale price. Gross, not
    -- net, service charges are not in DLD's data, and the pages say so rather
    -- than quietly presenting a gross figure as a return.
    case
      when r.median_rent is not null and c.median_price is not null and c.median_price > 0
      then round((100.0 * r.median_rent / c.median_price)::numeric, 2)
    end,
    round(c.off_plan_share::numeric, 2),
    now()
  from current_window c
  left join prior_window p on p.area_id = c.area_id
  left join rents r on r.area_id = c.area_id
  on conflict (area_id) do update set
    provenance = excluded.provenance,
    window_start = excluded.window_start,
    window_end = excluded.window_end,
    transaction_count = excluded.transaction_count,
    median_price = excluded.median_price,
    average_price = excluded.average_price,
    median_price_per_sqft = excluded.median_price_per_sqft,
    average_price_per_sqft = excluded.average_price_per_sqft,
    prior_transaction_count = excluded.prior_transaction_count,
    prior_median_price_per_sqft = excluded.prior_median_price_per_sqft,
    yoy_price_change_pct = excluded.yoy_price_change_pct,
    yoy_volume_change_pct = excluded.yoy_volume_change_pct,
    median_annual_rent = excluded.median_annual_rent,
    gross_yield_pct = excluded.gross_yield_pct,
    off_plan_share_pct = excluded.off_plan_share_pct,
    last_updated = now();

  get diagnostics refreshed = row_count;

  -- The monthly series behind the charts: three years, which is enough to show
  -- a trend without turning the line into noise.
  insert into area_price_history (
    area_id, provenance, period_month, transaction_count, median_price_per_sqft, median_price
  )
  select
    t.area_id,
    t.provenance,
    date_trunc('month', t.transaction_date)::date,
    count(*)::integer,
    round(
      (percentile_cont(0.5) within group (order by t.price_per_sqft)
        filter (where t.price_per_sqft is not null))::numeric,
      2
    ),
    round((percentile_cont(0.5) within group (order by t.amount))::numeric, 2)
  from dld_transactions t
  where t.area_id is not null
    and t.transaction_date >= current_date - interval '36 months'
    and coalesce(t.transaction_group, 'Sales') ilike 'sales'
    and t.provenance = (
      select case
        when exists (select 1 from dld_transactions where provenance = 'dld_open_data')
          then 'dld_open_data'::data_provenance
        else 'sample'::data_provenance
      end
    )
  group by t.area_id, t.provenance, date_trunc('month', t.transaction_date)
  on conflict (area_id, period_month) do update set
    provenance = excluded.provenance,
    transaction_count = excluded.transaction_count,
    median_price_per_sqft = excluded.median_price_per_sqft,
    median_price = excluded.median_price;

  return refreshed;
end;
$$;

-- Only server-side code refreshes the metrics.
revoke execute on function public.refresh_area_stats() from public, anon, authenticated;
grant execute on function public.refresh_area_stats() to service_role;

-- ---------------------------------------------------------------------------
-- Resolving DLD's community names to our own area rows
-- ---------------------------------------------------------------------------

-- DLD spells communities its own way, and inconsistently. Rows arrive with the
-- raw name and are matched afterwards, so an unmatched community stays in the
-- table to be reconciled rather than being dropped at ingest.
create or replace function public.link_transactions_to_areas()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  linked integer := 0;
  linked_rents integer := 0;
begin
  update dld_transactions t
  set area_id = a.id
  from areas a
  where t.area_id is null
    and (
      lower(trim(t.area_name_raw)) = lower(a.name)
      or lower(trim(t.area_name_raw)) = lower(coalesce(a.dld_area_name, ''))
      or lower(trim(t.area_name_raw)) = replace(lower(a.slug), '-', ' ')
    );
  get diagnostics linked = row_count;

  update dld_rent_contracts r
  set area_id = a.id
  from areas a
  where r.area_id is null
    and (
      lower(trim(r.area_name_raw)) = lower(a.name)
      or lower(trim(r.area_name_raw)) = lower(coalesce(a.dld_area_name, ''))
      or lower(trim(r.area_name_raw)) = replace(lower(a.slug), '-', ' ')
    );
  get diagnostics linked_rents = row_count;

  return linked + linked_rents;
end;
$$;

revoke execute on function public.link_transactions_to_areas() from public, anon, authenticated;
grant execute on function public.link_transactions_to_areas() to service_role;
