-- =============================================================================
-- Pain Markers — user-emitted pain signals during/after fitness sessions
-- =============================================================================
-- Adds a `pain_markers` table so clients can report pain during live sessions
-- and trainers can see a live feed of those signals on the client detail screen.
--
-- Apply order: after schema.sql + rls.sql + constraint_propagation migration.
-- Run inside Supabase: Project → SQL Editor → paste → Run.
-- =============================================================================

create table if not exists public.pain_markers (
  id            uuid primary key default gen_random_uuid(),
  client_id     uuid not null references public.profiles(id) on delete cascade,
  pain_score    integer not null check (pain_score between 0 and 10),
  body_region   text,            -- e.g. 'knee', 'lower back' (from constraint or free text)
  context       text not null default 'live_session'
                  check (context in ('live_session', 'post_session', 'standalone')),
  exercise_id   uuid references public.exercises(id),
  program_id    uuid references public.programs(id),
  notes         text,
  created_at    timestamptz default now()
);

create index if not exists idx_pain_markers_client
  on public.pain_markers(client_id, created_at desc);

alter table public.pain_markers enable row level security;

-- Client can only insert their own pain markers
drop policy if exists pain_markers_insert on public.pain_markers;
create policy pain_markers_insert on public.pain_markers
  for insert with check (client_id = auth.uid());

-- Client + any linked practitioner can read
drop policy if exists pain_markers_read on public.pain_markers;
create policy pain_markers_read on public.pain_markers
  for select using (
    client_id = auth.uid()
    or is_linked(auth.uid(), client_id)
  );

-- Enable realtime so the trainer's panel updates instantly on INSERT
do $$ begin
  alter publication supabase_realtime add table public.pain_markers;
exception when duplicate_object then null;
end $$;
