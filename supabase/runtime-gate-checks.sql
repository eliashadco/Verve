-- =============================================================================
-- Verve MVP runtime gates
-- =============================================================================
-- Run only after applying, in order:
--   1) mobile/supabase/schema.sql
--   2) mobile/supabase/rls.sql
--   3) mobile/supabase/seed.sql
--
-- Replace the UUID placeholders with real seeded auth.users/profile IDs.
-- These checks require a Supabase project connection or a running local
-- Supabase stack; they cannot be completed from Expo-only environment vars.
-- =============================================================================

-- 1) Hash-chain function exists and returns only valid rows for the pilot client.
-- Expected: zero rows.
select *
from public.verify_adherence_chain('<pilot-client-uuid>'::uuid)
where chain_ok is not true;

-- 2) Adherence rows have database-owned chain fields.
-- Expected: zero rows after at least one completed live session.
select id, previous_hash, entry_hash
from public.adherence_ledger
where client_id = '<pilot-client-uuid>'::uuid
  and entry_hash is null;

-- 3) Append-only protection.
-- Expected when executed as the pilot client authenticated role: permission denied
-- or zero affected rows. Do not run as service_role/postgres because those bypass RLS.
-- update public.adherence_ledger
-- set duration_seconds = duration_seconds
-- where client_id <> auth.uid();

-- 4) Cross-tenant denial.
-- Expected when executed as pilot.client@verve.dev: zero rows.
-- select *
-- from public.programs
-- where assigned_to = '<unrelated-client-uuid>'::uuid;

-- 5) Seeded trainer/client boundaries.
-- Expected when executed as pilot.trainer@verve.dev: linked client rows are visible,
-- unrelated client rows are not visible.
-- select *
-- from public.adherence_ledger
-- where client_id in ('<pilot-client-uuid>'::uuid, '<unrelated-client-uuid>'::uuid);
