-- pg_net landed in `public` because `create extension if not exists pg_net`
-- defaults there. It is machinery for the scheduled jobs, not part of the app's
-- public interface, so it moves to the extensions schema and the scheduler is
-- pointed at it explicitly.
create schema if not exists extensions;
-- pg_net does not support SET SCHEMA, so it is reinstalled in place. Nothing
-- depends on its queue tables between migrations: the scheduled jobs post and
-- forget, and the responses are not read back.
drop extension if exists pg_net cascade;
create extension pg_net with schema extensions;

create or replace function public.trigger_dld_sync(dataset text default 'transactions', trigger_source text default 'scheduled')
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
  select value into function_url from app_settings where key = 'dld_sync_url';
  select value into sync_secret from app_settings where key = 'dld_sync_secret';

  if function_url is null then
    raise notice 'dld_sync_url is not set in app_settings; skipping.';
    return null;
  end if;

  select extensions.http_post(
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