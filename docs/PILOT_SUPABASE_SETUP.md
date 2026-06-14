# Pilot Supabase Setup

Use this private runbook before executing `mobile/docs/PILOT_TEST_PLAN.md`.

## SQL Order

Apply these files in the pilot Supabase project:

1. `mobile/supabase/schema.sql`
2. `mobile/supabase/rls.sql`
3. `mobile/supabase/realtime.sql`
4. `mobile/supabase/storage.sql`
5. `mobile/supabase/seed.sql` if you want the demo exercise/program baseline

## Required Auth Users

Create confirmed Supabase Auth users for:

- `pilot.client@verve.dev` with `public.profiles.role = 'client'`
- `pilot.trainer@verve.dev` with `public.profiles.role = 'trainer'`

Keep the password in your private password manager, not in git.

## Minimum Pilot Data

Before testing, ensure:

- One active `practitioner_client_links` row connects the trainer to the client.
- The client has at least one active assigned program with one day and one exercise.
- The trainer has at least one upcoming booking with the client.
- The client and trainer can create or open a direct conversation.
- At least one `clinical_constraints` row exists for the client, preferably one active `blocked_exercise` row for constraint UI validation.

## Storage Check

After applying `storage.sql`, sign in as each pilot account and upload an avatar from Profile. PASS if the URL persists in `profiles.avatar_url` and the image renders after sign-out/sign-in.
