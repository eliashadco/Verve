-- P-4.2: add device push token to profiles (run on existing Supabase projects).
alter table public.profiles add column if not exists push_token text;
