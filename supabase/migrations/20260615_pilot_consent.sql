alter table public.profiles add column if not exists consent_version text;
alter table public.profiles add column if not exists consent_at timestamptz;

-- The existing update policy 'profiles_update' in supabase/rls.sql allows users to update their own row (id = auth.uid()), which covers updates to these new columns.
