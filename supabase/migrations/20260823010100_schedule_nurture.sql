-- Schedules the nurture sequence.
--
-- Once a day, not hourly: the steps are spaced in days and weeks, so a more
-- frequent run would do nothing but burn invocations. Early morning Gulf time,
-- so a message that does go out arrives at the start of someone's day rather
-- than at two in the morning.
--
-- Same shape as the DLD sync schedule: pg_cron posts to the Edge Function with
-- the shared secret, and the function decides what is actually due.

create extension if not exists pg_cron;
create extension if not exists pg_net;

do $$
declare
  project_url text := current_setting('app.settings.project_url', true);
  sync_secret text := current_setting('app.settings.sync_secret', true);
begin
  if project_url is null or sync_secret is null then
    raise notice 'Skipping nurture schedule: set app.settings.project_url and app.settings.sync_secret first.';
    return;
  end if;

  perform cron.unschedule('lead-nurture-daily')
  where exists (select 1 from cron.job where jobname = 'lead-nurture-daily');

  perform cron.schedule(
    'lead-nurture-daily',
    -- 05:00 UTC is 09:00 in Dubai.
    '0 5 * * *',
    format(
      $cmd$
      select net.http_post(
        url := %L,
        headers := jsonb_build_object('Content-Type', 'application/json', 'x-sync-secret', %L),
        body := '{}'::jsonb
      );
      $cmd$,
      project_url || '/functions/v1/lead-nurture',
      sync_secret
    )
  );
end $$;
