-- ============================================================
-- Migration: site-wide branding (logo, site name, tagline) and
-- login-page slides, editable from the admin "Website Setting"
-- screen. Safe to run on the already-deployed project (only ADDS
-- things). Requires migration_2 (for the is_admin() helper) to
-- already be applied.
-- ============================================================

-- ------------------------------------------------------------
-- site_settings: a single row holding the site-wide branding.
-- The "singleton" constraint (id always = true) guarantees only
-- one row can ever exist.
-- ------------------------------------------------------------
create table if not exists site_settings (
  id boolean primary key default true,
  logo_url text,
  site_name text not null default 'Bahar-e-Madina',
  tagline text not null default 'Run your commission business with confidence.',
  updated_at timestamptz not null default now(),
  constraint site_settings_singleton check (id)
);

insert into site_settings (id) values (true)
  on conflict (id) do nothing;

alter table site_settings enable row level security;

-- Everyone (including signed-out visitors on the login page) can
-- read the branding. Only an admin can change it.
drop policy if exists "Anyone can read site settings" on site_settings;
create policy "Anyone can read site settings" on site_settings
  for select using (true);

drop policy if exists "Admin can update site settings" on site_settings;
create policy "Admin can update site settings" on site_settings
  for update using (is_admin()) with check (is_admin());

-- ------------------------------------------------------------
-- site_slides: the rotating slides shown on the login screen.
-- ------------------------------------------------------------
create table if not exists site_slides (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  title text,
  caption text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table site_slides enable row level security;

drop policy if exists "Anyone can read site slides" on site_slides;
create policy "Anyone can read site slides" on site_slides
  for select using (true);

drop policy if exists "Admin can insert site slides" on site_slides;
create policy "Admin can insert site slides" on site_slides
  for insert with check (is_admin());

drop policy if exists "Admin can update site slides" on site_slides;
create policy "Admin can update site slides" on site_slides
  for update using (is_admin()) with check (is_admin());

drop policy if exists "Admin can delete site slides" on site_slides;
create policy "Admin can delete site slides" on site_slides
  for delete using (is_admin());

-- ------------------------------------------------------------
-- Storage bucket for the logo + slide images. Public bucket so
-- the images can be shown on the (signed-out) login page.
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
  values ('site-assets', 'site-assets', true)
  on conflict (id) do nothing;

drop policy if exists "Public can view site assets" on storage.objects;
create policy "Public can view site assets" on storage.objects
  for select using (bucket_id = 'site-assets');

drop policy if exists "Admin can upload site assets" on storage.objects;
create policy "Admin can upload site assets" on storage.objects
  for insert with check (bucket_id = 'site-assets' and is_admin());

drop policy if exists "Admin can update site assets" on storage.objects;
create policy "Admin can update site assets" on storage.objects
  for update using (bucket_id = 'site-assets' and is_admin());

drop policy if exists "Admin can delete site assets" on storage.objects;
create policy "Admin can delete site assets" on storage.objects
  for delete using (bucket_id = 'site-assets' and is_admin());
