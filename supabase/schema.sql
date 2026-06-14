-- =============================================================================
-- Verve MVP — Supabase schema (Postgres 15+)
-- =============================================================================
-- This script is the trimmed MVP cut of the full schema in
-- architecture/Verve technical implementation specification.docx.
--
-- It covers the MVP feature set selected for the mobile app:
--   • Auth + role-based profiles (client + trainer)
--   • Practitioner-client linking
--   • Exercise library (system) + Programs assigned to clients
--   • Append-only adherence ledger
--   • Bookings (1-on-1 sessions)
--   • Conversations + messages
--
-- Apply order:
--   1) schema.sql      -- this file
--   2) rls.sql         -- row-level security policies
--   3) seed.sql        -- a handful of demo exercises (optional)
--
-- Run inside Supabase: Project → SQL Editor → paste → Run.
-- =============================================================================

create extension if not exists "pgcrypto";

-- ── Enums ────────────────────────────────────────────────────────────────────
do $$ begin
  create type role as enum ('physio', 'trainer', 'client', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type link_role as enum ('physio', 'trainer');
exception when duplicate_object then null; end $$;

do $$ begin
  create type link_status as enum ('pending', 'active', 'discharged', 'archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type program_status as enum ('draft', 'active', 'paused', 'completed', 'archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type booking_type as enum ('pt_session', 'group_class', 'rehab_session', 'assessment', 'online_session');
exception when duplicate_object then null; end $$;

do $$ begin
  create type booking_status as enum ('pending', 'confirmed', 'cancelled', 'completed', 'no_show');
exception when duplicate_object then null; end $$;

do $$ begin
  create type conversation_type as enum ('direct', 'group', 'practitioner_handoff');
exception when duplicate_object then null; end $$;

-- ── 1. Profiles (1:1 with auth.users) ────────────────────────────────────────
create table if not exists public.profiles (
  id                   uuid primary key references auth.users(id) on delete cascade,
  email                text not null unique,
  role                 role not null default 'client',
  first_name           text,
  last_name            text,
  phone                text,
  avatar_url           text,
  bio                  text,
  locale               text default 'en',
  timezone             text default 'Europe/Luxembourg',
  onboarding_completed boolean default false,
  push_token           text,
  created_at           timestamptz default now(),
  updated_at           timestamptz default now()
);

-- Auto-create a profile row whenever a user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role, first_name, last_name)
  values (
    new.id,
    new.email,
    coalesce((new.raw_user_meta_data->>'role')::role, 'client'),
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── 2. Role-specific profile extensions ──────────────────────────────────────
create table if not exists public.client_profiles (
  user_id        uuid primary key references public.profiles(id) on delete cascade,
  date_of_birth  date,
  gender         text,
  height_cm      numeric(5,1),
  weight_kg      numeric(5,1),
  primary_goal   text,
  medical_notes  text,
  body_type      text
);
alter table public.client_profiles add column if not exists body_type text;

create table if not exists public.trainer_profiles (
  user_id            uuid primary key references public.profiles(id) on delete cascade,
  certifications     text[],
  specialties        text[],
  session_price      numeric(8,2),
  group_class_price  numeric(8,2),
  years_experience   integer,
  accepts_new        boolean default true
);

-- ── 3. Practitioner-client links ─────────────────────────────────────────────
create table if not exists public.practitioner_client_links (
  id              uuid primary key default gen_random_uuid(),
  practitioner_id uuid not null references public.profiles(id) on delete cascade,
  client_id       uuid not null references public.profiles(id) on delete cascade,
  role            link_role not null,
  status          link_status default 'active',
  linked_at       timestamptz default now(),
  discharged_at   timestamptz,
  notes           text,
  unique (practitioner_id, client_id, role)
);

create index if not exists idx_links_practitioner on public.practitioner_client_links(practitioner_id, status);
create index if not exists idx_links_client       on public.practitioner_client_links(client_id, status);

-- ── 4. Exercise library ──────────────────────────────────────────────────────
create table if not exists public.exercises (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  category        text,
  equipment       text[],
  difficulty      text check (difficulty in ('beginner','intermediate','advanced')),
  description     text,
  setup_cues      text,
  execution_cues  text,
  primary_muscles jsonb not null default '[]'::jsonb,
  video_url       text,
  thumbnail_url   text,
  is_system       boolean default true,
  created_by      uuid references public.profiles(id),
  is_active       boolean default true,
  created_at      timestamptz default now()
);

create index if not exists idx_exercises_active on public.exercises(is_active);

-- ── 5. Programs ──────────────────────────────────────────────────────────────
create table if not exists public.programs (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  created_by      uuid not null references public.profiles(id),
  assigned_to     uuid references public.profiles(id),
  focus           text,
  phase           text,
  duration_weeks  integer,
  days            jsonb not null default '[]'::jsonb,
  status          program_status default 'draft',
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index if not exists idx_programs_assigned on public.programs(assigned_to, status);
create index if not exists idx_programs_creator  on public.programs(created_by);

-- ── 6. Adherence ledger (append-only) ────────────────────────────────────────
create table if not exists public.adherence_ledger (
  id               uuid primary key default gen_random_uuid(),
  client_id        uuid not null references public.profiles(id),
  program_id       uuid not null references public.programs(id),
  day_index        integer not null,
  started_at       timestamptz not null default now(),
  completed_at     timestamptz,
  duration_seconds integer,
  exercises_logged jsonb not null default '[]'::jsonb,
  wearable_hr_avg  integer,
  wearable_source  text,
  previous_hash    text,
  entry_hash       text,
  created_at       timestamptz default now()
);

alter table public.adherence_ledger
  add column if not exists previous_hash text,
  add column if not exists entry_hash text;

create index if not exists idx_adherence_client_program on public.adherence_ledger(client_id, program_id, created_at desc);
create index if not exists idx_adherence_client_chain on public.adherence_ledger(client_id, created_at, id);

create or replace function public.compute_adherence_entry_hash(
  p_id uuid,
  p_client_id uuid,
  p_program_id uuid,
  p_day_index integer,
  p_started_at timestamptz,
  p_completed_at timestamptz,
  p_duration_seconds integer,
  p_exercises_logged jsonb,
  p_wearable_hr_avg integer,
  p_wearable_source text,
  p_previous_hash text,
  p_created_at timestamptz
)
returns text
language sql
stable
as $$
  select encode(
    digest(
      convert_to(
        jsonb_build_object(
          'id', p_id,
          'client_id', p_client_id,
          'program_id', p_program_id,
          'day_index', p_day_index,
          'started_at', p_started_at,
          'completed_at', p_completed_at,
          'duration_seconds', p_duration_seconds,
          'exercises_logged', coalesce(p_exercises_logged, '[]'::jsonb),
          'wearable_hr_avg', p_wearable_hr_avg,
          'wearable_source', p_wearable_source,
          'previous_hash', p_previous_hash,
          'created_at', p_created_at
        )::text,
        'UTF8'
      ),
      'sha256'
    ),
    'hex'
  );
$$;

create or replace function public.set_adherence_hash_chain()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  prior_hash text;
begin
  if new.id is null then
    new.id := gen_random_uuid();
  end if;

  if new.created_at is null then
    new.created_at := now();
  end if;

  select entry_hash
    into prior_hash
  from public.adherence_ledger
  where client_id = new.client_id
  order by created_at desc, id desc
  limit 1;

  -- The database owns the chain fields so clients cannot forge ledger integrity.
  new.previous_hash := prior_hash;
  new.entry_hash := public.compute_adherence_entry_hash(
    new.id,
    new.client_id,
    new.program_id,
    new.day_index,
    new.started_at,
    new.completed_at,
    new.duration_seconds,
    new.exercises_logged,
    new.wearable_hr_avg,
    new.wearable_source,
    new.previous_hash,
    new.created_at
  );

  return new;
end;
$$;

drop trigger if exists trg_adherence_hash_chain on public.adherence_ledger;
create trigger trg_adherence_hash_chain
  before insert on public.adherence_ledger
  for each row execute function public.set_adherence_hash_chain();

create or replace function public.verify_adherence_chain(p_client_id uuid)
returns table (
  id uuid,
  previous_hash text,
  expected_previous_hash text,
  entry_hash text,
  expected_entry_hash text,
  chain_ok boolean
)
language sql
stable
security definer
set search_path = public
as $$
  with ordered as (
    select
      a.*,
      lag(a.entry_hash) over (partition by a.client_id order by a.created_at, a.id) as expected_previous_hash
    from public.adherence_ledger a
    where a.client_id = p_client_id
  )
  select
    ordered.id,
    ordered.previous_hash,
    ordered.expected_previous_hash,
    ordered.entry_hash,
    public.compute_adherence_entry_hash(
      ordered.id,
      ordered.client_id,
      ordered.program_id,
      ordered.day_index,
      ordered.started_at,
      ordered.completed_at,
      ordered.duration_seconds,
      ordered.exercises_logged,
      ordered.wearable_hr_avg,
      ordered.wearable_source,
      ordered.previous_hash,
      ordered.created_at
    ) as expected_entry_hash,
    ordered.previous_hash is not distinct from ordered.expected_previous_hash
      and ordered.entry_hash is not distinct from public.compute_adherence_entry_hash(
        ordered.id,
        ordered.client_id,
        ordered.program_id,
        ordered.day_index,
        ordered.started_at,
        ordered.completed_at,
        ordered.duration_seconds,
        ordered.exercises_logged,
        ordered.wearable_hr_avg,
        ordered.wearable_source,
        ordered.previous_hash,
        ordered.created_at
      ) as chain_ok
  from ordered
  order by ordered.created_at, ordered.id;
$$;

-- ── 7. Bookings ──────────────────────────────────────────────────────────────
create table if not exists public.bookings (
  id                uuid primary key default gen_random_uuid(),
  practitioner_id   uuid not null references public.profiles(id),
  client_id         uuid references public.profiles(id),
  booking_type      booking_type not null default 'pt_session',
  starts_at         timestamptz not null,
  ends_at           timestamptz not null,
  status            booking_status default 'confirmed',
  title             text,
  description       text,
  price             numeric(8,2),
  currency          text default 'EUR',
  location          jsonb,
  notes             text,
  cancelled_at      timestamptz,
  cancelled_by      uuid references public.profiles(id),
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

alter table public.bookings
  add column if not exists cancellation_reason text;

create index if not exists idx_bookings_practitioner on public.bookings(practitioner_id, starts_at desc);
create index if not exists idx_bookings_client       on public.bookings(client_id, starts_at desc);

-- ── 8. Conversations + messages ──────────────────────────────────────────────
create table if not exists public.conversations (
  id          uuid primary key default gen_random_uuid(),
  type        conversation_type not null default 'direct',
  direct_key  text,
  title       text,
  created_at  timestamptz default now()
);
alter table public.conversations add column if not exists direct_key text;
create unique index if not exists idx_conversations_direct_key
  on public.conversations(direct_key)
  where type = 'direct' and direct_key is not null;

create table if not exists public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  role            text default 'member' check (role in ('member','admin')),
  last_read_at    timestamptz,
  muted           boolean default false,
  primary key (conversation_id, user_id)
);

create table if not exists public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id       uuid not null references public.profiles(id),
  content         text not null,
  message_type    text default 'text' check (message_type in ('text','image','video','file','system')),
  metadata        jsonb,
  created_at      timestamptz default now()
);

create index if not exists idx_messages_conversation on public.messages(conversation_id, created_at);
create index if not exists idx_members_user          on public.conversation_members(user_id);

-- ── 9. updated_at triggers ───────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists trg_programs_updated on public.programs;
create trigger trg_programs_updated before update on public.programs
  for each row execute function public.set_updated_at();

drop trigger if exists trg_bookings_updated on public.bookings;
create trigger trg_bookings_updated before update on public.bookings
  for each row execute function public.set_updated_at();

-- ── 10. Clinical constraints (read-only surface in MVP) ─────────────────────
do $$ begin
  create type constraint_severity as enum ('hard','soft','advisory');
exception when duplicate_object then null; end $$;

do $$ begin
  create type constraint_status as enum ('active','cleared','expired','superseded');
exception when duplicate_object then null; end $$;

create table if not exists public.clinical_constraints (
  id              uuid primary key default gen_random_uuid(),
  patient_id      uuid not null references public.profiles(id) on delete cascade,
  physio_id       uuid references public.profiles(id),
  constraint_type text not null,
  target          text not null,
  value           text,
  severity        constraint_severity default 'hard',
  body_region     text,
  notes           text,
  status          constraint_status default 'active',
  created_at      timestamptz default now(),
  cleared_at      timestamptz
);

create index if not exists idx_constraints_patient on public.clinical_constraints(patient_id, status);
