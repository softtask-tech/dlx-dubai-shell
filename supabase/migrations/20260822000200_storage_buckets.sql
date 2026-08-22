-- Storage for property media, brochures and floor plans.
--
-- Listing photography and team portraits are public: the pages that show them
-- are public, and a signed URL on every image would only add latency.
-- Brochures are public too — they are marketing collateral, and gating them
-- behind auth would break the download link on a listing page. What gates a
-- brochure is the enquiry form in front of it, not the bucket.

insert into storage.buckets (id, name, public)
values
  ('property-media', 'property-media', true),
  ('brochures', 'brochures', true),
  ('team', 'team', true)
on conflict (id) do nothing;

-- Anyone may read from the public buckets.
create policy "Public read of property media"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id in ('property-media', 'brochures', 'team'));

-- Only admins may add, replace or remove files.
create policy "Admins upload media"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id in ('property-media', 'brochures', 'team')
    and has_role((select auth.uid()), 'admin')
  );

create policy "Admins update media"
  on storage.objects for update
  to authenticated
  using (
    bucket_id in ('property-media', 'brochures', 'team')
    and has_role((select auth.uid()), 'admin')
  );

create policy "Admins delete media"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id in ('property-media', 'brochures', 'team')
    and has_role((select auth.uid()), 'admin')
  );
