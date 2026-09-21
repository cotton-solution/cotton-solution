-- ============================================================
-- Migration 13: fix "infinite recursion detected in policy for
-- relation businesses".
-- ------------------------------------------------------------
-- Cause: the SELECT policy on `businesses` looked inside
-- `business_members`, and the "Owner manages members" policy on
-- `business_members` looked back inside `businesses` — each policy
-- re-triggered the other forever, so ANY direct read of `businesses`
-- failed. (Company name / profile could not load; the app then fell
-- back to "My Business".)
--
-- Fix: do those cross-table look-ups inside SECURITY DEFINER
-- functions, which read the tables without re-running row-level
-- security. Same access rules as before — only the plumbing changes.
--
-- Safe to run on the live project (no data is touched). Requires
-- migrations 2 and 5. Running it twice is harmless.
-- Run it in the Supabase SQL Editor.
-- ============================================================

-- Is the signed-in user an ACTIVE staff member of business b?
create or replace function is_member_of(b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from business_members m
    where m.business_id = b
      and m.user_id = auth.uid()
      and m.is_active
  );
$$;

-- Does the signed-in user own business b?
create or replace function owns_business(b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from businesses
    where id = b and owner_id = auth.uid()
  );
$$;

-- businesses: owner, active staff member, or platform admin can read.
drop policy if exists "Owner or admin can view business" on businesses;
drop policy if exists "Owner, member or admin can view business" on businesses;
create policy "Owner, member or admin can view business" on businesses
  for select using (
    owner_id = auth.uid()
    or is_admin()
    or is_member_of(id)
  );

-- business_members: only the owner (or a platform admin) manages the list.
drop policy if exists "Owner manages members" on business_members;
create policy "Owner manages members" on business_members
  for all using (
    owns_business(business_id) or is_admin()
  )
  with check (
    owns_business(business_id) or is_admin()
  );

-- (The "Member can view own membership" policy — user_id = auth.uid() —
--  never referenced `businesses`, so it stays as it is.)
