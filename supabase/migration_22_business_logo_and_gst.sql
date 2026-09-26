-- ============================================================
-- Migration 22: business logo upload + GST number
--
-- Company Profile had a "Logo URL" text box because file upload
-- wasn't wired up yet — only a service admin could actually upload an
-- image (to the "site-assets" bucket, migration_3). This gives every
-- business its own logo upload, the same way, scoped to their own
-- folder so one business can never overwrite another's file:
--   business-logos/<business_id>/logo-<timestamp>.<ext>
--
-- Also adds a GST / Sales Tax Registration number, separate from the
-- existing NTN field (`tax_number`), since Pakistani businesses
-- usually carry both.
--
-- Safe to run on the live project. Idempotent. Run once in the
-- Supabase SQL Editor.
-- ============================================================

alter table businesses
  add column if not exists gst_number text;

-- ------------------------------------------------------------
-- Storage bucket for business logos. Public read (so the logo shows
-- on a printed/emailed invoice without the viewer needing to be
-- signed in); write is scoped to the uploader's own business folder
-- and gated by the same Settings module-access rule as the rest of
-- Company Profile (migration_21).
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
  values ('business-logos', 'business-logos', true)
  on conflict (id) do nothing;

drop policy if exists "Public can view business logos" on storage.objects;
create policy "Public can view business logos" on storage.objects
  for select using (bucket_id = 'business-logos');

drop policy if exists "Business can upload its own logo" on storage.objects;
create policy "Business can upload its own logo" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'business-logos'
    and (storage.foldername(name))[1] = my_business_id()::text
    and has_module_access('settings')
  );

drop policy if exists "Business can replace its own logo" on storage.objects;
create policy "Business can replace its own logo" on storage.objects
  for update to authenticated
  using (bucket_id = 'business-logos' and (storage.foldername(name))[1] = my_business_id()::text)
  with check (
    bucket_id = 'business-logos'
    and (storage.foldername(name))[1] = my_business_id()::text
    and has_module_access('settings')
  );

drop policy if exists "Business can delete its own logo" on storage.objects;
create policy "Business can delete its own logo" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'business-logos'
    and (storage.foldername(name))[1] = my_business_id()::text
    and has_module_access('settings')
  );
