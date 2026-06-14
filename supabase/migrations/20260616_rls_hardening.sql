-- ============================================================================
-- RLS hardening (security audit 2026-06-14)
-- Apply to the live Supabase project AFTER the base schema + rls.sql.
-- ============================================================================

-- ── H1: trainer_profiles was `for all using (... or true)`, which left DELETE
--        open to every authenticated user (anyone could delete any trainer's
--        profile). Split into a public read + owner-only writes.
drop policy if exists trainer_profiles_owner on public.trainer_profiles;

create policy trainer_profiles_read on public.trainer_profiles
  for select using (true);                       -- clients may browse trainers

create policy trainer_profiles_insert on public.trainer_profiles
  for insert with check (user_id = auth.uid());

create policy trainer_profiles_update on public.trainer_profiles
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy trainer_profiles_delete on public.trainer_profiles
  for delete using (user_id = auth.uid());

-- ── H2: members_insert allowed `user_id = auth.uid()` unconditionally, so any
--        user could add themselves to ANY conversation (if they learned its id)
--        and read its messages. Allow self-add only when creating a brand-new
--        conversation (no members yet); existing members are added by an admin
--        or via the create_direct_conversation() RPC (security definer).
drop policy if exists members_insert on public.conversation_members;
create policy members_insert on public.conversation_members
  for insert with check (
    is_conversation_member_admin(conversation_id, auth.uid())
    or (
      user_id = auth.uid()
      and not exists (
        select 1 from public.conversation_members m
        where m.conversation_id = conversation_members.conversation_id
      )
    )
  );

-- ── M1: profiles_select exposed EVERY trainer/physio row — including email,
--        phone and push_token — to every authenticated user. The app never
--        browses all practitioners; it only reads (a) your own profile,
--        (b) linked clients/practitioners, and (c) people you share a chat with
--        (for displaying names/avatars). Replace the blanket role exposure with
--        a precise "shared conversation" allowance via a security-definer helper.
create or replace function public.shares_conversation(other_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.conversation_members me
    join public.conversation_members them
      on them.conversation_id = me.conversation_id
    where me.user_id   = auth.uid()
      and them.user_id = other_user
  )
$$;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using (
    id = auth.uid()
    or exists (
      select 1 from public.practitioner_client_links l
      where l.status = 'active'
        and ((l.practitioner_id = auth.uid() and l.client_id = profiles.id)
          or (l.client_id       = auth.uid() and l.practitioner_id = profiles.id))
    )
    or public.shares_conversation(profiles.id)
  );
