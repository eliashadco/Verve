-- Enable Realtime for clinical_constraints (P-4.1). Apply in Supabase SQL editor or migrations.
-- Requires replication; default Supabase project includes publication `supabase_realtime`.

alter publication supabase_realtime add table public.clinical_constraints;
