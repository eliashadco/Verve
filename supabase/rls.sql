-- =============================================================================
-- Verve MVP — Row Level Security policies
-- =============================================================================
-- Implements section 5.2 of the technical spec (Role-Based Access Control)
-- via Postgres RLS so the rules live next to the data.
--
-- Auth identity:
--   auth.uid()        → uuid of the currently authenticated user
--   profile().role    → role enum ('client'|'trainer'|'physio'|'admin')
-- =============================================================================

-- Helper: read the authenticated user's role from public.profiles.
create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role::text from public.profiles where id = auth.uid()
$$;

-- Convenience: are practitioner P and client C currently linked?
create or replace function public.is_linked(practitioner uuid, client uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.practitioner_client_links
    where practitioner_id = practitioner
      and client_id       = client
      and status          = 'active'
  )
$$;

-- Helper: is user U a member of conversation C? (Bypasses RLS to avoid infinite recursion)
create or replace function public.is_conversation_member(conversation uuid, user_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.conversation_members
    where conversation_id = conversation
      and user_id         = user_uuid
  )
$$;

-- Helper: is user U an admin member of conversation C? (Bypasses RLS to avoid infinite recursion)
create or replace function public.is_conversation_member_admin(conversation uuid, user_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.conversation_members
    where conversation_id = conversation
      and user_id         = user_uuid
      and role            = 'admin'
  )
$$;


-- ── Enable RLS on every table ────────────────────────────────────────────────
alter table public.profiles                  enable row level security;
alter table public.client_profiles           enable row level security;
alter table public.trainer_profiles          enable row level security;
alter table public.practitioner_client_links enable row level security;
alter table public.exercises                 enable row level security;
alter table public.programs                  enable row level security;
alter table public.adherence_ledger          enable row level security;
alter table public.bookings                  enable row level security;
alter table public.conversations             enable row level security;
alter table public.conversation_members      enable row level security;
alter table public.messages                  enable row level security;

-- ── Profiles ─────────────────────────────────────────────────────────────────
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using (
    -- Anyone can read their own profile
    id = auth.uid()
    -- Or a profile they're linked to (either side of the link)
    or exists (
      select 1 from public.practitioner_client_links l
      where l.status = 'active'
        and ((l.practitioner_id = auth.uid() and l.client_id = profiles.id)
          or (l.client_id       = auth.uid() and l.practitioner_id = profiles.id))
    )
    -- Trainers/physios can browse practitioner directories
    or role in ('trainer','physio')
  );

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- ── client_profiles / trainer_profiles ───────────────────────────────────────
drop policy if exists client_profiles_owner on public.client_profiles;
create policy client_profiles_owner on public.client_profiles
  for all using (
    user_id = auth.uid()
    or exists (
      select 1 from public.practitioner_client_links l
      where l.status = 'active'
        and l.practitioner_id = auth.uid()
        and l.client_id       = user_id
    )
  )
  with check (user_id = auth.uid());

drop policy if exists trainer_profiles_owner on public.trainer_profiles;
create policy trainer_profiles_owner on public.trainer_profiles
  for all using (
    user_id = auth.uid()
    -- Public read so clients can browse trainers
    or true
  )
  with check (user_id = auth.uid());

-- ── practitioner_client_links ────────────────────────────────────────────────
drop policy if exists links_visible on public.practitioner_client_links;
create policy links_visible on public.practitioner_client_links
  for select using (practitioner_id = auth.uid() or client_id = auth.uid());

drop policy if exists links_create on public.practitioner_client_links;
create policy links_create on public.practitioner_client_links
  for insert with check (practitioner_id = auth.uid() or client_id = auth.uid());

drop policy if exists links_update on public.practitioner_client_links;
create policy links_update on public.practitioner_client_links
  for update using (practitioner_id = auth.uid() or client_id = auth.uid());

-- ── Exercises (library is publicly readable) ─────────────────────────────────
drop policy if exists exercises_read on public.exercises;
create policy exercises_read on public.exercises
  for select using (is_active = true);

drop policy if exists exercises_write on public.exercises;
create policy exercises_write on public.exercises
  for insert with check (current_user_role() in ('trainer','physio','admin'));

-- ── Programs ─────────────────────────────────────────────────────────────────
drop policy if exists programs_read on public.programs;
create policy programs_read on public.programs
  for select using (
    created_by = auth.uid()
    or assigned_to = auth.uid()
    or (
      assigned_to is not null
      and is_linked(auth.uid(), assigned_to)
    )
  );

drop policy if exists programs_write on public.programs;
create policy programs_write on public.programs
  for insert with check (created_by = auth.uid() and current_user_role() in ('trainer','physio','admin'));

drop policy if exists programs_update on public.programs;
create policy programs_update on public.programs
  for update using (created_by = auth.uid())
  with check (created_by = auth.uid());

-- ── Adherence ledger (insert-only, owner reads, linked practitioners read) ──
drop policy if exists adherence_read on public.adherence_ledger;
create policy adherence_read on public.adherence_ledger
  for select using (
    client_id = auth.uid()
    or is_linked(auth.uid(), client_id)
  );

drop policy if exists adherence_insert on public.adherence_ledger;
create policy adherence_insert on public.adherence_ledger
  for insert with check (client_id = auth.uid());

-- No update / delete policies → blocked by default. Append-only.

-- ── Bookings ─────────────────────────────────────────────────────────────────
drop policy if exists bookings_read on public.bookings;
create policy bookings_read on public.bookings
  for select using (practitioner_id = auth.uid() or client_id = auth.uid());

drop policy if exists bookings_create on public.bookings;
create policy bookings_create on public.bookings
  for insert with check (practitioner_id = auth.uid() or client_id = auth.uid());

drop policy if exists bookings_update on public.bookings;
create policy bookings_update on public.bookings
  for update using (practitioner_id = auth.uid() or client_id = auth.uid())
  with check (practitioner_id = auth.uid() or client_id = auth.uid());

-- ── Conversations / members / messages ───────────────────────────────────────
drop policy if exists conv_read on public.conversations;
create policy conv_read on public.conversations
  for select using (
    is_conversation_member(id, auth.uid())
  );

drop policy if exists conv_insert on public.conversations;
create policy conv_insert on public.conversations
  for insert with check (true);

drop policy if exists members_read on public.conversation_members;
create policy members_read on public.conversation_members
  for select using (
    is_conversation_member(conversation_id, auth.uid())
  );

drop policy if exists members_insert on public.conversation_members;
create policy members_insert on public.conversation_members
  for insert with check (
    user_id = auth.uid()
    or is_conversation_member_admin(conversation_id, auth.uid())
  );

drop policy if exists members_update on public.conversation_members;
create policy members_update on public.conversation_members
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists messages_read on public.messages;
create policy messages_read on public.messages
  for select using (
    is_conversation_member(conversation_id, auth.uid())
  );

drop policy if exists messages_insert on public.messages;
create policy messages_insert on public.messages
  for insert with check (
    sender_id = auth.uid()
    and is_conversation_member(conversation_id, auth.uid())
  );

-- ── Clinical constraints (client/trainer read-only in MVP) ───────────────────
alter table public.clinical_constraints enable row level security;

drop policy if exists constraints_read on public.clinical_constraints;
create policy constraints_read on public.clinical_constraints
  for select using (
    patient_id = auth.uid()
    or is_linked(auth.uid(), patient_id)
  );
