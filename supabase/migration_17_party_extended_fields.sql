-- ============================================================
-- Migration 17: extra Party Master fields for the "Parties
-- Information" popup (Region, Territory, Ranking, Manual No, Debit /
-- Credit Limit, Province, H.S Code, E.F.S Code, Beneficiary Name,
-- Active flag). Purely additive — safe to run on the live project.
-- Requires migration_15 (sub_head_code) to already be applied.
-- Run it once in the Supabase SQL Editor.
-- ============================================================

alter table parties_customers
  add column if not exists region text,
  add column if not exists territory text,
  add column if not exists ranking text,
  add column if not exists manual_no text,
  add column if not exists debit_limit numeric(14, 2) not null default 0,
  add column if not exists credit_limit numeric(14, 2) not null default 0,
  add column if not exists province text,
  add column if not exists hs_code text,
  add column if not exists efs_code text,
  add column if not exists beneficiary_name text,
  add column if not exists is_active boolean not null default true;

-- Row Level Security + the tenant-isolation policy on parties_customers
-- already cover every column on the table (see migration_16) — nothing
-- else to change there.
