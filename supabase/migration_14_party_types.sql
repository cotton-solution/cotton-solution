-- ============================================================
-- Migration 14: Party Type (Buyer / Seller / Misc Parties).
-- ------------------------------------------------------------
-- Every party now sits under one of three heads in the Chart of
-- Accounts: Buyers (62…), Sellers (63…) or Misc Parties (64…).
-- This only adds one column; every existing party becomes a Buyer
-- (their IDs already start with 62), which you can then change
-- party-by-party in Party Master.
--
-- Safe to run on the live project — no data is touched. Running it
-- twice is harmless. Run once in the Supabase SQL Editor.
-- ============================================================

alter table parties_customers
  add column if not exists party_type text not null default 'buyer';

alter table parties_customers
  drop constraint if exists parties_customers_party_type_check;
alter table parties_customers
  add constraint parties_customers_party_type_check
  check (party_type in ('buyer', 'seller', 'misc'));
