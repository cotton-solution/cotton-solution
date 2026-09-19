-- ============================================================
-- Migration 9: Company Profile permissions
--
--   * Company NAME can only be changed by a platform admin
--     (Service Admin dashboard). Owners and staff can't rename it.
--   * Every OTHER company-profile field (logo, contact, address, tax
--     number, currency, category, website) can be edited by the owner
--     OR by a staff login that has the Settings module (role "admin",
--     or a "custom" role with "settings" ticked) — plus platform admins.
--
-- Safe to run on the live project (only replaces one policy and adds
-- a function + trigger). Requires migrations 2 and 5.
-- Run it in the Supabase SQL editor.
-- ============================================================

-- Who may edit a business's profile fields.
create or replace function can_edit_company_profile(b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    is_admin()
    or exists (
      select 1 from businesses
      where id = b and owner_id = auth.uid()
    )
    or exists (
      select 1 from business_members m
      where m.business_id = b
        and m.user_id = auth.uid()
        and m.is_active
        and (
          m.role = 'admin'
          or (m.role = 'custom' and 'settings' = any (m.module_keys))
        )
    );
$$;

-- Replace the old "owner or admin" update policy.
drop policy if exists "Owner or admin can update business" on businesses;
drop policy if exists "Owner, settings staff or admin can update business" on businesses;
create policy "Owner, settings staff or admin can update business" on businesses
  for update
  using (can_edit_company_profile(id))
  with check (can_edit_company_profile(id));

-- Fields only a platform admin may change: the company name, and who
-- owns the business. Anyone else's change to these is silently reverted.
-- (auth.uid() is null for the SQL editor / service role, so manual
-- fixes from the Supabase dashboard still work.)
create or replace function protect_admin_only_business_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not is_admin() then
    new.name := old.name;
    new.owner_id := old.owner_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_admin_only_business_fields on businesses;
create trigger trg_protect_admin_only_business_fields
  before update on businesses
  for each row execute function protect_admin_only_business_fields();
