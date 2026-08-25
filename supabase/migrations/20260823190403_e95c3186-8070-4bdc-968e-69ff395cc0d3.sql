-- Schedules the nurture sequence.
--
-- Once a day, not hourly: the steps are spaced in days and weeks, so a more
-- frequent run would do nothing but burn invocations. Early morning Gulf time,
-- so a message that does go out arrives at the start of someone's day rather
-- than at two in the morning.
--
-- Same shape as the DLD sync schedule, and for the same reason: the endpoint
-- and the shared secret live in app_settings, so rotating either is an update
-- to one row rather than a migration. The original file read them from
-- `current_setting('app.settings.*')`, which cannot be set on this platform,
-- the schedule would have been created as a permanent no-op.

create or replace function public.trigger_lead_nurture()
returns bigint
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  function_url text;
  sync_secret text;
  request_id bigint;
begin
  select value into function_url from app_settings where key = 'lead_nurture_url';
  select value into sync_secret from app_settings where key = 'lead_nurture_secret';

  if function_url is null then
    raise notice 'lead_nurture_url is not set in app_settings; skipping.';
    return null;
  end if;

  select extensions.http_post(
    url := function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-sync-secret', coalesce(sync_secret, '')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  ) into request_id;

  return request_id;
end;
$$;

revoke execute on function public.trigger_lead_nurture() from public, anon, authenticated;
grant execute on function public.trigger_lead_nurture() to service_role;

-- 05:00 UTC is 09:00 in Dubai.
select cron.unschedule('lead-nurture-daily')
where exists (select 1 from cron.job where jobname = 'lead-nurture-daily');

select cron.schedule(
  'lead-nurture-daily',
  '0 5 * * *',
  $$select public.trigger_lead_nurture();$$
);