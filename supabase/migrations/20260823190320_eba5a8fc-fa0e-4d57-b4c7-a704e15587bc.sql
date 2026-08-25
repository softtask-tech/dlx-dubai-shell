-- Scheduling the market data refresh.
--
-- Twice a day rather than hourly: DLD publishes in batches, the metrics cover a
-- rolling twelve months, and a figure that moves every hour invites people to
-- read noise as signal. Transactions and rent contracts run an hour apart so
-- the two never contend for the same function slot.
--
-- The job posts to the Edge Function rather than doing the work in SQL, because
-- the OAuth exchange and the cleaning both belong in one place, the same code
-- the manual trigger and the one-time importer use.

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- The function URL and the shared secret are project-specific, so they are read
-- from a settings table rather than baked into the schedule.
create table if not exists public.app_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

alter table public.app_settings enable row level security;

-- Nobody reads this from the browser. It holds the sync secret.
create policy "Admins read settings"
  on public.app_settings for select to authenticated
  using (public.has_role((select auth.uid()), 'admin'));

grant select on public.app_settings to authenticated;
grant all on public.app_settings to service_role;

/*
 * Kick off one ingestion run.
 *
 * Reads its own configuration, so rotating the secret or moving the function is
 * an update to one row rather than a migration. Returns the pg_net request id;
 * the run itself is recorded in dld_ingest_runs by the function.
 */
create or replace function public.trigger_dld_sync(dataset text default 'transactions', trigger_source text default 'scheduled')
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  function_url text;
  sync_secret text;
  request_id bigint;
begin
  select value into function_url from app_settings where key = 'dld_sync_url';
  select value into sync_secret from app_settings where key = 'dld_sync_secret';

  if function_url is null then
    raise notice 'dld_sync_url is not set in app_settings; skipping.';
    return null;
  end if;

  select net.http_post(
    url := function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-dld-sync-secret', coalesce(sync_secret, '')
    ),
    body := jsonb_build_object('dataset', dataset, 'trigger', trigger_source),
    timeout_milliseconds := 120000
  ) into request_id;

  return request_id;
end;
$$;

revoke execute on function public.trigger_dld_sync(text, text) from public, anon, authenticated;
grant execute on function public.trigger_dld_sync(text, text) to service_role;

-- 02:00 and 03:00 Gulf time, when nobody is reading the site.
select cron.schedule(
  'dld-sync-transactions',
  '0 22 * * *',
  $$select public.trigger_dld_sync('transactions', 'scheduled');$$
);

select cron.schedule(
  'dld-sync-rents',
  '0 23 * * *',
  $$select public.trigger_dld_sync('rents', 'scheduled');$$
);