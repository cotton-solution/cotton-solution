-- ============================================================
-- Migration: make the remaining login-page texts editable from
-- the admin "Website Setting" screen:
--   * brand_subtitle  – the small line under the website name
--   * login_title     – "Welcome back !" heading on the login card
--   * login_subtitle  – the line under the heading
--   * copyright_text  – footer line on the login page
-- Text may contain the placeholders {siteName} and {year}.
-- Safe to run on the deployed project (only ADDS columns, and
-- existing rows get the defaults below). Requires migration_3.
-- ============================================================
alter table site_settings
  add column if not exists brand_subtitle text not null default 'Online Accounts Management Software',
  add column if not exists login_title text not null default 'Welcome back !',
  add column if not exists login_subtitle text not null default 'Sign in to access your business dashboard.',
  add column if not exists copyright_text text not null default '© {year} {siteName} - All Rights Reserve';
