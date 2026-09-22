-- ============================================================
-- Migration 18: performance indexes — every tenant table gets an
-- index that leads with business_id, so `where business_id =
-- my_business_id()` (every RLS policy, every list screen) is always
-- an index scan, not a sequential scan, even as a business's own
-- data grows into the thousands of rows the roadmap flagged.
-- Safe to run on the live project — CREATE INDEX IF NOT EXISTS only.
-- Re-run any time; also closes the WARNING rows from
-- audit_tenant_isolation() (see migration_16).
-- ============================================================
do $$
declare
  t record;
begin
  for t in
    select c.relname as rel
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    join pg_attribute a on a.attrelid = c.oid
                       and a.attname = 'business_id' and not a.attisdropped
    where n.nspname = 'public' and c.relkind = 'r'
  loop
    execute format(
      'create index if not exists %I on %I (business_id)',
      'idx_' || t.rel || '_business_id', t.rel
    );
  end loop;
end $$;
