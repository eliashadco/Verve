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
