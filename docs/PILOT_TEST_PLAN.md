# Verve Mobile — Pilot Tester Script

This document recreates the intent of `frontend/README.md` **Pilot Tester Script (30 Minutes)** for the **Expo + Supabase** mobile app (P-4.5). Use it on **iOS Expo Go** and **Android Expo Go** per MVP launch readiness in the architecture roadmap.

**How to track results:** Copy the sign-off table into a Notion (or similar) QA page. Record `PASS` or `FAIL` per row, tester name, date, device model, and OS version. Attach screenshots for every `FAIL`.

---

## Seeded pilot accounts (two roles)

Create these users in **Supabase Auth** (Authentication → Users) with confirmed email, and ensure matching rows exist in `public.profiles` with the correct `role`. Link client ↔ trainer via `practitioner_client_links` if your pilot data requires it.

| Account | Email (roadmap) | Role | Notes |
|---------|-----------------|------|--------|
| Pilot client | `pilot.client@verve.dev` | `client` | Exercises full client pillar list |
| Pilot trainer | `pilot.trainer@verve.dev` | `trainer` | Mirrors web pilot email from `frontend/README.md` |

**Password:** Use a shared pilot password agreed with the team (the web README uses `PilotPass123!` for the trainer; you may reuse it for both pilot mobile users or set distinct passwords—document the value in your private runbook, not in git).

---

## Pre-flight (both platforms)

