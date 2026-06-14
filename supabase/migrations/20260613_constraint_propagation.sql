-- ── Constraint propagation: physio write access ──────────────────────────────
drop policy if exists constraints_physio_insert on public.clinical_constraints;
create policy constraints_physio_insert on public.clinical_constraints
  for insert with check (
    physio_id = auth.uid()
    and is_linked(auth.uid(), patient_id)
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'physio')
  );

drop policy if exists constraints_physio_update on public.clinical_constraints;
create policy constraints_physio_update on public.clinical_constraints
  for update using (
    physio_id = auth.uid()
    and is_linked(auth.uid(), patient_id)
  );

-- ── Propagation event ledger ─────────────────────────────────────────────────
create table if not exists public.constraint_events (
  id            uuid primary key default gen_random_uuid(),
  constraint_id uuid not null references public.clinical_constraints(id) on delete cascade,
  patient_id    uuid not null references public.profiles(id) on delete cascade,
  event_type    text not null check (event_type in ('created','updated','cleared','delivered','enforced','acknowledged')),
  actor_id      uuid references public.profiles(id),
  metadata      jsonb default '{}'::jsonb,
  created_at    timestamptz default now()
);

create index if not exists idx_constraint_events_patient on public.constraint_events(patient_id, created_at desc);
create index if not exists idx_constraint_events_constraint on public.constraint_events(constraint_id, created_at desc);

create unique index if not exists uq_constraint_events_once
  on public.constraint_events(constraint_id, event_type, actor_id)
  where event_type in ('delivered','acknowledged');

alter table public.constraint_events enable row level security;

drop policy if exists constraint_events_read on public.constraint_events;
create policy constraint_events_read on public.constraint_events
  for select using (
    patient_id = auth.uid()
    or is_linked(auth.uid(), patient_id)
  );

drop policy if exists constraint_events_insert on public.constraint_events;
create policy constraint_events_insert on public.constraint_events
  for insert with check (
    actor_id = auth.uid()
    and (patient_id = auth.uid() or is_linked(auth.uid(), patient_id))
  );

do $$
begin
  alter publication supabase_realtime add table public.constraint_events;
exception when duplicate_object then null;
end $$;
