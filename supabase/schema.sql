-- ============================================================
-- Cotton Solution — Full Database Schema
-- Run this entire file in Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. PROFILES (extends Supabase auth.users with app-specific data)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email text,
  status text not null default 'Active' check (status in ('Active', 'Expired', 'Banned', 'Pending Approval')),
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz default now()
);

-- 2. SLIDES (homepage slideshow)
create table if not exists slides (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body_text text,
  image_url text,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- 3. ANNOUNCEMENTS
create table if not exists announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text,
  images text[] default '{}',
  videos text[] default '{}',
  created_at timestamptz default now()
);

-- 4. POLICIES
create table if not exists policies (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text,
  effective_date text,
  created_at timestamptz default now()
);

-- 5. TEAM MEMBERS
create table if not exists team_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text,
  image_url text,
  email text,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- 6. DOCUMENTS (downloadable PDFs)
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  detail text,
  file_url text,
  created_at timestamptz default now()
);

-- 7. CONTACT MESSAGES (from the Contact Us form)
create table if not exists contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  created_at timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table profiles enable row level security;
alter table slides enable row level security;
alter table announcements enable row level security;
alter table policies enable row level security;
alter table team_members enable row level security;
alter table documents enable row level security;
alter table contact_messages enable row level security;

-- Public (anon) can READ content pages — this is a public company website
create policy "Public can view slides" on slides for select using (true);
create policy "Public can view announcements" on announcements for select using (true);
create policy "Public can view policies" on policies for select using (true);
create policy "Public can view team" on team_members for select using (true);
create policy "Public can view documents" on documents for select using (true);

-- Anyone can submit a contact message, nobody but admins can read them
create policy "Anyone can send a message" on contact_messages for insert with check (true);
create policy "Admins can view messages" on contact_messages for select using (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
);

-- Profiles: users can see their own row; admins can see & manage everyone
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Admins can view all profiles" on profiles for select using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
);
create policy "Admins can update all profiles" on profiles for update using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
);
create policy "Users can insert their own profile" on profiles for insert with check (auth.uid() = id);

-- Only admins can write to content tables
create policy "Admins manage slides" on slides for all using (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
) with check (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
);
create policy "Admins manage announcements" on announcements for all using (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
) with check (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
);
create policy "Admins manage policies" on policies for all using (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
) with check (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
);
create policy "Admins manage team" on team_members for all using (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
) with check (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
);
create policy "Admins manage documents" on documents for all using (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
) with check (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
);

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, status, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', new.email), 'Pending Approval', 'user');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- STORAGE BUCKETS (images, videos, documents)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('documents', 'documents', true)
on conflict (id) do nothing;

-- Public can view files in both buckets (needed to show images/download PDFs)
create policy "Public can view media" on storage.objects for select using (bucket_id = 'media');
create policy "Public can view documents bucket" on storage.objects for select using (bucket_id = 'documents');

-- Only admins can upload/delete files
create policy "Admins upload media" on storage.objects for insert with check (
  bucket_id = 'media' and exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
);
create policy "Admins delete media" on storage.objects for delete using (
  bucket_id = 'media' and exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
);
create policy "Admins upload documents" on storage.objects for insert with check (
  bucket_id = 'documents' and exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
);
create policy "Admins delete documents" on storage.objects for delete using (
  bucket_id = 'documents' and exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
);

-- ============================================================
-- SEED: turn yourself into an admin after you sign up once
-- ============================================================
-- After you register through the /login page with your own email,
-- run this (replace with your real email) to make yourself admin:
--
-- update profiles set role = 'admin', status = 'Active' where email = 'your-email@example.com';
