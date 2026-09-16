-- ============================================================
-- Migration: User Access & Security — lets a business owner add
-- staff logins (business_members) and control which modules each
-- one can open. Safe to run on the already-deployed project (only
-- ADDS things). Requires migration_2 (is_admin()) to already be
-- applied.
-- ============================================================

-- ------------------------------------------------------------
-- business_members: one row per staff login under a business.
-- The owner themselves is NOT a row here — they're the business's
-- owner_id and always has full access.
-- ------------------------------------------------------------
create table if not exists business_members (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  name text,
  role text not null check (
    role in ('admin', 'accountant', 'trader', 'viewer', 'custom')
  ),
  -- Only used when role = 'custom'; ignored (and left empty) for the
  -- built-in roles, which get their modules from a fixed map in the
  -- app (lib/team-data.ts) so behaviour stays in one place.
  module_keys text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (business_id, user_id)
);

create index if not exists idx_business_members_business on business_members(business_id);
create index if not exists idx_business_members_user on business_members(user_id);

-- ------------------------------------------------------------
-- my_business_id(): now resolves via ownership OR an active staff
-- membership, so every existing tenant table (which all filter on
-- business_id = my_business_id()) automatically becomes visible to
-- staff logins too, with no per-table changes needed.
-- ------------------------------------------------------------
create or replace function my_business_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select id from businesses where owner_id = auth.uid() limit 1),
    (select business_id from business_members
       where user_id = auth.uid() and is_active limit 1)
  );
$$;

create or replace function is_business_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from businesses where owner_id = auth.uid());
$$;

-- A brand-new auth user normally gets an auto-created "business" via
-- handle_new_auth_user() (see schema.sql). Staff logins created from
-- the User Access screen pass skip_business_creation=true in their
-- user metadata so that trigger doesn't also spin up a stray business
-- for them.
create or replace function handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce((new.raw_user_meta_data->>'skip_business_creation')::boolean, false) then
    return new;
  end if;

  insert into businesses (owner_id, name, contact_email, business_category)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data->>'business_name', ''),
      split_part(new.email, '@', 1)
    ),
    new.email,
    nullif(new.raw_user_meta_data->>'business_category', '')
  )
  on conflict (owner_id) do nothing;
  return new;
end;
$$;

-- Staff members need to be able to read their own business's row too
-- (previously only the owner or an admin could).
drop policy if exists "Owner or admin can view business" on businesses;
drop policy if exists "Owner, member or admin can view business" on businesses;
create policy "Owner, member or admin can view business" on businesses
  for select using (
    owner_id = auth.uid()
    or is_admin()
    or exists (
      select 1 from business_members m
      where m.business_id = businesses.id
        and m.user_id = auth.uid()
        and m.is_active
    )
  );

alter table business_members enable row level security;

-- Only the owner (or a support admin) manages the member list.
drop policy if exists "Owner manages members" on business_members;
create policy "Owner manages members" on business_members
  for all using (
    business_id = (select id from businesses where owner_id = auth.uid())
    or is_admin()
  )
  with check (
    business_id = (select id from businesses where owner_id = auth.uid())
    or is_admin()
  );

-- A staff member can always read their own membership row, so the app
-- can show them their own role/module list after login.
drop policy if exists "Member can view own membership" on business_members;
create policy "Member can view own membership" on business_members
  for select using (user_id = auth.uid());
