-- ============================================================
-- Migration: business category + billing status + account
-- approval workflow + admin delete policy.
-- Safe to run on the already-deployed project (only ADDS things).
-- ============================================================

alter table businesses
  add column if not exists business_category text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'businesses_business_category_check'
  ) then
    alter table businesses
      add constraint businesses_business_category_check
      check (business_category in (
        'shopkeeper', 'wholesaler', 'distributor', 'trader', 'manufacturer'
      ));
  end if;
end $$;

alter table businesses
  add column if not exists billing_status text not null default 'unbilled';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'businesses_billing_status_check'
  ) then
    alter table businesses
      add constraint businesses_billing_status_check
      check (billing_status in ('billed', 'unbilled'));
  end if;
end $$;

alter table businesses
  add column if not exists last_billed_at timestamptz;

-- Re-create the signup trigger so it also captures business_category
create or replace function handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
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

-- Admin-only delete on businesses (cascades to all of that business's data)
drop policy if exists "Admin can delete business" on businesses;
create policy "Admin can delete business" on businesses
  for delete using (is_admin());

-- Protect billing fields the same way subscription fields are protected
create or replace function protect_subscription_fields()
returns trigger
language plpgsql
security definer
as $$
begin
  if not is_admin() then
    new.subscription_status := old.subscription_status;
    new.subscription_expires_at := old.subscription_expires_at;
    new.plan := old.plan;
    new.billing_status := old.billing_status;
    new.last_billed_at := old.last_billed_at;
  end if;
  return new;
end;
$$;
