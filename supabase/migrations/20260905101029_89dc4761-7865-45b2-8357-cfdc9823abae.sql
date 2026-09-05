create index if not exists dld_directory_search_default_order_idx
  on public.dld_directory_search_index (
    (case when '' in (public.dld_directory_normalize_query(primary_number),
                      public.dld_directory_normalize_query(secondary_number))
          then 0 else 1 end),
    (coalesce(display_name_en, display_name_ar)),
    source_key
  );

create or replace function public.search_dld_directory(
  search_query text default '', entity_types text[] default null,
  page_number integer default 1, page_size integer default 24
)
returns table(entity_type text, source_key text, display_name_en text, display_name_ar text,
              primary_number text, secondary_number text, status_en text, valid_from date, valid_to date,
              related_context jsonb,
              total_count bigint,
              source_export_date date, source_dataset text, non_affiliation text)
language plpgsql stable security definer set search_path = ''
as $$
declare
  normalized_query text := public.dld_directory_normalize_query(coalesce(search_query, ''));
  effective_types text[] := case when entity_types is null or cardinality(entity_types) = 0
                                 then null else entity_types end;
  limit_size integer := least(greatest(coalesce(page_size, 24), 1), 100);
  offset_rows integer := (greatest(coalesce(page_number, 1), 1) - 1)
                         * least(greatest(coalesce(page_size, 24), 1), 100);
  matched_total bigint;
  notice constant text :=
    'Independent directory using Dubai Land Department open data; no affiliation or endorsement is implied.';
begin
  select count(*) into matched_total
  from public.dld_directory_search_index s
  where (normalized_query = '' or s.aliases ilike '%' || normalized_query || '%')
    and (effective_types is null or s.entity_type = any(effective_types));

  if normalized_query = '' then
    return query
    select s.entity_type, s.source_key, s.display_name_en, s.display_name_ar,
           s.primary_number, s.secondary_number, s.status_en, s.valid_from, s.valid_to,
           s.related_context, matched_total,
           s.source_export_date, s.source_dataset, notice
    from public.dld_directory_search_index s
    where (effective_types is null or s.entity_type = any(effective_types))
    order by case when '' in (public.dld_directory_normalize_query(s.primary_number),
                              public.dld_directory_normalize_query(s.secondary_number))
                  then 0 else 1 end,
             coalesce(s.display_name_en, s.display_name_ar), s.source_key
    limit limit_size offset offset_rows;
  else
    return query
    select s.entity_type, s.source_key, s.display_name_en, s.display_name_ar,
           s.primary_number, s.secondary_number, s.status_en, s.valid_from, s.valid_to,
           s.related_context, matched_total,
           s.source_export_date, s.source_dataset, notice
    from public.dld_directory_search_index s
    where s.aliases ilike '%' || normalized_query || '%'
      and (effective_types is null or s.entity_type = any(effective_types))
    order by case when normalized_query in (public.dld_directory_normalize_query(s.primary_number),
                                            public.dld_directory_normalize_query(s.secondary_number))
                  then 0 else 1 end,
             greatest(extensions.similarity(s.aliases, normalized_query), 0) desc,
             coalesce(s.display_name_en, s.display_name_ar), s.source_key
    limit limit_size offset offset_rows;
  end if;
end;
$$;

revoke all on function public.search_dld_directory(text, text[], integer, integer) from public;
grant execute on function public.search_dld_directory(text, text[], integer, integer) to anon, authenticated;