1. Supabase project has `schema.sql`, `rls.sql`, `realtime.sql`, `storage.sql`, and the minimum pilot data from `mobile/docs/PILOT_SUPABASE_SETUP.md` applied; `mobile/.env` contains `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
2. From `mobile/`, run `npm install` then `npx expo start`; open the project in **Expo Go** on a physical iPhone and a physical Android device (or two runs if one device).
3. Optional: set `EXPO_PUBLIC_SENTRY_DSN` so errors from the pilot surface in Sentry (P-4.4).
4. **Result:** `PASS` if the app bundle loads and reaches welcome or login without a redbox crash.

---

## Part A — Client role (`pilot.client@verve.dev`)

Complete in order where possible. Each step: `PASS` only if the criterion holds after a pull-to-refresh where the screen supports it.

### A1. Auth

1. Sign out if already signed in (Profile → sign out).
2. Register is optional for pilot if accounts already exist; otherwise register a throwaway or use seeded logins.
3. Sign in as **pilot client**.
4. **PASS** if you land on **Client Home** without an auth loop or blank screen.

### A2. Home / dashboard (pillar 2)

1. Open **Home** tab.
2. Confirm hero cards, streak or stats region, and empty states or real data render without crash.
3. **PASS** if primary CTAs (e.g. program / live) are tappable and navigate.

### A3. Programs (pillar 3)

1. Open **Programs** from the home flow (programs tab may be hidden from the tab bar; use in-app navigation from Home).
2. Open an assigned program → day list → **Start day** / live entry if shown.
3. **PASS** if program list and detail load; exercise names resolve (no crash on missing exercise).

### A4. Live session (pillar 4)

1. From **Live** tab (or program day CTA), start a session for a program day.
2. Log at least one set (reps / weight as applicable), use optional rest timer / checkbox if present.
3. **Finish** the workout so an `adherence_ledger` row is written.
4. **PASS** if completion succeeds and you return without a stuck loading state.

### A5. Booking (pillar 5)

1. Open **Booking** tab.
2. Confirm upcoming (and history if present) lists render.
3. If **cancel** exists, exercise it once and confirm UI updates.
4. **PASS** if lists load and any mutation matches server state after refresh.

### A6. Messages (pillar 6)

1. Open **Messages** tab.
2. Open an existing conversation or start one from the roster FAB if available.
3. Send a short message; confirm it appears (realtime).
4. **PASS** if send works and no duplicate subscription warnings flood the console.

### A7. Profile (pillar 7)

1. Open **Profile** tab.
2. Edit a safe field (e.g. locale, name, or bio), save, leave and return (or pull to refresh).
3. Sign out and sign back in.
4. **PASS** if edits persist and sign-out returns to auth flow.

### A8. Progress & therapy (client-only surfaces)

1. **Progress** tab: charts or empty state; history or “load more” if implemented.
2. **Therapy** (if reachable from Home): constraints list or empty state.
3. **PASS** if both screens load without crash.

---

## Part B — Trainer role (`pilot.trainer@verve.dev`)

Sign out, then sign in as **pilot trainer**.

### B1. Home

1. **Home** tab: KPIs or attention cards load.
2. **PASS** if dashboard is usable and pull-to-refresh works.

### B2. Clients

1. **Clients** tab: list loads; open a **client detail** screen.
2. **PASS** if roster and detail render (constraints / programs sections may be empty).

### B3. Programs (trainer)

1. **Programs** tab: list and program detail.
2. Perform any supported trainer actions (assign, duplicate, archive) **only if** your seed data and policies allow it.
3. **PASS** if read path is solid; write path `PASS` only if actions succeed without RLS errors.

### B4. Bookings / schedule

1. **Bookings** tab: list loads; confirm status / reschedule actions if implemented.
2. **PASS** if schedule is readable and any pilot mutation persists after refresh.

### B5. Messages

1. Same as A6 but as trainer; confirm thread with pilot client if linked.
2. **PASS** if send/receive works.

### B6. Profile

1. Edit trainer-specific fields; save; verify persistence.
2. **PASS** if save succeeds.

---

## Part C — Cross-cutting checks

### C1. RLS / tenancy (roadmap acceptance gate)

1. While signed in as **pilot client**, note one **other** client’s name or id that must **not** appear in your data (or use a second test account if you have one).
2. Confirm conversations, bookings, and programs never show another tenant’s private rows.
3. **PASS** if no cross-tenant data leaks (spot-check is enough for pilot; full audit is engineering-led).

### C2. Performance (subjective)

1. Cold launch from killed state on **mid-range Android over cellular** (optional but recommended).
2. **PASS** if perceived time-to-interactive is under **~4 seconds** (roadmap guideline).

### C3. Localization (if enabled)

1. Set profile locale to **French** (if supported in Profile), restart app or refresh profile.
2. **PASS** if tab labels and a sample screen show French copy without layout breakage.

---

## Device matrix (analogue to web “Device Width Pass”)

| Environment | Check | Result (`PASS`/`FAIL`) | Notes |
|-------------|-------|-------------------------|-------|
| iOS | Expo Go — full client script (Part A) |  |  |
| iOS | Expo Go — full trainer script (Part B) |  |  |
| Android | Expo Go — full client script (Part A) |  |  |
| Android | Expo Go — full trainer script (Part B) |  |  |

---

## Defect reporting format

Use the same discipline as the web README:

- **Step:**
- **Expected:**
- **Actual:**
- **Screenshot / screen recording:**
- **Environment:** (Expo Go vs dev build, iOS/Android version, commit hash or EAS update id, locale)

---

## Pilot sign-off sheet (copy to Notion)

| Area | Check | Result (`PASS`/`FAIL`) | Owner | Date | Evidence / Notes |
|------|-------|-------------------------|-------|------|------------------|
| Access | Client login → home |  |  |  |  |
| Access | Trainer login → home |  |  |  |  |
| Client | Home dashboard usable |  |  |  |  |
| Client | Programs list + detail |  |  |  |  |
| Client | Live session finish → adherence |  |  |  |  |
| Client | Booking list (+ cancel if applicable) |  |  |  |  |
| Client | Messages send/receive |  |  |  |  |
| Client | Profile edit + sign out |  |  |  |  |
| Client | Progress screen |  |  |  |  |
| Client | Therapy / constraints (if in build) |  |  |  |  |
| Trainer | Home dashboard |  |  |  |  |
| Trainer | Clients list + detail |  |  |  |  |
| Trainer | Programs + detail |  |  |  |  |
| Trainer | Bookings / schedule |  |  |  |  |
| Trainer | Messages |  |  |  |  |
| Trainer | Profile persistence |  |  |  |  |
| Security | No cross-tenant data visible (spot check) |  |  |  |  |
| Performance | Cold start acceptable on Android / 4G |  |  |  |  |
| i18n | FR locale smoke (if enabled) |  |  |  |  |

**Sign-off rule (same spirit as web):** The pilot run is approved only if every row is `PASS`, or every `FAIL` has an owner and a fix ETA.

---

## Mapping: web script → mobile

| Web README step | Mobile equivalent |
|-----------------|-------------------|
| Backend `/health` | Supabase project reachable; Expo loads JS bundle |
| `/login` + trainer | Expo app auth screens + `pilot.trainer@verve.dev` |
| Bootstrap / roster | Client Home; Trainer Clients |
| Schedule / booking | Client Booking; Trainer Bookings |
| Live session save | Client Live session finish |
| Program save / assign | Client Programs / detail; Trainer Programs (writes optional) |
| Profile persistence | Client + Trainer Profile |
| Business Suite “coming soon” | *N/A on mobile MVP* — skip |
| `/preview/trainer` | *N/A* — use real trainer login on Expo Go |
| Responsive widths | **Device matrix** above (iOS + Android Expo Go) |

---

## References

- Roadmap: `architecture/Verve Mobile Roadmap.md` — Part 1.1 (pillars), Part 1.9 (acceptance gates), P-4.5.
- Web pilot script source: `frontend/README.md` — *Pilot Tester Script (30 Minutes)*.
- Store-equivalent builds (P-4.6): `mobile/docs/EAS_TESTFLIGHT_AND_PLAY_INTERNAL.md` and `mobile/eas.json` (`preview` profile).
